"""Browser proof against the running Webpack dev server. All job traffic is intercepted."""
import io
import json
import os
from pathlib import Path
import subprocess
import unittest
from urllib.parse import urlparse

from PIL import Image, ImageChops
from playwright.sync_api import expect, sync_playwright

from camera_browser import MOCK

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/qa/dual-theme"
URL = "http://127.0.0.1:3000"
PORTRAIT = ROOT / "artifacts/qa/06-caricature/dry-run-purple.png"


class ThemeTests(unittest.TestCase):
    def test_operator_and_guest_flow(self):
        OUT.mkdir(parents=True, exist_ok=True)
        # Same QR encoder and quiet zone as delivery. This domain is a fixture only.
        fixture = subprocess.check_output([
            "node", "--input-type=module", "-e", "import QRCode from 'qrcode'; "
            "const url='https://booth.invalid/download/synthetic-qa'; "
            "const qr=await QRCode.toDataURL(url,{errorCorrectionLevel:'M',margin:4,scale:12}); "
            "console.log(JSON.stringify({url,qr}));"
        ], cwd=ROOT, text=True)
        link = dict(json.loads(fixture), idleSeconds=60)
        with sync_playwright() as pw:
            edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" if os.name == "nt" else None
            browser = pw.chromium.launch(executable_path=os.environ.get("BOOTH_BROWSER", edge))
            context = browser.new_context(viewport={"width": 1080, "height": 1920}, reduced_motion="reduce",
                                          has_touch=True)
            page = context.new_page()
            page.set_default_timeout(20000)
            page.add_init_script(MOCK)
            page.add_init_script("""new MutationObserver((_, observer) => {
              if (document.body) {
                window.themeAtBody = document.documentElement.dataset.theme;
                observer.disconnect();
              }
            }).observe(document, {childList:true, subtree:true});""")
            external = []
            submissions = 0
            ready = False

            def respond(route):
                nonlocal submissions
                url = urlparse(route.request.url)
                if url.hostname != "127.0.0.1":
                    external.append(url.hostname)
                    route.abort()
                elif not url.path.startswith("/api/booth/"):
                    route.continue_()
                elif url.path.endswith("/portrait"):
                    route.fulfill(path=str(PORTRAIT), content_type="image/png")
                elif url.path.endswith("/link"):
                    route.fulfill(json=link)
                elif route.request.method == "GET" and submissions == 0:
                    route.fulfill(status=404, json={})
                else:
                    if route.request.method == "POST":
                        submissions += 1
                    route.fulfill(json={"status": "SUCCEEDED" if ready else "RUNNING", "mock": True})

            page.route("**/*", respond)
            page.goto(URL, wait_until="networkidle", timeout=120000)
            button = lambda name: page.get_by_role("button", name=name, exact=True)
            hotspot = page.locator("#operator-theme-hotspot")
            root = page.locator("html")
            def taps(n):
                # Wait for hydration, then deliver touches at kiosk cadence.
                hotspot.wait_for()
                page.wait_for_function("""() => Object.keys(document.querySelector('#operator-theme-hotspot'))
                  .some(key => key.startsWith('__reactProps$'))""")
                box = hotspot.bounding_box()
                for _ in range(n):
                    page.touchscreen.tap(box["x"] + box["width"]/2, box["y"] + box["height"]/2)
            def theme(value):
                expect(root).to_have_attribute("data-theme", value)
            geometry = {}
            def screen(name):
                stage = page.locator(f'[data-stage="{name}"]')
                expect(stage).to_be_visible()
                theme(selected)
                self.assertEqual(page.evaluate("document.documentElement.scrollWidth"), 1080)
                self.assertEqual(page.evaluate("document.documentElement.scrollHeight"), 1920)
                if name != "welcome":
                    expect(hotspot).to_have_count(0)
                page.evaluate("document.fonts.ready")
                boxes = stage.locator("header, h1, button, img, video").evaluate_all("""els =>
                  els.map(el => {const {x,y,width,height}=el.getBoundingClientRect();
                    return [x,y,width,height].map(Math.round);})""")
                if selected == "purple":
                    geometry[name] = boxes
                else:
                    self.assertEqual(boxes, geometry[name], name)
                page.screenshot(path=OUT / f"{name}-{selected}.png",
                                style="nextjs-portal { visibility: hidden !important; }")

            theme("purple")
            taps(4)
            theme("purple")
            page.wait_for_timeout(3100)
            taps(1)
            theme("purple")
            taps(4)
            theme("orange")
            page.reload(wait_until="networkidle")
            theme("orange")
            self.assertEqual(page.evaluate("window.themeAtBody"), "orange")
            taps(5)
            theme("purple")
            for selected in ("purple", "orange"):
                if selected == "orange":
                    taps(5)
                submissions, ready = 0, False
                screen("welcome")
                disc = page.locator('[data-stage="welcome"] > div[aria-hidden="true"]').nth(2)
                def motion():
                    return disc.evaluate("(el)=>getComputedStyle(el,'::before').transform")
                self.assertEqual(motion(), "none")
                page.emulate_media(reduced_motion="no-preference")
                first = motion()
                page.wait_for_timeout(140)
                self.assertNotEqual(first, motion())
                page.emulate_media(reduced_motion="reduce")
                for img in page.get_by_role("img").all():
                    self.assertEqual(img.evaluate("el=>getComputedStyle(el).filter"), "none")
                button("TAP TO START").click()
                button("Agree & continue").click()
                page.locator('label[for="style-caricature"]').click()
                screen("choose-style")
                page.evaluate("qa.error='NotAllowedError'")
                button("CONTINUE").click()
                screen("error")
                page.evaluate("qa.error=''")
                button("TRY AGAIN").click()
                expect(button("CAPTURE")).to_be_enabled()
                screen("camera")
                button("CAPTURE").click()
                screen("countdown")
                screen("processing")
                ready = True
                expect(button("GET MY PHOTO")).to_be_enabled()
                screen("result")
                result_img = page.get_by_role("img", name="Your caricature portrait")
                self.assertEqual(result_img.evaluate("""el=>{
                  const c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.drawImage(el,0,0);
                  return Array.from(ctx.getImageData(0,0,1,1).data)
                }"""), [150,107,252,255])
                button("GET MY PHOTO").click()
                qr = page.get_by_role("img", name="QR code for your photo download")
                qr.evaluate("el=>el.decode()")
                self.assertEqual(qr.get_attribute("src"), link["qr"])
                screen("qr")
                pixels = Image.open(io.BytesIO(qr.screenshot())).convert("RGB")
                if selected == "purple":
                    purple_qr = pixels
                else:
                    self.assertIsNone(ImageChops.difference(purple_qr, pixels).getbbox())
                button("DONE").click()
                screen("thank-you")
                button("DO IT AGAIN").click()
                expect(button("TAP TO START")).to_be_focused()
                theme(selected)
                self.assertEqual(submissions, 1)
            page.set_viewport_size({"width":390,"height":844})
            expect(hotspot).to_be_visible()
            expect(button("TAP TO START")).to_be_in_viewport()
            self.assertEqual(page.evaluate("document.documentElement.scrollWidth"), 390)
            page.emulate_media(reduced_motion="no-preference")
            taps(5)
            theme("purple")
            self.assertFalse(external)
            context.close()
            browser.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
