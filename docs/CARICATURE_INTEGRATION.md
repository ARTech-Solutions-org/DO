# Caricature integration · Step 06

The server entry point is `processCaricature(request, repository, storage)` in `src/server/jobs.ts`. It runs the isolated adapter through the existing job reservation and passes the finished opaque PNG to result storage. The kiosk-to-job connection and Processing screen belong to Step 07.

## Source trace and provenance

The legacy directory was inspected read-only. Six source-file SHA-256 hashes were recorded before implementation and compared after the adapter tests. The root package is private and the audit found no application license covering its bespoke code or prompt. The new prompt, preprocessing, mock and compositor are independent implementations. The new project declares Sharp 0.35.5 directly using the version already installed with Next.js.

| Legacy source | Observed behavior | Step 06 implementation |
| --- | --- | --- |
| `src/prompts.js`, especially lines 59–64 | A shared prompt asks for a muted green/teal studio ground and yellow-green light. It also asks for a flattering illustrated likeness and preservation of headwear. | `src/server/caricature/index.ts` selects an original Caricature prompt by style ID. It asks for the subject’s own complexion, expression, hair, clothing and headwear, with clean transparent edges and padding for a purple composition. |
| `src/config.js`, `src/main.js:465–481,530–537` | Capture center-crops to the old print aperture, then downsamples the input to a 1024-pixel long edge and encodes JPEG. | Step 05 supplies the 4:5 booth capture. `portrait.ts` applies orientation metadata, preserves aspect ratio, caps the long edge at 1024 without enlargement, strips metadata and supplies JPEG. |
| `api/caricature.js:47–119` | The OpenAI branch sends the shared prompt and one guest image to Images Edits. The alternate Gemini branch sends text and inline image bytes to generateContent. No separate visual reference accompanies either request. | The new live provider uses the same OpenAI edits endpoint and default model identified in the audit, with one prepared image, a 180-second timeout, and native transparent PNG output. The local mock is the alternative provider. |
| `src/sketch.js:107,249,454,651` | A flood fill and a protected head region create a reveal mask for animated drawing. The reveal ultimately shows the complete generated image. | `portrait.ts` consumes the edited subject’s own alpha channel. The compositor never selects pixels by hue, hair color, skin tone or eye color. |
| `src/main.js:53–103,554,604` | The display uses the returned image, and the framed print export draws it into the aperture. Opaque painted green survives both paths. | The saved PNG contains the actual purple pixels. The old print template, reveal algorithm, private assets, credentials and guest images were excluded. |

## Provider selection

`IMAGE_EDIT_PROVIDER=mock` is the offline default, including when an API key happens to be present. It returns a fixed geometric subject for pipeline QA. For an authorized live run, the new server accepts `IMAGE_EDIT_PROVIDER=openai`, `IMAGE_EDIT_API_KEY`, and `IMAGE_EDIT_MODEL`. Supported choices are `gpt-image-2.5-flare` (default), `gpt-image-2.5-sunburst`, and their `2026-09-08` snapshots. The documented JSON request uses `images[].image_url`, a JPEG data URL, one 1024×1024 edit, and transparent PNG output. The response supplies base64 image bytes. Account entitlement and provider rendering quality require a live test. [OpenAI Images Edits reference](https://developers.openai.com/api/reference/resources/images/methods/edit)

## Pixel contract

The decoder requires one 1024×1024 PNG with alpha, transparent outer padding, at least 10% fully clear pixels and at least 2% opaque subject pixels. These checks reject empty, opaque and cropped plates. They cannot determine whether every individual hair was correctly segmented by a model. The compositor converts to sRGB and blends each straight-alpha channel as `round((foreground × alpha + purple × (255 − alpha)) / 255)`. It preserves opaque foreground RGB, including green details, and writes a lossless, three-channel PNG. Every fully transparent source pixel becomes RGB (150, 107, 252). A defective provider matte can still contain interior contamination or missing strands.

## Measured evidence

The control image is a synthetic green-backed rendering of the geometric mock subject. It illustrates the old color problem and was created locally. All three PNGs use the same invented subject. [Synthetic green control](../artifacts/qa/06-caricature/synthetic-green-control.png) · [Synthetic subject matte](../artifacts/qa/06-caricature/synthetic-matte.png) · [Actual dry-run output](../artifacts/qa/06-caricature/dry-run-purple.png)

| Decoded 1024×1024 PNG measurement | Result |
| --- | --- |
| Fully transparent source pixels | 721,233. All 721,233 decoded to exact `#966BFC`. |
| Fractional-alpha edge pixels | 3,412. Each matched the channel blend, including thin and partially transparent strokes. |
| Opaque foreground pixels | 323,931. Each retained its source RGB, including the green clothing and eyes. |

`npm test` exercises input immutability, dimensions, prompt selection, alpha rejection, all output pixels, the mock job/storage path, and the live provider request contract through an injected local transport. Set `BOOTH_LEGACY_READONLY_ROOT` to the inspected source directory to include the six-file integrity check.

No image was uploaded and no chargeable generation was requested. Real-provider likeness, hair detail, headwear fidelity, latency and matte quality remain unverified.
