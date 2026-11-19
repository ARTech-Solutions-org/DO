"""Step 05 integration checks. Build first, then run with Python Playwright and Edge.
Set BOOTH_BROWSER to a Chromium executable on other systems. --screenshots saves simulated QA.
"""
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
import unittest

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = "--screenshots" in sys.argv
if SCREENSHOTS:
    sys.argv.remove("--screenshots")

# Inject only at the browser media boundary. The booth still attaches a live video,
# waits for playback, draws the source crop, and encodes a real JPEG.
MOCK = """
const qa = window.qa = { opens: 0, stops: 0, encoded: 0, streams: [], error: '', gate: false };
const media = new EventTarget();
Object.defineProperty(navigator, 'mediaDevices', {value: media});
media.enumerateDevices = async () => ['a','b'].map(id => ({
    deviceId: id, kind: 'videoinput', label: 'Simulated camera ' + id
}));
media.getUserMedia = async constraints => {
    qa.opens++;
    qa.constraints = constraints;
    if (qa.gate) await new Promise(resolve => qa.release = resolve);
    if (qa.error) throw new DOMException('Test failure', qa.error);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const paint = () => {
        ctx.fillStyle = '#222';
        ctx.fillRect(0,0,1600,1000);
        const gradient = ctx.createLinearGradient(400,0,1200,1000);
        gradient.addColorStop(0,'#e58961');
        gradient.addColorStop(.5,'#7959a9');
        gradient.addColorStop(1,'#281b46');
        ctx.fillStyle = gradient;
        ctx.fillRect(400,0,800,1000);
        ctx.strokeStyle = '#d9c7ec';
        ctx.lineWidth = 2;
        for (const r of [65,140,215,290]) {
            ctx.beginPath(); ctx.arc(800,500,r,0,Math.PI*2); ctx.stroke();
        }
        ctx.fillStyle = '#f00'; ctx.fillRect(400,0,65,65);
        ctx.fillStyle = '#00f'; ctx.fillRect(1135,0,65,65);
        ctx.fillStyle = '#0f0'; ctx.fillRect(400,935,65,65);
        ctx.fillStyle = '#fff'; ctx.fillRect(400+(frame++ % 800),700,5,22);
    };
    paint();
    const stream = canvas.captureStream(12);
    const interval = setInterval(paint,80);
    const track = stream.getVideoTracks()[0];
    const id = constraints.video.deviceId?.exact || 'a';
    track.getSettings = () => ({deviceId:id});
    const stop = track.stop.bind(track);
    track.stop = () => { qa.stops++; clearInterval(interval); stop(); };
    qa.streams.push(stream);
    return stream;
};
const encode = HTMLCanvasElement.prototype.toBlob;
HTMLCanvasElement.prototype.toBlob = function(callback,type,quality) {
    qa.encoded++;
    return encode.call(this, blob => { qa.photo = blob; callback(blob); },type,quality);
};
"""

class CameraTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        cls.url = f"http://127.0.0.1:{port}"
        cls.server = subprocess.Popen(
            [shutil.which("node"), "node_modules/next/dist/bin/next", "start",
             "--hostname", "127.0.0.1", "--port", str(port)], cwd=ROOT,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        cls.addClassCleanup(cls.server.wait, 10)
        cls.addClassCleanup(cls.server.terminate)
        for _ in range(200):
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=.3):
                    break
            except OSError:
                time.sleep(.1)
        cls.pw = sync_playwright().start()
        cls.addClassCleanup(cls.pw.stop)
        executable = os.environ.get("BOOTH_BROWSER")
        if not executable and os.name == "nt":
            executable = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        cls.browser = cls.pw.chromium.launch(executable_path=executable)
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        self.addCleanup(self.page.close)
        self.page.add_init_script(MOCK)
        self.page.goto(self.url)
        self.page.get_by_role("button", name="TAP TO START").click()
        self.page.get_by_role("button", name="Agree & continue").click()
        self.page.locator('label[for="style-caricature"]').click()
        self.capture = self.page.get_by_role("button", name="CAPTURE", exact=True)

    def enter(self):
        self.page.get_by_role("button", name="CONTINUE").click()
        expect(self.page.get_by_role("heading", name="STRIKE A POSE")).to_be_visible()

    def counters(self, opens, stops, frames):
        self.assertEqual(self.page.evaluate("[qa.opens, qa.stops, qa.encoded]"), [opens, stops, frames])

    def test_cancel_blur_and_reuse(self):
        self.enter()
        self.capture.click()
        self.page.get_by_role("button", name="CANCEL").click()
        self.capture.click()
        self.page.evaluate("window.dispatchEvent(new Event('blur'))")
        expect(self.capture).to_be_enabled()
        self.page.wait_for_timeout(3100)
        self.assertTrue(self.page.evaluate("document.querySelector('video').srcObject === qa.streams[0]"))
        self.counters(1, 0, 0)
        self.page.get_by_role("button", name="Back").click()
        self.counters(1, 1, 0)

    def test_duplicate_capture_and_crop(self):
        self.enter()
        expect(self.capture).to_be_enabled()
        self.assertFalse(self.page.evaluate("qa.constraints.audio"))
        self.assertGreaterEqual(self.page.evaluate("qa.constraints.video.width.ideal"), 1920)
        self.assertEqual(self.page.locator("video").evaluate("(v) => getComputedStyle(v).transform"), "matrix(-1, 0, 0, 1, 0, 0)")
        self.capture.evaluate("(button) => {button.click();button.click();}")
        self.assertTrue(self.page.evaluate("document.querySelector('video').srcObject === qa.streams[0]"))
        for beat in ("3", "2", "1"):
            expect(self.page.get_by_role("heading", name=beat, exact=True)).to_be_visible()
        expect(self.page.get_by_role("heading", name="MAKING MAGIC")).to_be_visible()
        self.counters(1, 1, 1)
        self.check_photo(False)

    def check_photo(self, mirrored):
        data = self.page.evaluate("""async () => {
            const image = await createImageBitmap(qa.photo);
            const canvas = document.createElement('canvas');
            canvas.width = image.width; canvas.height = image.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image,0,0);
            const rgb = (x,y) => [...ctx.getImageData(x,y,1,1).data].slice(0,3);
            return [canvas.width,canvas.height,rgb(20,20),rgb(780,20),rgb(20,980),rgb(780,980)];
        }""")
        self.assertEqual(data[:2], [800, 1000])
        left, right = (data[3], data[2]) if mirrored else (data[2], data[3])
        self.assertGreater(left[0], 240)
        self.assertLess(left[2], 15)
        self.assertGreater(right[2], 240)
        self.assertGreater(data[5 if mirrored else 4][1], 240)

    def test_switch_and_mirror(self):
        self.enter()
        expect(self.capture).to_be_enabled()
        self.page.get_by_text("Camera settings").click()
        self.page.get_by_role("combobox").select_option("b")
        expect(self.capture).to_be_enabled()
        self.counters(2, 1, 0)
        self.page.get_by_label("Mirror saved photo").check()
        self.page.get_by_label("Mirror preview").uncheck()
        self.page.get_by_text("Camera settings").click()
        self.capture.click()
        expect(self.page.get_by_role("heading", name="MAKING MAGIC")).to_be_visible()
        self.counters(2, 2, 1)
        self.check_photo(True)

    def test_denied_and_hardware_failure(self):
        self.page.evaluate("qa.error = 'NotAllowedError'")
        self.page.get_by_role("button", name="CONTINUE").click()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Allow camera access")
        self.page.evaluate("qa.error = 'NotReadableError'")
        self.page.get_by_role("button", name="TRY AGAIN").click()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Check the camera connection")
        self.page.evaluate("qa.error = ''")
        self.page.get_by_role("button", name="TRY AGAIN").click()
        expect(self.capture).to_be_enabled()
        self.page.get_by_text("Camera settings").click()
        self.page.get_by_role("combobox").select_option("b")
        expect(self.capture).to_be_enabled()
        self.assertEqual(self.page.evaluate("qa.constraints.video.deviceId.exact"), "b")

    def test_unplug_during_countdown(self):
        self.enter()
        self.capture.click()
        self.page.evaluate("qa.streams[0].getVideoTracks()[0].dispatchEvent(new Event('ended'))")
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Reconnect the camera")
        self.page.wait_for_timeout(3100)
        self.counters(1, 1, 0)
        self.page.get_by_role("button", name="TRY AGAIN").click()
        expect(self.capture).to_be_enabled()
        self.counters(2, 1, 0)

    def test_late_permission_after_back(self):
        self.page.evaluate("qa.gate = true")
        self.enter()
        expect(self.capture).to_be_disabled()
        self.page.wait_for_function("typeof qa.release === 'function'")
        self.page.get_by_role("button", name="Back").click()
        self.page.evaluate("qa.release()")
        self.page.wait_for_function("qa.stops === 1")
        self.counters(1, 1, 0)

    @unittest.skipUnless(SCREENSHOTS, "pass --screenshots for visual QA")
    def test_simulated_screenshots(self):
        self.page.set_viewport_size({"width": 1080, "height": 1920})
        self.enter()
        expect(self.capture).to_be_enabled()
        self.page.evaluate("document.fonts.ready")
        self.page.add_style_tag(content="""body::after { content:'SIMULATED CAMERA · VISUAL QA';
            position:fixed; z-index:10; top:0; right:0; background:#16121f; color:white;
            padding:.5em .9em; font:600 20px system-ui; }""")
        folder = ROOT / "artifacts/qa/05-camera"
        folder.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=folder / "camera-simulated.png")
        self.capture.click()
        expect(self.page.get_by_role("heading", name="3", exact=True)).to_be_visible()
        self.page.screenshot(path=folder / "countdown-simulated.png")

if __name__ == "__main__":
    unittest.main(verbosity=2)
