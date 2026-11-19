# STEP 09 — QR download and mobile landing

**Codex model:** GPT-6.2 Sol

**Thinking:** High

---

Implement ONLY the distinct QR Download kiosk screen and the simple phone landing/downloading experience. Screen copy `SCAN & SAVE` + `DONE` only, strong clean WHITE QR quiet zone, legible against purple/black event styling.

Create real session-specific public HTTPS download links backed by durable object storage and app routing. DO NOT encode local filesystem, localhost, data URI, or an in-app mock QR. On phone page show the actual photo with proper Save/Download for common iOS/Android browsers, source portrait preserved. Protect guest privacy with unguessable tokens and configurable TTL (24h is a PROVISIONAL default pending client approval), secure expiry and cleanup. Never include API credentials in download links. QR must remain available long enough to scan; done -> Thank You; idle transition only when safe. Retry QR/storage failures without regenerating a paid AI image.

Implement dev storage fallback clearly labeled NONPUBLIC; do not claim real QR works until HTTPS deploy + physical phone scan is performed. Tests: QR URL roundtrip, expiry, access control, file MIME, reentry, no double billing. Capture screenshots of kiosk QR and mobile landing. Run checks, update progress. STOP before Thank You/Error polish.
