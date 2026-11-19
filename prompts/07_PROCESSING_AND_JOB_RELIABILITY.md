# STEP 07 — Processing and job reliability

**Codex model:** GPT-6.2 Sol

**Thinking:** High

---

Implement ONLY the Processing screen and its server job lifecycle end to end using the caricature adapter established in Step 06. Screen copy limited to `MAKING MAGIC` and if needed one small real status `CREATING YOUR LOOK`. Use premium, restrained party kinetic typography and physical vinyl/disco-light inspired motion, no generic AI glowing rings or fake progress bars.

Design job states QUEUED/RUNNING/SUCCEEDED/FAILED/TIMED_OUT with server-side secrets, one stable session/job ID, idempotent generation submissions, race-safe retries, durable metadata and meaningful timeouts. Do not duplicate chargeable model calls on frontend refresh/retry. No fake percentage; give error screen on genuine failure. If queue/worker persistence isn't configured, implement an explicit development adapter and document why it is nonproduction. When SUCCESS, transition once to Final Result; when failure, enter the existing global error state with failed-stage context.

Use mock provider for automated test runs; external live calls only with authorization. Test slow jobs, network drops, duplicate request IDs, page reload, timeout, success, error, no-secret exposure. Run checks, capture processing UI, update progress. STOP before final result / QR.
