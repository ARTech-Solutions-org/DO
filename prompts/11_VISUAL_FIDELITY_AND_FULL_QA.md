# STEP 11 — Visual fidelity and full QA

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Perform a whole-product VISUAL and FUNCTIONAL QUALITY PASS. Do not add screens or features beyond the approved nine. Read `brief/references/approved-screens/`, both brand PDFs, invitation stills, voice note transcript, and `docs/PROGRESS.md`. Audit for generic AI-looking UI, awkward typography, inconsistent spacing, cheap glow and artificial swirls; correct details to reach a credible luxury party installation. Maintain approved purple/black/orange hierarchy; preserve official logos. Prioritize actual design execution over explanatory paragraphs.

Capture real browser screenshots of ALL NINE states at 1080x1920 and one smaller viewport. Use simulator only where required and clearly mark simulated samples. Inspect screenshots, then iterate until composition, text hierarchy, contrast, safe areas, 44px+ touch hit regions and reduced-motion modes are correct. Check every transition including Cancel, Back, automatic reset and recovery branches. Verify if there is no green in FINAL caricature backgrounds. Use a small number of high-quality visuals, no full screenshot background overlays. Optimize asset size, image sharpness, animation timing and CPU/GPU on kiosk device if accessible.

Run lint, typecheck, build, unit tests and Playwright/e2e with screenshots; fix regressions. Summarize pass/fail in `docs/QA_REPORT.md`, separate blocked hardware/production-network tests from truly passed ones. Update progress. STOP before live deployment or chargeable API use.
