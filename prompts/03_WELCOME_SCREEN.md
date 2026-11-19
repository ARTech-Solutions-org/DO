# STEP 03 — Welcome screen

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Build ONLY the WELCOME screen and the shared visual components it actually needs, using the approved party design directions from `brief/` and assets from Step 02. The screen must feel like a refined LIVE EVENT poster brought to life, not an AI dashboard.

Design: 1080x1920 reference portrait scale, actual DOM typography with bold condensed headline `OWN THE NIGHT`, one prominent `TAP TO START` action, small authentic/co-branded logo placements following the manuals, purple #966BFC stage lights, restrained realistic disco/chrome motif and selective DO orange highlights. Keep high contrast and negative space. Use GSAP only when needed (or lightweight CSS); tasteful 0.8-1.2s intro, atmospheric motion, no obnoxious particle storm. `prefers-reduced-motion` and mute default. Do not rasterize labels or logos in backgrounds.

Functional gate: `TAP TO START` initializes an anonymous session and advances to Choose Your Style; include a short understandable camera/AI processing consent mechanism before personal imagery is sent, with legal wording marked pending approval. No camera starts before consent. Hide debug UI in production.

Run and capture actual rendered 1080x1920 screenshot plus secondary viewport screenshot. Compare layout to approved concept, correct spacing, lighting, type, and click behavior. If you cannot run browser screenshots, report it plainly. Record screenshots in `artifacts/qa/03-welcome/`, run lint/typecheck/build, update `docs/PROGRESS.md`.

STOP after Welcome. Do not implement subsequent screens in this step.
