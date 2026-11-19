# Photo booth scaffold

The local Next.js App Router application uses TypeScript and React. The tested runtime is Node 24.22.3 (recorded in `.node-version`). The Windows default Node 22.12.0 is below the lint dependency’s supported range. Select the pinned runtime before installing. From the workspace root, use `npm ci` to reproduce the lockfile and `npm run dev` to open the simulator at `http://127.0.0.1:3000`. It works with an empty environment.

## Boundaries

| Module | Responsibility |
| --- | --- |
| `src/app/`, `src/dev/Simulator.tsx` | The server page loads the simulator only during development. The simulator drives the shared reducer with fixed synthetic IDs, explicit step buttons and an always-visible DEV label. The standard booth opens on Welcome. The simulator remains development-only. |
| `src/booth/config.ts`, `flow.ts` | Client-safe catalog, palette, provisional display and timings, and a pure event-driven state machine. The style ID type comes from the catalog. A consent event opens a session. Invalid transitions and mismatched job completions leave state unchanged. |
| `src/camera/browser.ts` | `CameraAdapter.open` attaches one webcam stream to the caller's preview element and returns a session with `capture` and `close`. The future Camera and Countdown screens share the session. A native camera bridge can implement the same contract. The simulator never opens a camera. |
| `src/server/ports.ts` | Server-only contracts for image editing, saving/reading/removing results, and issuing an expiring download destination for QR. The final storage and link implementations will enforce event retention and access rules. |
| `src/server/jobs.ts` | The processor reserves a session/capture/style key, invokes an injected editor, saves the result, and records its ID. Duplicate submissions return the existing job. Consumers can look up a running job by ID. A failed edit or save retains the reservation for reconciliation. |
| `tests/scaffold.test.ts` | Verifies state order against the brief, recovery, cleanup, stale events, concurrency, failure, and camera cleanup with in-memory fixtures. |

**Standard flow**  
Welcome → Choose Your Style → Camera → Countdown → AI Processing → Final Result → QR Download → Thank You → Welcome.

Each of the eight normal states can enter Error & Retry. Retry restores the failed stage with its existing identifiers, except that an interrupted countdown returns to Camera for a fresh shutter action. Retrying QR retains the result ID. Thank You drops session identifiers and reset returns to a clean Welcome.

**Initial scaffold data flow**  
Consented camera session → capture blob and stable capture ID → server job processor → image editor → result storage → expiring QR link. The browser sends no photos during this scaffold. The reducer stores identifiers only. The editor, storage and QR interfaces have no live service bindings. Module-level `server-only` guards protect the server boundary. Reserved env names in `.env.example` have no values or public prefix.

## Decisions and dependencies

The in-memory repository implements single-process idempotency for tests. A durable reservation, worker, crash recovery and reconciliation of ambiguous provider outcomes are needed before real generation. Storage, signed links and deletion cannot be validated until the event owner chooses hosting and retention. The audit's hardware, asset, funding and consent decisions remain open in [Decisions and blockers](DECISIONS_AND_BLOCKERS.md).

Setup follows the official App Router installation and flat ESLint configuration. Direct dependencies are pinned and the npm lockfile records transitive versions. [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) · [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint) · [React versions](https://react.dev/versions)

## Steps 07–09 · Job and photo delivery

The kiosk sends one JPEG per capture to `/api/booth/[jobId]` after consent. It assigns a UUID to the guest session and another UUID to the job and immutable capture. A random 256-bit attempt capability authorizes kiosk status, result and link requests. The API stores only the hash of that capability. The browser stores the current tab's job pointer in session storage and buffers the raw JPEG in IndexedDB until the server acknowledges the reservation. The buffer expires after ten minutes and is deleted on acknowledgement, reset or a later capture's cleanup. Reopening the active tab or reloading it resumes the same attempt. Closing a guest session removes its pointer.

### Job lifecycle and retries

- The disk adapter publishes the claim through an atomic, exclusive hard link on one volume. The claim binds the job ID, session ID, style, owner hash and input hash. Duplicate requests with matching inputs return the same job. A conflicting use of the ID is rejected.
- `QUEUED` marks a reserved job. `RUNNING` requires an exclusive start record, which allows only its creator to call the provider. The server schedules the worker with Next.js `after()`. Creation, start, update and completion timestamps come from the server.
- `SUCCEEDED` records the immutable export. `FAILED` and `TIMED_OUT` carry generation or export context. A deadline aborts the in-flight request where the provider supports cancellation. A client refresh, failed request, timeout or lost provider response never repeats a provider call for the same capture.
- Source and final-image writes each have one bounded in-worker retry. A recoverable terminal job can retry the export from its persisted source without calling AI. A manual retry after transport loss resumes the same job. A vanished worker remains reserved and becomes timed out at its deadline. Provider billing for an ambiguous outcome requires operator reconciliation.
- The file adapter is for local verification and a configurable single-instance pilot. A crash before the generated source is committed can lose that result. The production design requires a durable queue, durable metadata and private object storage, plus a provider reconciliation procedure. The original in-memory scaffold remains available for adapter tests.

### Export and token lifecycle

`src/server/delivery/export.ts` takes the original opaque 1024×1024 PNG created by Step 06. PNG mode preserves its bytes. WebP mode uses lossless encoding. The export does not resample, stretch or re-crop. Approved frame, logo files and placement settings are pending, so the current composition is the native portrait. At its actual resolution it provides 256 PPI for a 4-inch square or about 171 PPI at 6 inches. A production print claim requires the target size and physical proof.

The source and final format are published once under `BOOTH_DATA_DIR/jobs/<job ID>/`. Metadata records format, dimensions, byte length, storage filename and SHA-256. Before delivery the server verifies the SHA-256 against the stored bytes. Kiosk preview and handset download use the same export. The QR encodes the canonical HTTPS landing URL and has a four-module white quiet zone. The signed, job-specific capability authorizes the landing page and its file endpoint. A guest's kiosk job ID alone cannot access the file. Images use private/no-store, correct MIME and inline or attachment disposition. Mobile browser save behavior depends on the platform.

Expiry is measured from reservation and enforced on every protected read. The provisional default of 24 hours is pending approval. Run `npm run cleanup:booth` on an external schedule under the same environment and account as the booth. It removes expired exports, source images and metadata. Keep the data directory private and outside web assets. QR idle is independent of retention and starts after the link loads. Done and idle clear the kiosk pointer and route through the minimal Thank You handoff.

### Runtime configuration

| Variable | Effect |
| --- | --- |
| `BOOTH_MODE` | Empty disables the job API. `local` allows loopback access with the mock provider. `local-live` uses OpenAI on loopback with the private disk store and nonpublic download preview. `hosted` enables the configured HTTPS delivery path and requires a protected kiosk ingress and OpenAI configuration. |
| `BOOTH_DATA_DIR` | Local defaults to `guest-data`. A hosted pilot requires an absolute private, persistent path on a filesystem with hard-link support. |
| `BOOTH_PUBLIC_ORIGIN` | Canonical public HTTPS origin for the mobile route. The operator must provision and verify DNS, TLS and handset reachability. The application refuses loopback, literal addresses, test origins and non-HTTPS URLs. |
| `BOOTH_KIOSK_SECRET` | Hosted-only ingress secret. A trusted reverse proxy authenticates kiosk traffic, strips client-supplied values and injects it as `X-Booth-Kiosk` for kiosk API requests. Never put it in the browser. |
| `BOOTH_TOKEN_SECRET` | Stable hosted HMAC key. Use a separate random secret. Changing it invalidates outstanding links. |
| `IMAGE_EDIT_PROVIDER`, `IMAGE_EDIT_MODEL`, `IMAGE_EDIT_API_KEY` | Existing server-only OpenAI settings. Hosted and local-live require the OpenAI provider and authorized credentials. Local mock mode forces mock. |
| `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_HOUR` | Local-live per-process limits for new OpenAI jobs, defaulting to 6 per minute and 60 per hour. |
| `BOOTH_JOB_TIMEOUT_SECONDS`, `BOOTH_RETENTION_SECONDS` | Defaults are 200 seconds and 86,400 seconds. The hosting runtime needs enough execution time for the selected job deadline. |
| `BOOTH_QR_IDLE_SECONDS`, `BOOTH_EXPORT_FORMAT`, `BOOTH_MOCK_DELAY_SECONDS` | Defaults are 60 seconds, PNG and a 2-second local mock delay. Lossless WebP is also supported. |

The local preview contains a link to the handset page on the same loopback origin and a conspicuous nonpublic label. It displays no QR. Hosted mode and physical phone scanning still need a public HTTPS deployment, approved retention, provisioning for private durable storage and appropriately scoped AI credentials. Tests use mocks and synthetic captures. The source project receives no writes.
