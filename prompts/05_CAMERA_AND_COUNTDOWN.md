# STEP 05 — Camera and countdown

**Codex model:** GPT-6.2 Astra

**Thinking:** High

---

Implement the TWO approved, visibly distinct Camera and Countdown screens with ONE continuous underlying camera stream. Do not add Photo Review or Retake screen.

Camera: display genuine live preview (NOT stock/sample screenshot) using `navigator.mediaDevices.getUserMedia` on HTTPS or localhost. Expose device selection when necessary, optional preview mirroring vs actual exported-photo mirroring, crop/aspect rules, camera warm-up, permission states, disconnected device, hardware failures, and accessibility. Copy `STRIKE A POSE` + one `CAPTURE` button; Back safely stops/reuses tracks according to state.

Countdown: clicking CAPTURE transitions once, freezes controls against double-tap, keeps the SAME stream alive and shows full-screen 3 -> 2 -> 1 with restrained beat-synced motion. Take EXACTLY ONE properly oriented high-resolution frame at zero; immediately begin generation submit transition to AI Processing. `CANCEL` goes back to Camera without capture. Handle tab focus loss and cancellation cleanly. Use injectable mock-camera for automated tests, not pretend it is a real webcam.

Create tests for duplicate shutter prevention, cancel, stream reuse, permissions denied, unplugging, captures only once, orientation/crop, and camera cleanup. Capture screenshots both states using simulation for visual QA, label as simulated. Document real-hardware test still pending unless genuinely performed. Run checks and update progress. STOP before real AI integration.
