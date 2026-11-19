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
