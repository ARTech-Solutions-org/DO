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
