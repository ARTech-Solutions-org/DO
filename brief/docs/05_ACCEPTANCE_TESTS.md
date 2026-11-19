# Acceptance checklist

## Critical
- [ ] Exactly 9 approved screen states; no How It Works / separate style preview / review retake screen.
- [ ] Real camera preview on target device, permissions handled, secure context, correct device chosen and released.
- [ ] Countdown reuses same stream, captures exactly once, triggers exactly one generation job with idempotency key.
- [ ] Caricature is selectable; other unapproved styles are not exposed as finished options.
- [ ] Processing screen not a fake percent bar; queued/running/success/error are real.
- [ ] Result displays real generated image and uses separate image composition for output, without UI controls baked in.
- [ ] QR is real public HTTPS URL, scans on a separate phone, opens actual image, can download, respects access expiry.
- [ ] Thank You resets photo/session, returning Welcome without displaying previous guest's photo.
- [ ] Error retry from camera disconnected, permission denied, upload fail, AI fail, timed out job, QR fail; no infinite spinner or double-generation charges.
- [ ] Secrets server-side only. Explicit photo/AI consent before photo is processed; retention/cleanup verified.

## Visual
- [ ] Compare all 9 states at 1080×1920 and actual kiosk resolution to refs; viewport screenshot, cropped states, transition end frames.
- [ ] Party aesthetic: clean editorial, realistic lighting, strong typography, purple-led with black/orange accents, short copy.
- [ ] Rebuild layers, never deploy a full-screen screenshot as the UI.
- [ ] Official ONE and DO logos obey source manuals; have client-supplied approved vectors and fonts (or flag blockers).
- [ ] 30–60fps on target hardware after profiling; smooth fallback without heavy WebGL.
- [ ] Buttons readable and finger-friendly; overlays don't block camera/photo.
- [ ] Reduced motion, silent behavior, loss-of-focus recovery, fullscreen re-entry all checked.

## Operability
- [ ] Browser kiosk restart/reload recovery at every state.
- [ ] Idle timeout returns safely from style/camera/QR states, but not during active generation without cancel/cleanup rules.
- [ ] Tested with real phone scan, flaky network, quota/rate limits, server restart, delayed API output, and no-store URL expiry.
- [ ] Monitoring counts sessions/generations/failures only, not faces or raw photos.
- [ ] README setup, env example, reproducible production build, unit/e2e scripts, deployment notes.
