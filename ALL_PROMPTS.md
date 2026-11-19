# ALL PROMPTS — Send one step at a time

**Do NOT paste this whole document into Codex.** Use each numbered prompt separately.

# STEP 00 — Audit and source reconnaissance

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

You are taking over a NEW, independent DO Hotels / ONE Development party-themed AI Photo Booth. This is the FIRST instruction in the project. Work locally in the new workspace and DO NOT start implementation yet.

A. Read `brief/README_AR.md`, `brief/docs/*.md`, `brief/config/*.json`, `brief/references/invitation/CLIENT_VOICE_TRANSCRIPT_AR.md`; inspect the official TWO brand PDFs, visual references, and video/stills. Use available PDF/image/video viewers; if an asset cannot be inspected, explicitly record that fact. The reference screenshots are non-editable AI concepts, NOT production artwork. `brief/CODEX_MASTER_PROMPT.md` is background context ONLY: these sequential STEP prompts take precedence. Our authorized scope is nine states only: Welcome, Choose Your Style, Camera, Countdown, AI Processing, Final Result, QR Download, Thank You, and Error & Retry.

B. READ-ONLY audit this SEPARATE EXISTING caricature project:
`F:\ARTech\photobooth caracter\photobooth caracter`
Before touching it, verify it exists and is accessible from Codex Local on Windows. Inspect relevant code, prompt templates, generation provider/models, dependency files, preprocess/postprocess, composition and background handling, output size, masks/green-screen logic, licenses, and how images are served. Do not modify source files, run install/build scripts there, or migrate secrets/private pictures. Never assume an API/provider until verified. Find the exact reason final backgrounds look green, if possible; distinguish internal green chromakey from actual output background. If access is unavailable, report a blocker and proceed with all non-dependent planning.

C. Create only in the NEW project: `docs/AUDIT.md`, `docs/DECISIONS_AND_BLOCKERS.md`, and `docs/PROGRESS.md`. List source paths and what can be reused vs isolated. Capture missing hardware specs, vectors/fonts, extra styles, API funding, domain/storage, image retention consent. Current assumptions are 1080x1920 portrait, only Caricature active, branded purple #966BFC final background, black/white with subtle approved orange accents. No invented details.

STOP after audit. Reply concisely in Arabic: findings, green background cause (verified or unknown), what you will reuse, exact blockers, and what the next step will do. Do not write the app yet. No paid API calls, deployment, or outside changes.


---

# STEP 01 — Architecture and scaffold

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Continue the SAME NEW Photo Booth workspace. Read `docs/AUDIT.md`, `docs/DECISIONS_AND_BLOCKERS.md`, `docs/PROGRESS.md` and the brief. Implement the working scaffold only.

1. Set up Next.js + React + TypeScript (or justify an existing compatible structure), typed config, lint/typecheck/build/test scripts, clean `src/` structure and `.env.example`; pin compatible dependencies after checking official current docs. Do not invent installed tools. No copied secrets. Add `.gitignore` protections for env keys and photos.
2. Implement a typed nine-state flow/state machine: welcome -> choose-style -> camera -> countdown -> processing -> result -> qr -> thank-you -> welcome. Error is an exceptional state reachable from every active step. NO How It Works, separate Style Preview, Review/Retake, admin or print screen.
3. Add camera adapter abstraction (browser webcam now, optional native DSLR adapter later), AI image-edit adapter, job repository/processor with idempotency placeholder, result storage interface, QR download interface. Separate client/server secrets. Make the confirmed caricature style config-driven; no other actual styles enabled.
4. Add dev-only deterministic simulator/mock flow that is unmistakably labeled in DEV only. Never present placeholder as real output. Provide no paid calls or external deployment.
5. Keep a short architecture diagram or text in `docs/ARCHITECTURE.md`, decisions and unresolved dependencies. Add `docs/PROGRESS.md` checkpoint with files changed and commands run. Run lint/typecheck/build and fix issues. Do not create complete screens yet.

STOP. Return concise project tree, test results, and next-step readiness. Preserve `brief/` untouched.


---

# STEP 02 — Visual assets and typography

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Continue the same repo; inspect the official brand manuals and existing `brief/references/approved-screens/` and `brief/references/mood/`. Work on the visual asset library and visual design tokens, not application integration yet.

Goal: a REAL premium PARTY/nightlife look, NOT glossy generic AI UX. Strong authentic event typography, restrained orange, dominant purple lighting #966BFC, charcoal/black, subtle physically plausible disco reflections and chrome. No visual walls of text. Official ONE and DO logo variations and clear space must follow each manual; never fabricate/repaint logos. If licensed Sharp Sans / Alexandria fonts or approved SVG logo masters are not provided, use legally usable temporary display fonts such as Barlow Condensed and clearly mark brand logo/font assets as PENDING. Do not embed fonts from the manuals or invent vector logos.

Generate individual production image assets if the Codex image-generation tool is available: prefer GPT-Image-2.6 Sunburst for final visual assets and Flare for exploratory iterations if supported. Produce separate REAL files for (a) welcome nightclub background, (b) style-screen alternate dark stage background, (c) reusable spotlight texture, (d) isolated chrome/disco prop on transparent background if possible, (e) subtle result/QR background, (f) thank-you light vignette, and (g) sample caricature with a FICTIONAL adult character. No text, icons, logos, buttons, UI mockups, or QR burned into any picture. Use consistent art direction; avoid hand errors and AI-looking swirls. If native image generation is unavailable, create proper SVG/CSS placeholders, create a manifest of missing generated assets, and STOP short of claiming they exist. Never pay for image generation/API usage without approval.

Build tokens and a reusable asset manifest with dimensions, file paths, transparent/opaque status, proof thumbnails and optimization variants. Implement semantic typography and basic stage geometry tokens for 1080x1920 reference + responsive scaling, but not full functional screens. Save `docs/VISUAL_QA.md` with side-by-side reference comparisons and assumptions.

STOP after generating/organizing assets, manifest, and QA. Do not hide missing assets. Add progress checkpoint.


---

# STEP 03 — Welcome screen

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Build ONLY the WELCOME screen and the shared visual components it actually needs, using the approved party design directions from `brief/` and assets from Step 02. The screen must feel like a refined LIVE EVENT poster brought to life, not an AI dashboard.

Design: 1080x1920 reference portrait scale, actual DOM typography with bold condensed headline `OWN THE NIGHT`, one prominent `TAP TO START` action, small authentic/co-branded logo placements following the manuals, purple #966BFC stage lights, restrained realistic disco/chrome motif and selective DO orange highlights. Keep high contrast and negative space. Use GSAP only when needed (or lightweight CSS); tasteful 0.8-1.2s intro, atmospheric motion, no obnoxious particle storm. `prefers-reduced-motion` and mute default. Do not rasterize labels or logos in backgrounds.

Functional gate: `TAP TO START` initializes an anonymous session and advances to Choose Your Style; include a short understandable camera/AI processing consent mechanism before personal imagery is sent, with legal wording marked pending approval. No camera starts before consent. Hide debug UI in production.

Run and capture actual rendered 1080x1920 screenshot plus secondary viewport screenshot. Compare layout to approved concept, correct spacing, lighting, type, and click behavior. If you cannot run browser screenshots, report it plainly. Record screenshots in `artifacts/qa/03-welcome/`, run lint/typecheck/build, update `docs/PROGRESS.md`.

STOP after Welcome. Do not implement subsequent screens in this step.


---

# STEP 04 — Style selection

**Codex model:** GPT-6.2 Sol

**Thinking:** Medium

---

Implement ONLY Choose Your Style, reusing the existing design system and components. Keep visual continuity with Welcome. Headline `PICK YOUR VIBE`; display ONE confirmed, functional style tile `CARICATURE`. A `CONTINUE` button proceeds to Camera; Back returns to Welcome. The style catalog must be config-driven for future approved choices but DO NOT invent or enable additional styles. Use an illustrative fictional-person sample clearly separated from actual generated guest output. Do not import any private images from the legacy project.

Keep typography large, copy minimal, and touch targets generous. Avoid text-heavy style descriptions, fake model logos, cheesy glowing cards. Preserve selection across Camera/Countdown but wipe it on new session. Show proper focus states and portrait-responsiveness. Add tests: style selected, Continue disabled when no selection, Back safe, catalog handles one style; run lint/typecheck/build. Capture actual screenshot `artifacts/qa/04-style/`, update progress. STOP before Camera implementation.


---

# STEP 05 — Camera and countdown

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Implement the TWO approved, visibly distinct Camera and Countdown screens with ONE continuous underlying camera stream. Do not add Photo Review or Retake screen.

Camera: display genuine live preview (NOT stock/sample screenshot) using `navigator.mediaDevices.getUserMedia` on HTTPS or localhost. Expose device selection when necessary, optional preview mirroring vs actual exported-photo mirroring, crop/aspect rules, camera warm-up, permission states, disconnected device, hardware failures, and accessibility. Copy `STRIKE A POSE` + one `CAPTURE` button; Back safely stops/reuses tracks according to state.

Countdown: clicking CAPTURE transitions once, freezes controls against double-tap, keeps the SAME stream alive and shows full-screen 3 -> 2 -> 1 with restrained beat-synced motion. Take EXACTLY ONE properly oriented high-resolution frame at zero; immediately begin generation submit transition to AI Processing. `CANCEL` goes back to Camera without capture. Handle tab focus loss and cancellation cleanly. Use injectable mock-camera for automated tests, not pretend it is a real webcam.

Create tests for duplicate shutter prevention, cancel, stream reuse, permissions denied, unplugging, captures only once, orientation/crop, and camera cleanup. Capture screenshots both states using simulation for visual QA, label as simulated. Document real-hardware test still pending unless genuinely performed. Run checks and update progress. STOP before real AI integration.


---

# STEP 06 — Legacy caricature and purple output

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Now integrate the existing caricature engine into the NEW project only. First reread `docs/AUDIT.md` and inspect the SOURCE PROJECT again in READ-ONLY mode:
`F:\ARTech\photobooth caracter\photobooth caracter`
Do not change, refactor, install dependencies, remove or overwrite ANY file in the old folder. Never copy .env, keys, tokens, real guest data, logs, or private photographs.

Trace actual prompt templates/provider/edit calls/preprocessing/cropping/segmentation/compositing. Reuse only licensed/necessary logic and prompts in a new isolated adapter `src/.../caricature` with provenance notes. Keep provider and model configurable after verifying current API support. Preserve flattering recognizable caricature identity, no forced ethnicity/skin tone, no real-person samples. Final output's background MUST be unmistakably purple EXACTLY `#966BFC` (RGB 150 107 252), regardless of old project's green background. Find and explain source of green. If green is a chroma intermediary preserve it only internally and replace final composited pixels with precise purple using tested subject mask/alpha; avoid green fringes/halo/hair degradation. If green comes from text prompt, change prompt AND use robust deterministic compositing where needed; modifying CSS behind an opaque green image is not enough. Avoid replacing genuine green clothing or eye details.

Implement dry-run mocked provider and tests for foreground transparency/subject edges, solid background pixels, no source mutation, image dimensions, and prompt selection. For real image tests, ASK FOR EXPLICIT USER PERMISSION before any chargeable generation request or uploading images; make accurate report if unavailable. Update `docs/CARICATURE_INTEGRATION.md` with source file mapping and before/after evidence when actually tested. Do NOT state identity preservation is guaranteed. Run checks and update progress. STOP here.


---


# COMBINED STEPS 07–09
# AI Processing + Final Result + QR Download
# DO Hotels × ONE Development AI Photo Booth

You are continuing the EXISTING AI Photo Booth project.

Your task is to implement THREE CONNECTED PHASES in one continuous execution:

1. STEP 07 — AI Processing and Reliable Job Lifecycle
2. STEP 08 — Final Result and High-Resolution Export
3. STEP 09 — QR Download and Mobile Landing

Complete these phases sequentially, but treat them as one integrated end-to-end workflow.

Do not stop between phases unless genuinely blocked by missing credentials, infrastructure, permissions, or an architectural decision that cannot safely be inferred.

Do not rebuild the application from scratch.

Do not modify unrelated completed screens.

Do not implement or redesign Thank You or Error & Retry screens beyond the minimal integration necessary.

IMPORTANT:
Use the existing codebase, Design System, party-themed UI components, caricature adapter, and approved branding.

Preserve the established 9-screen flow.

========================================
PHASE 0 — EXISTING PROJECT INSPECTION
========================================

Before implementing anything:

1. Inspect the current project structure.
2. Read existing architecture and progress documentation.
3. Inspect Step 06's caricature adapter.
4. Identify the AI provider and generation API.
5. Inspect existing session management.
6. Inspect existing error handling.
7. Identify storage configuration and deployment environment.
8. Inspect existing brand assets and export settings.
9. Check the current Git status.

Do not overwrite unrelated or completed work.

Identify reusable components and existing services.

Do not assume the provider or storage technology without inspecting the code.

If an existing reliable implementation is present, extend it instead of replacing it unnecessarily.

========================================
PHASE 1 — AI PROCESSING SCREEN
AND RELIABLE JOB LIFECYCLE
========================================

Implement the Processing screen and its complete server-side generation lifecycle.

SCREEN COPY:

Main headline:
MAKING MAGIC

Optional small status:
CREATING YOUR LOOK

Do not add excessive on-screen text.

VISUAL DIRECTION:

Create a premium luxury-party experience.

Use:
- Strong kinetic typography.
- Elegant and restrained text movement.
- Vinyl-record-inspired rotation.
- Disco-light-inspired reflections.
- Soft violet and occasional warm-orange light movement.
- Smooth transitions.
- Depth through controlled layered lighting.

Avoid:
- Generic glowing AI circles.
- Fake percentage counters.
- Fake progress bars.
- Excessive particles.
- Random floating 3D objects.
- Flashing or aggressive animations.
- Unnecessary interface elements.

The animation must feel intentional and branded.

Use CSS/GSAP for lightweight animations, depending on the existing architecture.

Support reduced-motion preferences.

TECHNICAL JOB STATES:

QUEUED
RUNNING
SUCCEEDED
FAILED
TIMED_OUT

Implement an explicit, validated job state machine.

JOB ARCHITECTURE:

- Use one stable session ID and one stable generation job ID per generation attempt.
- Support idempotency keys.
- Ensure duplicate submissions cannot trigger duplicate chargeable model calls.
- Keep provider credentials on the server.
- Store durable job metadata.
- Track created, started, updated, and completed timestamps.
- Track stage-specific failures.
- Support meaningful configurable timeouts.
- Use bounded retries.
- Prevent race conditions.
- Ensure a refresh or client reconnection resumes the same job.
- Avoid generating a second image if the first job has already succeeded.
- Do not rely on React component state as the job source of truth.

The server must be authoritative for job status.

IMPORTANT:
Client retries must not automatically initiate another paid generation.

If the provider request is still running or its outcome is unknown, reconcile the original attempt before allowing a new chargeable submission.

If a persistent queue or worker infrastructure is unavailable, implement an explicitly labeled development-only adapter.

Document its limitations.

Do not present a memory-only job runner as production reliable.

PROCESSING FLOW:

1. Receive the captured image and selected AI style.
2. Validate session and inputs.
3. Create or reuse the idempotent generation job.
4. Start generation through the existing Step 06 adapter.
5. Update authoritative server-side job status.
6. Keep the Processing screen visible until completion.
7. On success, persist generated image metadata and storage references.
8. Transition to Final Result exactly once.
9. On failure, enter the existing global error state.
10. Include failed-stage context for recovery.

Never expose provider secrets.

TESTS:

- Successful generation.
- Slow provider response.
- Network disconnection.
- Browser page reload.
- Duplicate request IDs.
- Double button taps.
- Provider failure.
- Server timeout.
- Concurrent status requests.
- Reconnection after completion.
- No duplicate chargeable generation.
- No secret exposure.

Use a mock provider for automated tests.

Never execute external live AI generation without explicit authorization.

========================================
PHASE 2 — FINAL RESULT
AND HIGH-RESOLUTION EXPORT
========================================

After the generation lifecycle is functional, implement the Final Result screen.

SCREEN COPY:

Headline:
YOUR LOOK

Primary action:
GET MY PHOTO

Optional secondary action:
START OVER

Keep text minimal.

VISUAL DIRECTION:

- Follow the approved luxury party theme.
- Purple-dominant visual identity.
- Dark premium background.
- Controlled orange accent lighting.
- Strong, clean typography.
- Elegant entry reveal.
- Display the actual generated photograph.
- Maintain a clear visual hierarchy.
- Keep the photograph as the main focal point.

Avoid excessive effects around the photo.

Do not cover faces with decorative overlays.

IMAGE DISPLAY:

Load the actual persisted result from the server.

Do not replace the image with mock visuals outside development mode.

Preserve the intended image aspect ratio.

Prevent stretching or distorted cropping.

Allow responsive presentation for different viewport dimensions.

BUTTON BEHAVIOR:

GET MY PHOTO:
Navigate to the distinct QR Download screen.

START OVER:
If implemented, create a new session and reset appropriate consent state.

Do not implement an intermediate Review/Retake screen.

HIGH-RESOLUTION EXPORT:

Implement a reusable export/compositing pipeline.

The exported file MUST be generated from:

1. Original high-resolution AI output.
2. Approved brand frame assets, if available.
3. Official authorized logo files, if available.
4. Explicitly approved composition settings.

Never export the kiosk DOM or a screenshot of the interface as the final photograph.

Avoid:
- Low-resolution canvas screenshots.
- Stretching the portrait.
- Unapproved AI-generated logos.
- Applying destructive color filters to faces.
- Placing branding over important facial features.

If an approved vector logo does not exist, mark the logo layer as pending rather than fabricating one.

CARICATURE BACKGROUND:

Official purple:
#966BFC
RGB: 150, 107, 252

This requirement applies to the ACTUAL FULL-RESOLUTION EXPORTED IMAGE.

It is not enough to display a purple CSS background behind an image.

Preserve the recognizable caricature style and subject appearance.

Avoid:
- Remaining green backgrounds.
- Green halos.
- Green color spill around hair.
- Unnatural green/purple edge artifacts.
- Changing green clothing or legitimate green subject details.

If the original generation pipeline uses green for segmentation or chroma keying, retain that intermediate workflow if needed, but ensure the final composed image uses purple.

Validate appropriate background regions using pixel sampling.

Use visual QA in addition to automated image checks.

EXPORT QUALITY:

- Preserve color fidelity.
- Maintain correct orientation.
- Avoid unnecessary re-encoding.
- Preserve image detail.
- Support suitable output resolution.
- Make output format configurable.
- Document print suitability based on actual export dimensions and target print size.

Do not claim print-ready quality without verifying the resolution requirements.

FILE RELIABILITY:

- Store final output immutably.
- Associate it with the correct session/job.
- Record content type, dimensions, file size and storage location.
- Avoid duplicate export generation if the output already exists.
- Make export operations idempotent.

TESTS:

- Correct image output.
- Correct aspect ratio.
- No stretched faces.
- Purple background verification.
- High-resolution dimensions.
- File MIME validity.
- File integrity.
- Color fidelity.
- No duplicate AI generation.
- Responsive display.
- Missing logo handling.
- Export recovery after interruption.

Capture a screenshot of the Final Result screen.

If mock output is used, display a development-only sample watermark.

Clearly distinguish mock output from verified live output.

========================================
PHASE 3 — QR DOWNLOAD
AND MOBILE LANDING
========================================

Implement the distinct QR Download screen.

SCREEN COPY:

SCAN & SAVE

DONE

No unnecessary instructions.

VISUAL DIRECTION:

- Purple and black luxury event styling.
- Premium party typography.
- Strong contrast.
- Minimal visual clutter.
- QR code as the primary focal point.
- Subtle, controlled accent lighting.
- Matching PartyButton design system.

QR REQUIREMENTS:

Generate a REAL session-specific QR code.

It must encode a valid public HTTPS URL for the generated photo's download experience.

DO NOT use:
- localhost URLs.
- Local filesystem paths.
- data: URLs.
- Placeholder QR content.
- Fake/demo links.
- Internal-only URLs presented as public.

QR must have:
- A clean white background.
- A proper white quiet zone.
- High contrast.
- Adequate physical display size.
- Reliable scan performance.

Do not place artwork over critical QR modules.

LINK SECURITY:

- Use unguessable download tokens.
- Never expose API credentials.
- Protect access to generated photos.
- Validate token expiration.
- Use appropriate server-side access checks.
- Never allow access to another guest's photo by guessing a session ID.

STORAGE:

Use the existing configured storage provider where appropriate.

Prefer durable object storage.

Preserve original image quality.

Avoid using temporary in-memory blobs as a production download backend.

TOKEN EXPIRATION:

Use a configurable TTL.

Provisional default:
24 hours.

IMPORTANT:
The 24-hour duration is not yet client-approved.

Document it as configurable and pending approval.

Expiration must be enforced server-side.

Expired images and related metadata must be cleaned up according to the configured retention policy.

MOBILE LANDING:

Create a lightweight, responsive mobile webpage.

When a guest scans the QR code:

1. Open the secure HTTPS link.
2. Validate the download token.
3. Display the actual generated photo.
4. Preserve the original portrait proportions.
5. Provide a clear Save/Download action.
6. Handle iOS Safari and Android Chrome appropriately.
7. Handle expired or unavailable photos gracefully.

Ensure the image is not recompressed unnecessarily.

Support correct Content-Type and Content-Disposition behavior.

Do not guarantee automatic saving to the photo gallery, because browser behavior varies.

DONE BUTTON:

DONE -> existing Thank You screen.

IDLE BEHAVIOR:

Do not automatically dismiss the QR screen before a reasonable scan opportunity.

Make the idle timeout configurable.

Avoid exposing one guest's image to the next guest.

ERROR RECOVERY:

If the QR URL or storage upload fails:
- Retry the upload or link operation safely.
- Reuse the already generated image.
- Never trigger another paid AI generation.
- Route unrecoverable errors to the existing global error state.
- Preserve failed-stage context.

DEVELOPMENT FALLBACK:

If production storage, public domain, or HTTPS deployment is unavailable:

- Provide a clearly labeled NONPUBLIC development storage adapter.
- Keep development preview behavior separate from production.
- Do not display a mock QR as if it were functional.
- Do not claim that the QR is production-ready.
- Document missing infrastructure.

TESTS:

- QR URL generation.
- URL encode/decode roundtrip.
- Valid token access.
- Expired token rejection.
- Cross-session access prevention.
- Download MIME type.
- Content-Disposition headers.
- Download file integrity.
- QR screen re-entry.
- No repeated AI generation.
- Mobile layout.
- QR screen idle behavior.
- Storage failure recovery.

Capture screenshots of:
- QR kiosk screen.
- Mobile download landing page.

Actual physical phone scan validation must remain pending until a public HTTPS deployment exists.

========================================
PHASE 4 — FULL INTEGRATION
========================================

Now integrate all three phases together.

Expected sequence:

Countdown completed
    |
    v
Captured image ready
    |
    v
Create/reuse idempotent generation job
    |
    v
AI Processing
    |
    v
Job SUCCEEDED
    |
    v
High-resolution output/compositing
    |
    v
Final Result
    |
    v
GET MY PHOTO
    |
    v
QR Download
    |
    v
Mobile secure download
    |
    v
DONE
    |
    v
Existing Thank You screen

Error paths:

Generation failure -> Existing Error & Retry

Export failure -> Existing Error & Retry

Storage failure -> Existing Error & Retry

QR failure -> Existing Error & Retry

Preserve existing failure context and recovery behavior.

INTEGRATION REQUIREMENTS:

- One consistent session lifecycle.
- One authoritative generation job.
- One immutable generated output per successful job.
- One reusable exported image artifact.
- Session-specific QR access.
- No duplicated paid generation.
- No lost output after frontend reload.
- No stale session leakage between guests.
- No frontend API secrets.
- Safe state transitions.
- Clear error recovery.

Use durable server-side state rather than local browser state as the sole source of truth.

========================================
PHASE 5 — VALIDATION
========================================

Run all available relevant checks.

At minimum:

1. Type checking.
2. Linting.
3. Unit tests.
4. Job lifecycle integration tests.
5. Image export tests.
6. Storage and QR tests.
7. Build validation.
8. Browser-based UI checks where tooling allows.
9. Responsive screenshot review.
10. Security checks for exposed secrets and public URLs.

Use a mock AI provider for automated tests.

Do not make chargeable external AI calls without authorization.

If an external service cannot be tested, document exactly what is blocked.

Do not mark untested integration as verified.

========================================
PHASE 6 — DOCUMENTATION
========================================

Update existing project documentation.

Include:

- Job state machine.
- Idempotency behavior.
- Retry and timeout rules.
- Storage architecture.
- Export pipeline.
- QR token lifecycle.
- Environment variables.
- Production infrastructure requirements.
- Development-mode limitations.
- Test results.
- Remaining blockers.

Update the project's progress tracker.

Do not create unnecessary duplicate documentation.

========================================
STRICT SCOPE
========================================

IMPLEMENT:
- Step 07 Processing UI and generation jobs.
- Step 08 Final Result and image export.
- Step 09 QR Download and mobile landing.
- Integration between these phases.
- Minimal existing error/thank-you routing.

DO NOT IMPLEMENT:
- A redesigned Welcome screen.
- A redesigned Style Selection screen.
- A redesigned Camera screen.
- A redesigned Countdown screen.
- New AI styles.
- An unrelated admin dashboard.
- A new Thank You screen.
- A redesigned Error screen.
- Unrequested project-wide refactoring.

Maintain the existing approved party theme and button system.

Do not alter the source caricature project.

========================================
FINAL DELIVERY
========================================

Complete all three phases in one continuous task.

When finished, report:

1. Files created or modified.
2. Server job architecture.
3. AI provider integration status.
4. Image export implementation.
5. Purple background verification.
6. QR storage and mobile download implementation.
7. Tests actually executed and results.
8. Screenshots captured.
9. Remaining infrastructure or credential blockers.
10. Deployment readiness.

STOP after Step 09.

Do not proceed into full Thank You / Error polish or later phases.

Do not claim production readiness unless it has been genuinely verified.
    
# STEP 10 — Thank you and error recovery

**Codex model:** GPT-6.2 Sol

**Thinking:** Medium

---

Implement ONLY Thank You and global Error & Retry + session cleanup. Thank You copy `YOU NAILED IT!` + `DO IT AGAIN`, return automatically to Welcome after configurable short idle (initial proposal 6s), and immediate restart on tap. The background must feel like a tasteful live concert/event finale, NOT AI purple blobs.

Global Error screen: `OOPS!` plus a single actionable explanation and `TRY AGAIN` + optional `START OVER`. Handle camera denied/disconnect, countdown cancellation edge, AI/provider fail, slow requests/timeouts, loss of network, storage upload fail, expired/missing QR, offline kiosk. Restore to correct stage via failure metadata; if result already exists, NEVER rerun paid generation to fix QR. Hide technical stack traces from guests.

On session termination, stop camera tracks, clear frontend captured/generated image references and object URLs, delete temporary local data, close pending timers/controllers and reset style. Do not promise deletion from server without TTL enforcement/cleanup verification. Prevent previous guest's portrait appearing to next guest or in browser back history. Respect reduced motion. Run error/cleanup tests and screenshot both screens. Update progress. STOP before final QA.


---

# STEP 11 — Visual fidelity and full QA

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Perform a whole-product VISUAL and FUNCTIONAL QUALITY PASS. Do not add screens or features beyond the approved nine. Read `brief/references/approved-screens/`, both brand PDFs, invitation stills, voice note transcript, and `docs/PROGRESS.md`. Audit for generic AI-looking UI, awkward typography, inconsistent spacing, cheap glow and artificial swirls; correct details to reach a credible luxury party installation. Maintain approved purple/black/orange hierarchy; preserve official logos. Prioritize actual design execution over explanatory paragraphs.

Capture real browser screenshots of ALL NINE states at 1080x1920 and one smaller viewport. Use simulator only where required and clearly mark simulated samples. Inspect screenshots, then iterate until composition, text hierarchy, contrast, safe areas, 44px+ touch hit regions and reduced-motion modes are correct. Check every transition including Cancel, Back, automatic reset and recovery branches. Verify if there is no green in FINAL caricature backgrounds. Use a small number of high-quality visuals, no full screenshot background overlays. Optimize asset size, image sharpness, animation timing and CPU/GPU on kiosk device if accessible.

Run lint, typecheck, build, unit tests and Playwright/e2e with screenshots; fix regressions. Summarize pass/fail in `docs/QA_REPORT.md`, separate blocked hardware/production-network tests from truly passed ones. Update progress. STOP before live deployment or chargeable API use.


---

# STEP 12 — Production readiness and handoff

**Codex model:** GPT-6.2 Sol

**Thinking:** High

---

Prepare the NEW Photo Booth project for real-event operation, but DO NOT deploy, incur charges or configure production credentials without explicit approval.

1. Review `docs/QA_REPORT.md`, verify all nine states, source-readonly policy, brand compliance, #966BFC final caricature backgrounds, consent/privacy/retention, external API credentials only on server, real secure QR URLs, camera permissions, and uptime/restart behavior.
2. Create `docs/DEPLOYMENT.md`, `docs/EVENT_CHECKLIST.md`, `docs/REMAINING_BLOCKERS.md`, `.env.example`, clear README and scripts. Describe two deployment paths if appropriate: web kiosk (HTTPS/Vercel-compatible) vs Windows local kiosk with optional DSLR bridge; label actual hardware unknown until confirmed.
3. Specify exact manual checks: target display resolution, webcam/DSLR test, venue network, real model generation with client-approved sample, physical phone QR scan, iOS/Android save, retention expiry, crash recovery, event preflight. Include estimated API usage calculation only after verified model and confirmed volume; don't invent prices.
4. Run all local validation commands; summarize test evidence and unresolved tasks. Provide a ready-to-execute deployment instruction but DO NOT launch automatically.
5. If the user has explicitly authorized live API calls/deployment in a later turn, follow those instructions and report verified URLs/results; otherwise stop at handoff.

Final response in Arabic: status by screen, file paths, commands/tests actually run, blockers, and next human decisions. Update `docs/PROGRESS.md`.
