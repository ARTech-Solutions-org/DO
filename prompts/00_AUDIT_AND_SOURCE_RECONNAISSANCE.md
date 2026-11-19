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
