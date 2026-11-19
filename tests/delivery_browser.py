"""Local HTTP and browser verification for Steps 07–09. Build the app first."""
import json
import os
from pathlib import Path
import tempfile
import unittest

import camera_browser as camera
from playwright.sync_api import expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts/qa/07-09-delivery"

class DeliveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        disk = tempfile.TemporaryDirectory(prefix="do-booth-delivery-test-")
        cls.addClassCleanup(disk.cleanup)
        cls.jobs = Path(disk.name) / "jobs"
        os.environ.update(BOOTH_MODE="local", BOOTH_DATA_DIR=disk.name, BOOTH_MOCK_DELAY_SECONDS="4",
                          BOOTH_QR_IDLE_SECONDS="10", IMAGE_EDIT_PROVIDER="mock",
                          IMAGE_EDIT_API_KEY="private-test-marker-never-return")
        camera.CameraTests.setUpClass.__func__(cls)
        ARTIFACTS.mkdir(parents=True, exist_ok=True)

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1080, "height": 1920}, reduced_motion="reduce")
        self.addCleanup(self.page.close)
        self.page.add_init_script(camera.MOCK)
        self.page.goto(self.url)
        start = self.page.get_by_role("button", name="TAP TO START")
        privacy = self.page.get_by_role("dialog", name="Photo privacy")
        expect(privacy).to_be_hidden()
        expect(self.page.get_by_role("button", name="Privacy", exact=True)).to_have_count(0)
        start.click()
        expect(privacy).to_be_visible()
        self.page.keyboard.press("Escape")
        expect(privacy).to_be_hidden()
        expect(start).to_be_focused()
        start.click()
        privacy.get_by_role("button", name="Agree & continue").click()
        self.page.locator('label[for="style-caricature"]').click()
        self.page.get_by_role("button", name="CONTINUE").click()

    def capture(self):
        button = self.page.get_by_role("button", name="CAPTURE", exact=True)
        expect(button).to_be_enabled()
        button.evaluate("(button) => {button.click(); button.click();}")
        expect(self.page.get_by_role("heading", name="MAKING MAGIC")).to_be_visible()
        self.assertEqual(self.page.evaluate("qa.encoded"), 1)

    def job(self):
        attempt = self.page.evaluate("JSON.parse(sessionStorage.getItem('booth-attempt'))")
        return self.url + "/api/booth/" + attempt["jobId"], {"Authorization": "Bearer " + attempt["owner"]}

    def test_reload_network_recovery_and_private_download(self):
        self.capture()
        self.page.evaluate("document.fonts.ready")
        self.page.screenshot(path=ARTIFACTS / "processing-local.png")
        url, auth = self.job()
        self.page.wait_for_function("""async ([url, headers]) => {
            const r = await fetch(url, {headers});
            return r.ok && (await r.json()).status === "RUNNING";
        }""", arg=[url, auth])
        self.page.route("**/api/booth/**", lambda route: route.abort())
        self.page.reload()
        expect(self.page.get_by_role("heading", name="OOPS!")).to_be_visible(timeout=10000)
        self.page.unroute("**/api/booth/**")
        self.page.get_by_role("button", name="TRY AGAIN").click()
        expect(self.page.get_by_role("heading", name="YOUR LOOK")).to_be_visible(timeout=12000)
        expect(self.page.get_by_text("DEVELOPMENT SAMPLE")).to_be_visible()
        photo = self.page.get_by_role("img", name="Your caricature portrait")
        photo.evaluate("(image) => image.decode()")
        self.page.screenshot(path=ARTIFACTS / "final-result-local.png")
        self.assertEqual(self.page.request.get(url).status, 404)
        self.assertEqual(self.page.request.get(url, headers={"Authorization": "Bearer " + "a" * 64}).status, 404)
        status = self.page.request.get(url, headers=auth)
        self.assertEqual(status.json()["status"], "SUCCEEDED")
        self.assertNotIn("private-test-marker", status.text())
        self.assertNotIn("ownerHash", status.text())
        job_id = status.json()["id"]
        self.assertTrue((self.jobs / job_id / "started.json").is_file())
        self.assertEqual(len(list((self.jobs / job_id).glob("source.*"))), 1)

        self.page.route("**/api/booth/**/link", lambda route: route.abort())
        self.page.get_by_role("button", name="GET MY PHOTO").click()
        expect(self.page.get_by_role("heading", name="OOPS!")).to_be_visible()
        self.page.unroute("**/api/booth/**/link")
        self.page.get_by_role("button", name="TRY AGAIN").click()
        expect(self.page.get_by_role("heading", name="SCAN & SAVE")).to_be_visible()
        local_link = self.page.get_by_role("link", name="Open local download preview")
        href = local_link.get_attribute("href")
        self.assertTrue(href.startswith("/download/"))
        self.assertEqual(self.page.get_by_role("img", name="QR code for your photo download").count(), 0)
        self.page.screenshot(path=ARTIFACTS / "qr-nonpublic-local.png")
        first = self.page.request.post(url + "/link", headers=auth).json()
        self.assertEqual(first["url"], href)
        self.assertIsNone(first["qr"])
        mobile = self.browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        self.addCleanup(mobile.close)
        mobile.goto(self.url + href)
        expect(mobile.get_by_role("heading", name="Your photo")).to_be_visible()
        mobile.get_by_role("img", name="Your caricature portrait").evaluate("(image) => image.decode()")
        self.assertEqual(mobile.evaluate("document.documentElement.scrollWidth"), 390)
        mobile.screenshot(path=ARTIFACTS / "mobile-download-local.png")
        file = mobile.request.get(self.url + href + "/file?save=1")
        self.assertEqual(file.status, 200)
        self.assertEqual(file.headers["content-type"], "image/png")
        self.assertTrue(file.headers["content-disposition"].startswith("attachment;"))
        self.assertEqual(file.body(), (self.jobs / job_id / "portrait.png").read_bytes())
        self.assertEqual(file.body(), self.page.request.get(url + "/portrait", headers=auth).body())
        with mobile.expect_download() as incoming:
            mobile.get_by_role("link", name="Download photo").click()
        self.assertEqual(incoming.value.suggested_filename, "do-hotels-portrait.png")
        altered = href[:-1] + ("b" if href[-1] == "a" else "a")
        self.assertEqual(mobile.request.get(self.url + altered + "/file").status, 404)
        mobile.goto(self.url + altered)
        expect(mobile.get_by_role("heading", name="Photo unavailable")).to_be_visible()
        self.page.bring_to_front()
        self.page.reload()
        expect(self.page.get_by_role("button", name="GET MY PHOTO")).to_be_enabled(timeout=12000)
        self.page.get_by_role("button", name="GET MY PHOTO").click()
        self.assertEqual(local_link.get_attribute("href"), href)
        self.page.get_by_role("button", name="DONE").click()
        expect(self.page.get_by_role("heading", name="YOU NAILED IT!")).to_be_visible()
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('booth-attempt')"))
        self.page.reload()
        expect(self.page.get_by_role("button", name="TAP TO START")).to_be_visible()
        claim = self.jobs / job_id / "claim.json"
        record = json.loads(claim.read_text())
        record["expiresAt"] = 0
        claim.write_text(json.dumps(record))
        self.assertEqual(mobile.request.get(self.url + href + "/file").status, 404)
        mobile.goto(self.url + href)
        expect(mobile.get_by_role("heading", name="Photo unavailable")).to_be_visible()

    def test_initial_upload_disconnect_persists_capture_and_qr_idle(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        def disconnect(route):
            route.abort() if route.request.method == "POST" else route.continue_()
        self.page.route("**/api/booth/**", disconnect)
        self.capture()
        expect(self.page.get_by_role("heading", name="OOPS!")).to_be_visible(timeout=12000)
        url, auth = self.job()
        self.assertEqual(self.page.request.get(url, headers=auth).status, 404)
        self.page.unroute("**/api/booth/**")
        self.page.reload()
        expect(self.page.get_by_role("button", name="GET MY PHOTO")).to_be_enabled(timeout=12000)
        self.assertEqual(self.page.evaluate("document.documentElement.scrollWidth"), 390)
        self.page.get_by_role("button", name="GET MY PHOTO").click()
        expect(self.page.get_by_role("link", name="Open local download preview")).to_be_visible()
        expect(self.page.get_by_role("heading", name="SCAN & SAVE")).to_be_visible()
        expect(self.page.get_by_role("heading", name="YOU NAILED IT!")).to_be_visible(timeout=14000)
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('booth-attempt')"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
