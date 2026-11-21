"""Exercise the booth and an independent event display against local next dev."""
import io
import os
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageOps, ImageStat
from playwright.sync_api import expect, sync_playwright

from camera_browser import MOCK

BASE = "http://localhost:" + os.environ.get("BOOTH_TEST_PORT", "3001")
ROOT = Path(__file__).resolve().parents[1]
FIXTURE = Path(tempfile.gettempdir()) / "do-booth-display-fixture.png"
if not FIXTURE.exists():
    with Image.open(ROOT / "public/artwork/masters/caricature-sample.png") as source:
        portrait = Image.new("RGB", (1024, 1024), "#966BFC")
        sample = ImageOps.contain(source.convert("RGB"), (900, 900))
        portrait.paste(sample, ((1024 - sample.width) // 2, (1024 - sample.height) // 2))
        portrait.save(FIXTURE)


def test_display(style="lidar", fixture=FIXTURE):
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("BOOTH_BROWSER"),
                                     args=["--disable-gpu"])
        booth = browser.new_page()
        screen = browser.new_page(viewport={"width": 384, "height": 512})
        booth.on("pageerror", lambda error: print(error, flush=True))
        booth.add_init_script(MOCK)
        stage = {"status": "RUNNING"}
        submitted = []
        published = []
        booth.on("request", lambda req: published.append(req) if req.method == "POST"
                 and req.url.endswith("/api/display") and req.headers.get("content-type", "").startswith("image/") else None)

        def job(route):
            resource = route.request.url.rsplit("/", 1)[-1]
            if resource == "portrait":
                route.fulfill(path=str(fixture), content_type="image/png")
            elif resource == "link":
                route.fulfill(json={"url": "/download/local-test", "qr": None, "idleSeconds": 60})
            elif route.request.method == "GET" and not submitted:
                route.fulfill(status=404)
            else:
                if route.request.method == "POST":
                    submitted.append(route.request.headers.get("x-booth-style"))
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
        booth.locator(f'label[for="style-{style}"]').click()
        button("CONTINUE").click()
        portrait = screen.get_by_alt_text("Guest portrait")
        expect(portrait).to_have_count(0)
        button("CAPTURE").click()
        expect(booth.locator('[data-stage="processing"]')).to_be_visible(timeout=30000)
        expect(screen.get_by_alt_text("DO Hotels").locator("..")).to_have_css("opacity", "1")
        assert not published
        assert screen.request.get(BASE + "/api/display").json()["status"] == "idle"
        stage["status"] = "SUCCEEDED"
        expect(screen.locator('[data-ready="true"]')).to_be_visible(timeout=45000)
        assert submitted == [style] and len(published) == 1
        expect(screen.get_by_alt_text("DO Hotels").locator("..")).to_have_css("opacity", "0", timeout=5000)
        source = portrait.get_attribute("src")
        response = screen.request.get(BASE + source)
        assert response.headers["content-type"] == "image/jpeg"
        with Image.open(io.BytesIO(response.body())) as shown, Image.open(fixture) as expected:
            assert shown.width == shown.height
            actual = shown.convert("RGB").resize((64, 64))
            target = expected.convert("RGB").resize((64, 64))
            assert max(ImageStat.Stat(ImageChops.difference(actual, target)).mean) < 3

        def rect(time):
            return portrait.evaluate("""(im,t) => {
              for(const a of document.getAnimations()) if(a instanceof CSSAnimation){
                a.pause(); a.currentTime=t;
              }
              const r=im.getBoundingClientRect();
              return [r.x,r.y,r.width,r.height];
            }""", time)

        x, y, w, h = rect(1500)
        assert abs(x + w / 2 - 192) < 20 and abs(y + h / 2 - 256) < 20
        assert w < 384 and h < 512
        right = rect(3000)
        left = rect(5100)
        assert right[0] + right[2] / 2 > 192
        assert left[0] + left[2] / 2 < 192
        assert rect(10700)[2] < w / 2
        assert rect(11000)[2] == 0
        print("PASS", style, "centered portrait floats gently and shrinks away", flush=True)
        save = booth.locator('[data-stage="result"] button').filter(has=booth.locator("svg"))
        expect(save).to_be_enabled(timeout=120000)
        expect(portrait).to_have_attribute("src", source)
        assert len(published) == 1
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
    test_display("lidar", Path(os.environ.get("BOOTH_TEST_LIDAR_PORTRAIT", FIXTURE)))
    test_display("caricature")
