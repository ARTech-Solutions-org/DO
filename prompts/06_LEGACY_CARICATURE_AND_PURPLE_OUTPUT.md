# STEP 06 — Legacy caricature and purple output

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Now integrate the existing caricature engine into the NEW project only. First reread `docs/AUDIT.md` and inspect the SOURCE PROJECT again in READ-ONLY mode:
`F:\ARTech\photobooth caracter\photobooth caracter`
Do not change, refactor, install dependencies, remove or overwrite ANY file in the old folder. Never copy .env, keys, tokens, real guest data, logs, or private photographs.

Trace actual prompt templates/provider/edit calls/preprocessing/cropping/segmentation/compositing. Reuse only licensed/necessary logic and prompts in a new isolated adapter `src/.../caricature` with provenance notes. Keep provider and model configurable after verifying current API support. Preserve flattering recognizable caricature identity, no forced ethnicity/skin tone, no real-person samples. Final output's background MUST be unmistakably purple EXACTLY `#966BFC` (RGB 150 107 252), regardless of old project's green background. Find and explain source of green. If green is a chroma intermediary preserve it only internally and replace final composited pixels with precise purple using tested subject mask/alpha; avoid green fringes/halo/hair degradation. If green comes from text prompt, change prompt AND use robust deterministic compositing where needed; modifying CSS behind an opaque green image is not enough. Avoid replacing genuine green clothing or eye details.

Implement dry-run mocked provider and tests for foreground transparency/subject edges, solid background pixels, no source mutation, image dimensions, and prompt selection. For real image tests, ASK FOR EXPLICIT USER PERMISSION before any chargeable generation request or uploading images; make accurate report if unavailable. Update `docs/CARICATURE_INTEGRATION.md` with source file mapping and before/after evidence when actually tested. Do NOT state identity preservation is guaranteed. Run checks and update progress. STOP here.
