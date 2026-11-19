# Technical Architecture & Operational Rules

## Proposed stack (re-check latest compatible versions at build time)
- Next.js App Router + TypeScript + React for kiosk UI and backend route handlers
- Tailwind / CSS custom properties for styling; GSAP only for meaningful screen transitions
- Browser `navigator.mediaDevices.getUserMedia` via HTTPS or localhost for supported webcam cameras. For Canon/DSLR, confirm that it appears as a webcam capture device; otherwise separate native camera bridge may be necessary.
- OpenAI Images Edit API with model selected in secure server env, e.g. `gpt-image-2.6-sunburst` if accessible, or configurable model after test. Image generation runtime API may incur separate paid usage; test with model IDs from current provider docs. Never store API key client-side.
- Blob storage such as Cloudflare R2 / supported equivalent; short-lived, unique image object keys; public HTTPS image landing/download; signed access with configurable retention. No production QR that references private IP, local path, or ephemeral non-public URL.
- A durable async job status store/queue as required by actual provider latency/hosting limits, rather than assuming single request can run indefinitely.

## State machine
`welcome, choose-style, camera, countdown, processing, result, qr, thank-you, error`
Session fields (types): `id`, `createdAt`, `selectedStyleId`, `consentAt`, `cameraDeviceId?`, `captureBlob?` (memory only), `jobId?`, `resultId?`, `qrUrl?`, `failedStage?`, `retryCount`, `lastInteractionAt`.

## Backend endpoints (suggestion, design and adapt)
- `POST /api/sessions` new consented session / signed upload intent
- `POST /api/generations` single idempotent generation job; validates active session, style, file size and mime, request token
- `GET /api/generations/:id` real status: `queued | running | succeeded | failed`; return signed result metadata on success
- `POST /api/generations/:id/retry` controlled retry; do not regenerate if already succeeded
- `POST /api/results/:id/download-link` public handset-friendly download URL / QR destination, expiry, validation
- `GET /download/:token` clean simple handset download page with `Download photo` CTA
- Admin/config endpoints separate and disabled by default. No API secret or object storage credential on kiosk.

## Runtime quality and privacy
- Actual clear photo consent statement before capture/transmission; link to privacy policy for the real event. If legal requirements aren't resolved, leave configurable block and raise blocker; don't falsely claim consent policy approved.
- Disable exposing PII in analytics, logs, error reports. Don't store guest photos in browser localStorage, cache service worker, public repo, or permanent downloads folder.
- Unique random, non-enumerable session identifiers; rate limiting, input type and size limits, access controls, retry ceilings, abuse limits, and storage lifecycle deletion. Deletion and expiry audited after deploy.
- Uploaded raw photo should be stored only as needed for generation and discarded with defined TTL; export image retention configurable pending event approval (proposed 24h).
- Camera stream is one per active session, properly released on thank-you/reset/tab close/errors, and preserved while Camera→Countdown to avoid permission prompts.
- Genuine progress states, not fabricated percentages; if processing is slow, animate reliably and allow retry if real failure. Estimate time only from real measurements after provider selection.
- Stable portrait export width/height independent of device preview; overlay brand frame in a compositing function at production resolution.
- Offline fails safely: if connectivity drops after capture, provide retry or honest error. Do not pretend to generate AI offline.

## Build order (gated)
1. Repo audit, unknowns, device assumptions and brand asset verification, config, tokens
2. Welcome screenshot matching + motion + kiosk layout validation in 9:16
3. Choose Style, Camera + live webcam + Countdown + idempotent capture
4. Mock generation service (deterministic fake latency only in dev mode), Processing + Result + QR + Thank You; do not mislabel as production AI
5. Real AI edit provider, jobs, storage and signed real QR download
6. Error recovery, privacy, automatic reset, hardware testing, polished transitions, accessible reduced-motion
7. Visual screenshots for all nine states, Playwright + mobile QR smoke + full real event rehearsal

## Settings to expose in a typed config
`brandTheme`, `displayWidth`, `displayHeight`, `photoAspectRatio`, `styles[]`, `enabledStyleIds[]`, `countdownSeconds` (3 default), `qrIdleMs` (60000 initial), `thankYouMs` (6000 initial), `photoTTLHours` (24 initial), `aiModel`, `cameraPreferredDeviceId`, `mirrorPreview`, `flipCapturedImage`, `silentMode`, `reducedMotion`.
