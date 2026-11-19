# Progress · DO Hotels / ONE Development AI Photo Booth

| Date | Step | Status |
| --- | --- | --- |
| 18 November 2026 | 00 · Brief and read-only source audit | Complete. Stopped at the documentation checkpoint. |
| 18 November 2026 | 01 · Architecture and scaffold | Complete. Local checks and browser smoke tests passed. |
| 18 November 2026 | 02 · Visual assets and typography | Complete. Seven assets and responsive tokens verified. |
| 18 November 2026 | 03 · Welcome | Complete. Production captures and consent handoff verified. |
| 18 November 2026 | 04 · Choose Your Style | Complete. Production keyboard and touch flows verified. |
| 18 November 2026 | 05 · Camera and Countdown | Implemented and verified with a simulated camera. Event hardware acceptance pending. |
| 18 November 2026 | 06 · Caricature adapter | Implemented. Synthetic output and provider contract verified. Live image acceptance pending. |
| 18 November 2026 | 07 · AI Processing | Local generation and recovery verified. Production worker pending. |
| 18 November 2026 | 08 · Final Result | Local native-resolution lossless export verified. Brand frame pending. |
| 18 November 2026 | 09 · QR Download | Local mobile download and offline QR decoding verified. Public scan pending. |
| 19 November 2026 | 10 · Thank You and Error & Retry | Local recovery and guest-session cleanup verified. |

## Evidence collected

- Verified the separate Windows source directory before reading it. Compared the loose prompt, provider handler and upload handler with the packaged Electron copies. Reviewed camera, mask, display, export, serving, storage, dependency and licensing paths.
- Read the required brief, six specification documents, both JSON configurations and supplied client transcript. Examined both brand manuals, all nine screen concepts, the three mood references, invitation storyboard and sampled video frames. Recorded the limit of independent voice-note verification in [the audit](AUDIT.md).
- Verified the green background instruction reaches both provider paths and the full-color image reaches the final screen and export. Provider configuration was checked statically. No live model, event hardware, guest photograph, storage account or QR endpoint was tested.
- Local inspection used directory listing, targeted text reads/searches, PDF rendering, in-memory image and video sampling, media metadata and offline audio transcription. No legacy project commands, installation, builds, paid calls, uploads or deployments were run.
- The three audit deliverables are [AUDIT.md](AUDIT.md), [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md) and this progress record. No app was created.

## Step 00 handoff (historical)

Follow `prompts/01_ARCHITECTURE_AND_SCAFFOLD.md`. Establish the local Next.js/React/TypeScript scaffold, typed nine-state flow and configuration, camera and AI adapters, idempotent job and storage/download interfaces, and a clearly labeled deterministic development simulator. Check the scaffold with lint, typecheck and build. Full screens and live integrations belong to later steps.

## Step 01 checkpoint · 18 November 2026

The working scaffold is complete. Development serves the interactive simulator on loopback. Production builds a static inactive setup page. The simulator uses synthetic events and makes no camera, image-edit or storage requests.

| Changed files | Purpose |
| --- | --- |
| `package.json`, `package-lock.json`, `.node-version`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `.gitignore` | Pinned toolchain, package scripts, server-only environment template and guest-photo exclusions. |
| `src/app/{layout.tsx,page.tsx,globals.css}`, `src/dev/Simulator.tsx` | App entry and development-only manual simulator. |
| `src/booth/{config.ts,flow.ts}`, `src/camera/browser.ts` | Typed catalog, transitions, webcam acquisition, frame capture and track release. |
| `src/server/{ports.ts,jobs.ts}`, `tests/scaffold.test.ts` | Image-edit, result-storage and QR contracts, injectable processor, in-memory job reservations and six tests. |
| `docs/ARCHITECTURE.md`, `docs/DECISIONS_AND_BLOCKERS.md`, `docs/PROGRESS.md` | Boundaries, open inputs, execution and verification record. |

**Checks run locally**

- Read official Next.js installation/ESLint and React version documentation. Checked npm registry versions, engines and peer ranges. Installed with `npm install --no-audit --no-fund --fetch-retries=1` and synchronized the engine declaration with `npm install --package-lock-only --offline --no-audit --no-fund`. The Windows default Node 22.12.0 triggered a lint dependency engine warning. The verified runtime is Node 24.22.3. See [Architecture](ARCHITECTURE.md) for setup.
- `npm run lint` passed with zero warnings. `npm run typecheck` passed, including Next route type generation. `npm test` passed all six tests. `npm run build` produced the static root page.
- Ran local `next dev` and `next start` on temporary loopback ports. Playwright with headless Edge clicked the complete development flow, injected an error at QR, retried to QR and reset to Welcome. Production showed the setup message with no simulator controls. Both browser checks passed without page errors and both temporary servers were stopped.
- All 30 files under `brief/` retained the original aggregate SHA-256 fingerprint `0bdddb01c7e3af3b5a486d010af4c9dba7828b6cbb01cc104b23159bedacf4bd`. The separate legacy project was not accessed in Step 01.

**Next step** · Step 02 can prepare visual assets, typography and design tokens. Official logo vectors and licensed brand font files remain pending. Physical camera acceptance, live generation, durable storage, QR delivery and retention verification belong to subsequent integration steps.

## Step 02 checkpoint · 18 November 2026

**Completed the standalone visual library.** Seven native PNG masters, fourteen optimized WebP delivery files and seven proof thumbnails are indexed in [the asset manifest](../public/artwork/manifest.json). The checkerboard proof confirms transparency on the isolated mirror ball. The caricature depicts an invented adult.

- Added `public/artwork/{masters,web,proofs}/`, `public/artwork/manifest.json`, and the temporary Barlow Condensed Bold font and license under `public/fonts/barlow-condensed/`.
- Added independent `src/design/tokens.css`, [visual QA](VISUAL_QA.md), and two internal comparison sheets under `docs/visual-proofs/`. Scoped Git ignore exceptions keep the two QA sheets versionable.
- Verified 28 decoded images against the manifest and tested font loading and responsive geometry at 1080×1920, 390×844 and 1440×900 using an isolated Edge fixture. The 30 brief files retain the Step 01 SHA-256 fingerprint. Application integration and hardware QA remain for later steps.
- Official logo masters, co-brand placement and licensed brand fonts are PENDING. The library is ready for Step 03 Welcome layout work when requested.

## Step 03 checkpoint · 18 November 2026

The root now opens Welcome in development and production. The development simulator is available at `/?simulator=1` during development. Step 03 ends at the existing state machine's Choose Your Style handoff, with a heading and a way back to Welcome.

| Production screenshot | Visual comparison |
| --- | --- |
| [1080 × 1920 portrait](../artifacts/qa/03-welcome/welcome-1080x1920.png) | Compared with [the approved concept](../brief/references/approved-screens/01_welcome.png). The diagonal violet wash, open title field, lower-right mirrored facets and bottom action carry over. The condensed headline reads down a left edge, with a smaller italic THE and an orange rule. After the first render, the CTA grew from 35% to 59% of the stage width to give it the visual weight of the reference. |
| [390 × 844 mobile](../artifacts/qa/03-welcome/welcome-390x844.png) | The plate fills the taller viewport, with the title and the privacy notice inside the gutters. The compact plate loads on narrow screens. This capture uses the reduced-motion preference. |

- `src/app/page.tsx`, `src/app/globals.css`, `src/booth/Welcome.tsx` and `src/booth/Welcome.module.css` implement the entry screen using Step 02 assets and live DOM type. A 950 ms title entrance and a slow change in spotlight intensity run in CSS. Reduced motion removes both animations. The screen includes no audio source.
- The start button describes camera capture and AI processing. Privacy opens a keyboard-accessible modal containing the pending-approval notice. An affirmative tap dispatches the existing consent transition with an anonymous UUID and timestamp held in React memory. The handoff focuses its heading. Returning to Welcome discards the session.
- Official vector logo masters, co-brand lockup approval and licensed brand fonts remain pending. Plain partner names occupy the header and Barlow Condensed Bold is the temporary display face. Organizer approval of consent and retention wording remains open.
- Verified with `npm run lint`, `npm run typecheck`, `npm test` (6 passed) and `npm run build`. Captured both screenshots in headless Edge using the production server. Both sizes passed consent via keyboard and tap, privacy open/Escape, new session on restart, and viewport bounds. Instrumentation observed zero camera requests, uploads, external requests or page errors. Production excluded the simulator even with its query parameter. No paid calls or deployment.

## Step 04 checkpoint · 18 November 2026

Choose Your Style opens from Welcome and renders the single enabled Caricature option from the booth catalog. It uses the existing stage artwork, display type, partner header and a labeled fictional sample. The portrait and stage use compact artwork on narrow screens.

- Continue starts disabled. Selecting Caricature enables it and keeps keyboard focus on the tile. Continue reaches the Camera handoff, which shows a placeholder and a Back to styles action. Camera and Countdown retain the style in the session state. Back from Choose Your Style returns to Welcome and clears the session.
- Rechecked the Step 00 documentation, the Step 01 scaffold, all 28 Step 02 image entries against the asset manifest, and the Step 03 Welcome and privacy interaction. Git status is unavailable for this folder because it has no Git metadata.
- Lint, type checking, all eight tests and the production build passed. Headless Edge verified the production flow at both sizes, including keyboard or touch selection, viewport bounds, the disabled action, the handoff, Back and a fresh session. It observed zero media calls, uploads, external requests or application errors. Chromium requested the existing missing favicon.
- The default Turbopack development server timed out during browser QA. With Next.js in webpack mode, the development simulator completed its synthetic flow, retried the QR step after a simulated failure, and reset to Welcome.

| Production screenshot | Input |
| --- | --- |
| [1080 × 1920 portrait](../artifacts/qa/04-style/style-1080x1920.png) | Keyboard |
| [390 × 844 mobile](../artifacts/qa/04-style/style-390x844.png) | Touch |

Step 05 covers the Camera and Countdown screens.

## Step 05 checkpoint · 18 November 2026

Camera and Countdown share one live video element and one stream. Camera waits for permission and playback before enabling Capture. A double tap arms one three-second countdown. Cancel or loss of focus during the countdown returns to Camera with the stream available. Back, device replacement, disconnection, leaving the page and the processing handoff release the tracks.

Camera settings expose available devices and independent preview and saved-photo mirroring. The viewing default is mirrored and the saved-photo default is unmirrored. The provisional frame is a centered 4:5 crop of the browser-oriented video. The booth requests up to 3840 × 2160 as an ideal resolution and encodes the native crop at JPEG quality 0.96. Camera availability determines the actual pixel dimensions.

At zero the booth records one JPEG and enters AI Processing with a client-memory generation request containing the capture ID, session ID, style and photo. Starting over releases the pending request. Live generation belongs to the next integration phase.

**Verification**

- Lint, type checking, nine unit tests and the production build passed.
- After building, run `python tests/camera_browser.py --screenshots` with Python Playwright and Edge installed. `BOOTH_BROWSER` can select another Chromium executable. Seven browser checks passed using an injected animated canvas stream on localhost. They exercised duplicate shutter input, stream identity, all three beats, Cancel, loss of focus, Back during permission acquisition, device replacement, permission denial, hardware failure, unplugging and cleanup. Color markers in the decoded JPEG verified orientation, crop and independent mirroring.
- [Camera · simulated](../artifacts/qa/05-camera/camera-simulated.png) and [Countdown · simulated](../artifacts/qa/05-camera/countdown-simulated.png) show the production screens with a labeled test source at 1080 × 1920.
- **Real-hardware acceptance is pending.** At the event kiosk, check the permission prompt, actual resolution and orientation, preview latency, disconnect recovery and camera release with the intended device and lighting.

## Step 06 checkpoint · 18 November 2026

The isolated server adapter supports offline mock edits and configurable OpenAI Images Edits. An original prompt requests a transparent subject and the compositor produces opaque purple PNGs. The server job entry point is ready for the Step 07 Processing lifecycle.

All 16 tests, lint, type checking and the production build passed. The integrity test compared six legacy source hashes, and the synthetic PNG tests compared every output channel with the expected composite. The local default Node 22.12.0 emitted an engine warning during the offline declaration of Sharp. Live provider access and visual quality remain untested.

[Source mapping, configuration, measured pixels and before/after images](CARICATURE_INTEGRATION.md)

## Steps 07–09 checkpoint · 18 November 2026

The local workflow runs from Countdown through Processing, Final Result and QR Download to the minimal Thank You handoff. It resumes a reserved job after page reload and preserves the generated file when the export or link is retried. Local mode forces the Step 06 mock and labels its result and loopback link.

| Files | Changes |
| --- | --- |
| `src/server/delivery/{config,store,service,export,links,http}.ts`, `src/server/ports.ts`, `src/server/caricature/index.ts` | Durable claims and stage records, provider cancellation, atomic lossless export, access capabilities, deadlines, cleanup, and standards-based QR encoding. |
| `src/app/api/booth/[jobId]/[[...resource]]/route.ts`, `src/app/download/[token]/page.tsx`, `src/app/download/[token]/file/route.ts` | Job API, protected handset landing and direct file download. |
| `src/booth/{Delivery.tsx,Delivery.module.css,capture-resume.ts,Welcome.tsx,Camera.tsx,flow.ts}` | Processing, Result and QR presentation, reload-safe capture handoff, minimal Error & Retry and Thank You routing. |
| `.env.example`, `package.json`, `package-lock.json`, `scripts/prune-booth.ts` | Runtime knobs, pinned QR encoder and retention cleanup command. |
| `tests/delivery.test.ts`, `tests/delivery_browser.py`, `tests/camera_browser.py` | Job, export, QR, mobile and camera regression checks. |

Lint, type checking, all 21 Node tests and the production build passed. Two delivery and six camera checks passed in headless Edge with the injected camera and mock AI. The existing camera screenshot-only case was skipped to preserve the Step 05 evidence. The delivery tests checked failed uploads, page reload, rejoining a running job, bounded polling failure, duplicate capture, private photo access, export recovery, full download byte equality, expired or altered tokens, QR retry and re-entry, idle, and Done. OpenCV independently decoded all 115 URL characters from an offline HTTPS QR fixture. Lossless WebP matched the 1024×1024 PNG pixel for pixel, including exact `#966BFC` background RGB. Six legacy source hashes matched the original read-only baseline.

| Local QA screenshot | Viewport |
| --- | --- |
| [Processing](../artifacts/qa/07-09-delivery/processing-local.png) | 1080 × 1920 |
| [Final Result · development sample](../artifacts/qa/07-09-delivery/final-result-local.png) | 1080 × 1920 |
| [QR screen · nonpublic fallback](../artifacts/qa/07-09-delivery/qr-nonpublic-local.png) | 1080 × 1920 |
| [Mobile download · nonpublic](../artifacts/qa/07-09-delivery/mobile-download-local.png) | 390 × 844 |

Verified locally only. Public HTTPS hosting, protected kiosk ingress, production queue and object storage, real AI acceptance, handset scanning, hardware acceptance and approved export logos and retention remain pending. The project folder has no Git metadata. [Runtime configuration and operating limits](ARCHITECTURE.md#steps-0709--job-and-photo-delivery)

## Step 10 checkpoint · 19 November 2026

Thank You uses the existing curtain and floor artwork with a directional spotlight and supports reduced motion. DO IT AGAIN returns immediately to Welcome. The server reads `BOOTH_THANK_YOU_SECONDS` at runtime, defaulting to six seconds.

The global Error & Retry screen presents one actionable explanation. Typed failure reasons preserve the failed stage. Camera and interrupted countdown failures reopen Camera. Connection and download retries resume the same stage and job. Recoverable export failures retry saving an existing source without invoking the provider again. A terminal generation failure leads to Welcome for a new consented session.

Done, idle, and Start Over clear the active browser attempt and its IndexedDB buffer. Stage teardown stops camera tracks, countdowns and request controllers, and revokes portrait object URLs. Back/forward restoration discards the old kiosk session. This cleanup covers the kiosk. Server artifact expiry and deletion continue to use the existing retention policy and server cleanup command.

Lint and type checking passed. Node reported 21 passes and one optional legacy-source hash check skipped. All five focused Edge tests passed with intercepted API requests and a simulated camera. They verified permission and disconnect recovery, countdown cancellation, offline buffer deletion, a timed-out job, export and QR retry with a single generation submission, immediate and timed restart, object URL revocation and back-history isolation. The Webpack development server remains available on loopback.

[Thank You screenshot](../artifacts/qa/10-session/thank-you-1080x1920.png) · [Error & Retry screenshot](../artifacts/qa/10-session/error-1080x1920.png)

## 2026-11-19 · Client revision — Welcome CD and kiosk themes

Welcome uses the original club photograph with a feathered mask over the embedded mirror ball. A local silver CD face with a transparent hub, optical tracks and spectral reflections rotates once every 11 seconds. Reduced motion holds it still. The operator can tap the 64 × 64 top-right Welcome hotspot five times in three seconds. Purple is the default. The document restores the device's `do-booth.operator-theme` preference before painting the booth.

The UI uses #E48D3D for its main warm accent, #CA5D36 for burnt-orange shading and #E8A440 for gold highlights. Cached amber WebP variants reuse the existing welcome-club, style-stage, spotlight, result-ground and thank-you-vignette artwork. Both themes use the same white logo artwork, fictional style sample, camera feed, portrait and QR. The white DO mark uses the supplied logo's exact alpha channel.

Changed files include `src/app/layout.tsx`, `src/design/{kiosk-theme.ts,tokens.css,PartyButton.module.css}`, `src/booth/{Welcome.tsx,ThemeHotspot.tsx}` and the Welcome, ChooseStyle, Camera, Delivery and SessionEnd CSS modules. New assets are `public/artwork/brand/do-hotels-white.png`, `public/artwork/web/welcome-cd.webp` and nine `*-amber-*.webp` decorative variants. Browser coverage is in `tests/theme_browser.py`.

Webpack dev verification in Edge covered both themes on all nine stages, both toggle directions, the tap window, reload before body paint, session reset, reduced motion, matching element geometry at 1080 × 1920, matching QR pixels and the sample portrait's exact #966BFC background. A 390 × 844 viewport check covered Welcome. Camera and job traffic used test fixtures. The QR contains a synthetic, non-downloadable URL. Lint, typecheck, the theme browser test and five session browser tests passed. The Node suite passed 21 tests with its optional legacy-source hash check skipped.

[Five screen pairs](../artifacts/qa/dual-theme/comparison.jpg) · [All 18 browser screenshots](../artifacts/qa/dual-theme/)
