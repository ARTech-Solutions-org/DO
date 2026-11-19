# STEP 04 — Style selection

**Codex model:** GPT-6.2 Sol

**Thinking:** Medium

---

Implement ONLY Choose Your Style, reusing the existing design system and components. Keep visual continuity with Welcome. Headline `PICK YOUR VIBE`; display ONE confirmed, functional style tile `CARICATURE`. A `CONTINUE` button proceeds to Camera; Back returns to Welcome. The style catalog must be config-driven for future approved choices but DO NOT invent or enable additional styles. Use an illustrative fictional-person sample clearly separated from actual generated guest output. Do not import any private images from the legacy project.

Keep typography large, copy minimal, and touch targets generous. Avoid text-heavy style descriptions, fake model logos, cheesy glowing cards. Preserve selection across Camera/Countdown but wipe it on new session. Show proper focus states and portrait-responsiveness. Add tests: style selected, Continue disabled when no selection, Back safe, catalog handles one style; run lint/typecheck/build. Capture actual screenshot `artifacts/qa/04-style/`, update progress. STOP before Camera implementation.
