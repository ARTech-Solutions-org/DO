"""Run against the local Webpack booth. All job requests are intercepted."""
import os
from pathlib import Path
import unittest

from playwright.sync_api import expect, sync_playwright

from camera_browser import MOCK

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:3000"
SOURCE = ROOT / "artifacts/qa/06-caricature/dry-run-purple.png"
OUT = ROOT / "artifacts/qa/10-session"
COUNT_BUFFER = """() => new Promise((resolve,reject) => {
  const request=indexedDB.open('booth-capture',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('pending');
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
    const db=request.result;
    const tx=db.transaction('pending','readonly');
    const count=tx.objectStore('pending').count();
    tx.oncomplete=()=>{db.close();resolve(count.result)};
  }
})"""

class SessionRecoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.addClassCleanup(cls.pw.stop)
        default = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" if os.name == "nt" else None
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get("BOOTH_BROWSER", default))
        cls.addClassCleanup(cls.browser.close)
        OUT.mkdir(parents=True, exist_ok=True)

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1080, "height": 1920}, reduced_motion="reduce")
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        expect.set_options(timeout=15000)
        self.submits = 0
        self.recoveries = 0
        self.status = "SUCCEEDED"
        self.link_status = 200
        self.can_recover = False
        self.page.add_init_script(MOCK)
        self.page.add_init_script("""window.photoURLs=[]; window.revokedURLs=[];
          const create=URL.createObjectURL.bind(URL), revoke=URL.revokeObjectURL.bind(URL);
          URL.createObjectURL=value=>{const url=create(value);photoURLs.push(url);return url;};
          URL.revokeObjectURL=url=>{revokedURLs.push(url);revoke(url);};""")
        self.page.route("**/api/booth/**", self.job_api)
        self.page.goto(BASE, wait_until="domcontentloaded", timeout=120000)
        self.page.wait_for_function("""() => {
          const button=document.querySelector('[aria-haspopup=dialog]');
          return button && Object.keys(button).some(key => key.startsWith('__reactProps$'));
        }""", timeout=60000)

    def job_api(self, route):
        resource = route.request.url.rsplit("/", 1)[-1]
        if resource == "portrait":
            route.fulfill(path=str(SOURCE), content_type="image/png")
            return
        if resource == "link":
            route.fulfill(status=self.link_status, json={"url": "/download/test-session",
                "qr": None, "idleSeconds": 60})
            return
        if resource == "recover":
            self.recoveries += 1
            self.status = "SUCCEEDED"
            route.fulfill(json={"status": self.status})
            return
        if route.request.method == "POST":
            self.submits += 1
        elif self.submits == 0:
            route.fulfill(status=404, json={"error": "missing"})
            return
        route.fulfill(json={"status": self.status, "mock": True, "canRecover": self.can_recover,
            "failureStage": "export" if self.can_recover else "generation"})

    def button(self, name):
        return self.page.get_by_role("button", name=name, exact=True)

    def heading(self, name):
        return self.page.get_by_role("heading", name=name, exact=True)

    def choose(self):
        self.button("TAP TO START").click()
        self.button("Agree & continue").click()
        self.page.locator('label[for="style-caricature"]').click()

    def camera(self):
        self.choose()
        self.button("CONTINUE").click()
        expect(self.button("CAPTURE")).to_be_enabled()

    def test_camera_permission_disconnect_and_cancel(self):
        self.choose()
        self.page.evaluate("qa.error = 'NotAllowedError'")
        self.button("CONTINUE").click()
        expect(self.heading("OOPS!")).to_be_visible()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Allow camera access")
        self.page.screenshot(path=OUT / "error-1080x1920.png")
        self.page.evaluate("qa.error = ''")
        self.button("TRY AGAIN").click()
        self.button("CAPTURE").click()
        self.button("CANCEL").click()
        expect(self.button("CAPTURE")).to_be_enabled()
        self.assertEqual(self.page.evaluate("[qa.opens, qa.stops, qa.encoded]"), [2, 0, 0])
        self.button("CAPTURE").click()
        self.page.evaluate("qa.streams[0].getVideoTracks()[0].dispatchEvent(new Event('ended'))")
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Reconnect the camera")
        self.assertEqual(self.page.evaluate("[qa.stops, qa.encoded]"), [1, 0])
        self.button("TRY AGAIN").click()
        expect(self.button("CAPTURE")).to_be_enabled()
        self.button("← Back").click()
        self.assertEqual(self.page.evaluate("[qa.stops, qa.encoded]"), [2, 0])

    def test_export_and_qr_retry_reuse_one_job_then_end_and_clear(self):
        self.status = "FAILED"
        self.can_recover = True
        self.camera()
        self.button("CAPTURE").click()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("saving it again")
        self.button("TRY AGAIN").click()
        expect(self.button("GET MY PHOTO")).to_be_enabled(timeout=20000)
        self.page.wait_for_function("photoURLs.length === 1")
        self.link_status = 410
        self.button("GET MY PHOTO").click()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("missing or expired")
        self.link_status = 200
        self.button("TRY AGAIN").click()
        expect(self.heading("SCAN & SAVE")).to_be_visible()
        expect(self.page.get_by_role("link", name="Open local download preview")).to_be_visible()
        self.button("DONE").click()
        expect(self.heading("YOU NAILED IT!")).to_be_visible()
        self.page.screenshot(path=OUT / "thank-you-1080x1920.png")
        self.assertEqual((self.submits, self.recoveries), (1, 1))
        self.assertTrue(self.page.evaluate("photoURLs.every(url=>revokedURLs.includes(url))"))
        self.assertEqual(self.page.evaluate(COUNT_BUFFER), 0)
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('booth-attempt')"))
        self.button("DO IT AGAIN").click()
        expect(self.button("TAP TO START")).to_be_focused()
        expect(self.page.get_by_role("img", name="Your caricature portrait")).to_have_count(0)
        self.button("TAP TO START").click()
        self.button("Agree & continue").click()
        expect(self.button("CONTINUE")).to_be_disabled()

    def test_offline_start_over_deletes_unsubmitted_capture(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.camera()
        self.button("CAPTURE").click()
        self.context.set_offline(True)
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Check the booth connection")
        self.assertEqual(self.page.evaluate(COUNT_BUFFER), 1)
        self.assertEqual(self.submits, 0)
        self.button("START OVER").click()
        expect(self.button("TAP TO START")).to_be_visible()
        self.context.set_offline(False)
        self.page.wait_for_function(f"async () => (await ({COUNT_BUFFER})()) === 0")
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('booth-attempt')"))

    def test_generation_timeout_starts_fresh_without_repeat(self):
        self.status = "TIMED_OUT"
        self.camera()
        self.button("CAPTURE").click()
        expect(self.page.locator("[data-stage=error]").get_by_role("alert")).to_contain_text("Generation timed out")
        self.button("TRY AGAIN").click()
        expect(self.button("TAP TO START")).to_be_visible()
        self.assertEqual((self.submits, self.recoveries), (1, 0))

    def test_idle_and_history_remove_previous_portrait(self):
        self.camera()
        self.button("CAPTURE").click()
        expect(self.button("GET MY PHOTO")).to_be_enabled(timeout=20000)
        self.page.goto(BASE + "/missing-page", wait_until="domcontentloaded")
        self.page.go_back(wait_until="domcontentloaded")
        expect(self.button("TAP TO START")).to_be_visible(timeout=15000)
        expect(self.page.get_by_role("img", name="Your caricature portrait")).to_have_count(0)
        self.page.wait_for_function("sessionStorage.getItem('booth-attempt') === null")
        self.submits = 0
        self.camera()
        self.button("CAPTURE").click()
        self.button("GET MY PHOTO").click()
        self.button("DONE").click()
        expect(self.heading("YOU NAILED IT!")).to_be_visible()
        expect(self.button("TAP TO START")).to_be_visible(timeout=9000)
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('booth-attempt')"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
