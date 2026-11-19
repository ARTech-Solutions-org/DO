# STEP 10 — Thank you and error recovery

**Codex model:** GPT-6.2 Sol

**Thinking:** Medium

---

Implement ONLY Thank You and global Error & Retry + session cleanup. Thank You copy `YOU NAILED IT!` + `DO IT AGAIN`, return automatically to Welcome after configurable short idle (initial proposal 6s), and immediate restart on tap. The background must feel like a tasteful live concert/event finale, NOT AI purple blobs.

Global Error screen: `OOPS!` plus a single actionable explanation and `TRY AGAIN` + optional `START OVER`. Handle camera denied/disconnect, countdown cancellation edge, AI/provider fail, slow requests/timeouts, loss of network, storage upload fail, expired/missing QR, offline kiosk. Restore to correct stage via failure metadata; if result already exists, NEVER rerun paid generation to fix QR. Hide technical stack traces from guests.

On session termination, stop camera tracks, clear frontend captured/generated image references and object URLs, delete temporary local data, close pending timers/controllers and reset style. Do not promise deletion from server without TTL enforcement/cleanup verification. Prevent previous guest's portrait appearing to next guest or in browser back history. Respect reduced motion. Run error/cleanup tests and screenshot both screens. Update progress. STOP before final QA.
