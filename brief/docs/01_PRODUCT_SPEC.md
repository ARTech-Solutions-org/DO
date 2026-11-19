# Product Specification — Nine-Screen Event Photo Booth

## Goal
A polished portrait interactive kiosk built around a real party/nightlife mood, not AI-looking generative UI. Purple-led ONE Development branding meets DO Hotels' black/white hospitality identity and sunset-orange accent from the client's voice note. The invitation reference adds chrome, disco ball, and metallic-reflection cues.

## Approved scope (ONLY these screens)

1. **Welcome (route/state `welcome`)** — autoplay *silent* ambient looping decorative lighting, official logo lockups in brand-compliant zones, oversized `OWN THE NIGHT` headline and single `TAP TO START` CTA. Include concise real consent notice near the CTA / accessible privacy link; starting must be a clear affirmative consent step for camera capture + AI processing before any photo leaves the device. Idle attract mode; tap starts a new session. No UI clutter.
2. **Choose Your Style (`choose-style`)** — `PICK YOUR VIBE`, selectable style tiles, dynamic catalog (only `Caricature` enabled by default), one `CONTINUE` CTA. Cards show actual pre-generated *illustrative example images*, never implying a live result. Changing catalog must not require layout rewrite. If only one style is enabled, keep obvious selection with simple UI.
3. **Camera (`camera`)** — `STRIKE A POSE`, real webcam live preview via getUserMedia, correct aspect cropping/mirroring policy, visible face-safe guide if needed, single `CAPTURE`/shutter button and discreet `BACK`. Handle permission refusal, reconnect, wrong camera, disconnect, and warm-up. Camera on secure origin (HTTPS or localhost). Avoid taking photos before user initiates capture.
4. **Countdown (`countdown`)** — separate screen/state reuses the *same live camera stream* with a massive 3→2→1 overlay, subtle beat/flash visuals and haptic/audio only if explicitly enabled. Exactly one photo at zero, immediately create generation job, transition to processing. `CANCEL` returns to Camera without capture. Do not open a new media stream or duplicate capture. Ensure no ghost shutter or double tap.
5. **AI Processing (`processing`)** — `MAKING MAGIC` + art-directed animation; real asynchronous generation state. No fake percentage, no arbitrary guaranteed duration. Use meaningful status text only if grounded (e.g. `CREATING YOUR LOOK`). Server queues/executes work; frontend polls or subscribes to real job status. Display recoverable error if job fails or times out. No client API keys.
6. **Final Result (`result`)** — `YOUR LOOK`, finished generated image shown at correct aspect, short `GET MY PHOTO` button (to QR) and optional `START OVER` secondary action. Exported image is composited separately at high output resolution with *official* logo/frame assets; do not screenshot kiosk UI. No Review/Retake step. Start Over creates a new capture and a new (paid) generation request only after explicit tap.
7. **QR Download (`qr`)** — `SCAN & SAVE`, high-contrast scannable real QR pointing to a secure public HTTPS landing/download page with a real photo, not a localhost/base64/local-file URL. Original generated photo persists long enough for scanning; *suggested initial TTL 24 hours*, configurable and to be approved. Keep screen visible e.g. 60 seconds of idle before Thank You; button `DONE` exits earlier. QR must remain scannable with real device camera. Minimal contrast-safe quiet zone; do not tint code with purple-on-purple.
8. **Thank You (`thank-you`)** — `YOU NAILED IT!` and small `DO IT AGAIN` CTA; automatic reset to Welcome after configurable 6 seconds (unless interaction). Release media tracks, clear in-memory PII/session, reset style and UI state, avoid leaking the prior guest's portrait. Any safe cleanup server-side is handled via TTL/lifecycle, not client alone.
9. **Error & Retry (`error`)** — global dedicated recovery screen reachable from camera errors, image service errors, upload failure, generation timeouts, QR/storage failure, etc. `OOPS!` + one contextual sentence + `TRY AGAIN` / `START OVER`. Never display technical traces or user images on error. Retry must know failing stage, reattach to existing completed job where possible, and avoid extra API calls/double billing from accidental repeats.

## Explicitly excluded
- How It Works screen
- Separate style details preview screen
- Separate review/retake screen
- Email, SMS, physical printing, on-device admin dashboard, user accounts, external social publishing: **not included unless later requested**.

## User state flow
`welcome → choose-style → camera → countdown → processing → result → qr → thank-you → welcome`
Error from any stage routes to `error` with `failedStage` metadata. Recovery by stage:
- camera/countdown: reinitialize camera or restart session
- upload/generation: retry idempotent operation or resume job, no double charge
- QR: regenerate signed link or fix storage delivery without resubmitting AI generation
- unrecoverable: reset to welcome

## UI constraints
- Portrait kiosk target: 1080 × 1920 reference coordinate system (ASSUMED). Support scaled fixed-composition layout and touch targets >= 44px CSS, safe zones, browser zoom, DPI, kiosk fullscreen, and smaller responsive previews.
- English copy only by default, minimal words, no walls of text, no multi-step instructions.
- Keep all controls touch friendly and high contrast; support reduced motion and silent fallback.
- No excessive particle clutter, generic AI gradients, random floating blobs, fake interface chrome, or pretend QR images.
- Kiosk consent, ephemeral session lifecycle, progress, retries, and data retention must be real.

## Unresolved decisions; do not fabricate
- Actual display resolution/orientation, Windows/macOS/Android OS, camera model and interface
- Photo output aspect ratio, portrait-vs-group support, print output requirement
- Approved image styles other than Caricature
- Brand hierarchy / exact co-branding lockup placement, supplied vector logos and licensed fonts
- QR download TTL and storage provider; event connectivity quality
- Whether the kiosk runs online in a browser or packaged local app
