"""Exercise the booth and an independent event display against local next dev."""
import io
import os
from pathlib import Path

from PIL import Image
from playwright.sync_api import expect, sync_playwright

from camera_browser import MOCK

BASE = "http://localhost:" + os.environ.get("BOOTH_TEST_PORT", "3001")
FIXTURE = Path(__file__).resolve().parents[1] / "artifacts/qa/06-caricature/dry-run-purple.png"


def test_display():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("BOOTH_BROWSER"),
                                     args=["--disable-gpu"])
        booth = browser.new_page()
        screen = browser.new_page(viewport={"width": 1280, "height": 720})
        booth.on("pageerror", lambda error: print(error, flush=True))
        booth.add_init_script(MOCK)
        stage = {"status": "RUNNING"}

        def job(route):
            resource = route.request.url.rsplit("/", 1)[-1]
            if resource == "portrait":
                route.fulfill(path=str(FIXTURE), content_type="image/png")
            elif resource == "link":
                route.fulfill(json={"url": "/download/local-test", "qr": None, "idleSeconds": 60})
            else:
                route.fulfill(json={**stage, "mock": True})

        booth.route("**/api/booth/**", job)
        screen.goto(BASE + "/display", wait_until="domcontentloaded", timeout=120000)
        booth.goto(BASE, wait_until="domcontentloaded", timeout=120000)
        button = lambda name: booth.get_by_role("button", name=name, exact=True)
        start = button("TAP TO START")
        booth.wait_for_function("""() => [...document.querySelectorAll('button')].some(b =>
            b.textContent.includes('TAP TO START') && Object.keys(b).some(k=>k.startsWith('__reactProps')))""",
            timeout=60000)
        start.click()
        labels = booth.locator('label[for^="style-"]')
        labels.first.wait_for()
        lidar = booth.locator('label[for="style-lidar"]')
        (lidar if lidar.count() else labels.first).click()
        button("CONTINUE").click()
        portrait = screen.get_by_alt_text("Guest portrait")
        expect(portrait).to_have_count(0)
        button("CAPTURE").click()
        expect(booth.locator('[data-stage="processing"]')).to_be_visible(timeout=30000)
        expect(screen.locator('[data-ready="true"]')).to_be_visible(timeout=45000)
        expect(screen.get_by_alt_text("DO Hotels").locator("..")).to_have_css("opacity", "0")
        source = portrait.get_attribute("src")
        response = screen.request.get(BASE + source)
        assert response.headers["content-type"] == "image/jpeg"
        with Image.open(io.BytesIO(response.body())) as shot:
            assert abs(shot.width / shot.height - 0.8) < .01
            corners = [shot.getpixel((x, 10)) for x in (10, shot.width - 11)]
            assert any(r > 220 and b < 30 for r, g, b in corners)
            assert any(b > 220 and r < 30 for r, g, b in corners)

        def rect(time):
            return portrait.evaluate("""(im,t) => {
              for(const a of document.getAnimations()) if(a instanceof CSSAnimation){
                a.pause(); a.currentTime=t;
              }
              const r=im.getBoundingClientRect();
              return [r.x,r.y,r.width,r.height];
            }""", time)

        x, y, w, h = rect(900)
        assert abs(x + w / 2 - 640) < 1 and abs(y + h / 2 - 360) < 1
        assert rect(2450)[2] < w / 2
        right = rect(7200)
        bottom = rect(13700)
        assert abs(right[0] + right[2] - 1280) < 1
        assert abs(rect(6200)[1]) < 1 and abs(rect(16700)[0]) < 1
        assert abs(bottom[1] + bottom[3] - 720) < 1
        print("PASS camera JPEG during processing, centered reveal, shrink and all four edges", flush=True)
        stage["status"] = "SUCCEEDED"
        save = booth.locator('[data-stage="result"] button').filter(has=booth.locator("svg"))
        expect(save).to_be_enabled(timeout=120000)
        expect(portrait).to_have_attribute("src", source)
        save.click()
        done = button("DONE")
        expect(done).to_be_visible()
        expect(portrait).to_have_attribute("src", source)
        done.click()
        restart = button("DO IT AGAIN")
        expect(restart).to_be_visible()
        expect(portrait).to_have_attribute("src", source)
        restart.click()
        expect(start).to_be_visible()
        expect(portrait).to_have_count(0, timeout=10000)
        expect(screen.get_by_alt_text("DO Hotels").locator("..")).to_have_css("opacity", "1")
        assert screen.request.get(BASE + source).status == 404
        print("PASS persistence through result, QR and Thank You; Welcome clears photo and restores logos")
        browser.close()


if __name__ == "__main__":
    test_display()
