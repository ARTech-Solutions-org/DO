# Decisions and blockers · Step 00

18 November 2026. These decisions apply to the independent DO Hotels / ONE Development party booth.

## Current design baseline

| Item | Working decision |
| --- | --- |
| Kiosk flow | Welcome → Choose Your Style → Camera → Countdown → AI Processing → Final Result → QR Download → Thank You → Welcome. Error & Retry is global. QR opens a handset download destination outside the nine kiosk states. |
| Display and export | Use a configurable 1080×1920 portrait kiosk reference until measured. The downloadable portrait has its own dimensions, crop and logo clearance, pending sign-off. |
| Style and identity | Caricature is the sole active style. Specify ONE purple `#966BFC` for the finished portrait background. DO black/white and subtle warm orange `#E48D3D` support the party art direction. Approved logo variants retain their colors. |
| Consent and retention | Obtain affirmative consent on Welcome before capture and transmission. The brief proposes 24 hours for results. Actual retention, link validity, provider handling and deletion remain open. QR's 60 s idle timer and Thank You's 6 s reset are UI defaults independent of retention. |
| Source reuse | Reuse the design of the capture, likeness and composition steps. New code, artwork, credentials and delivery settings belong to this workspace. Confirm rights before copying custom source or prompt text. |

## Inputs needed and what they gate

| Topic | Missing decision or evidence | Affected work |
| --- | --- | --- |
| Kiosk and venue | Actual display pixels, orientation, physical/touch area, scaling, OS/browser or kiosk packaging, camera make/model and connection, webcam enumeration or DSLR bridge, available light and event connectivity. Confirm single-person vs group framing, mirror policy, and final export aspect/size. | Camera integration, framing, performance and device acceptance. |
| Co-brand assets | Official vector lockups for both brands, authorized variants, co-brand hierarchy and placement, licensed font files or approved substitutes and embedding rights, and an approved style example. | Production typography, Welcome artwork and export frame. |
| Additional styles | Client-approved names, examples and rights for any future styles. | Catalog expansion only. Caricature can proceed alone. |
| AI service | Approved provider/model with actual account access, funding owner, per-event budget, usage limits and explicit authorization for paid testing. Configure new server credentials through the owner's secret store. | Live generation, quality/latency measurements and capacity validation. Legacy model strings establish only what the old code requests. |
| QR delivery | Owner of a public HTTPS domain, hosting/storage account, region, access policy, signed link duration, object lifecycle and event-network availability. | Phone download, expiry and deletion verification. |
| Privacy | Organizer-approved photo/AI disclosure and policy link, handling of raw captures and provider copies, result retention, deletion owner and consent wording. | Real guest capture, processing and distribution. |
| Legacy rights and storage exposure | No application-level reuse license found. Owner confirmation needed to copy custom code or media. Hardcoded R2 fallback credentials exist in loose and packaged upload handlers. Storage owner to review and rotate active credentials. | Direct reuse of third-party material and remediation of the separate system. No dependency on these credentials for local scaffolding. |

The next sequential instruction can authorize a local scaffold using typed interfaces and a visibly labeled simulator while hardware, brand, funding and privacy decisions remain open.

## Step 01 decisions · 18 November 2026

- Next.js App Router, React and TypeScript run locally. Node 24.22.3 was used for verification. Direct dependency versions and the npm lockfile are recorded in the scaffold.
- The development simulator runs only with the development build. The production root is an inactive setup page until guest screens are authorized.
- The camera adapter is implemented for browser webcams. The device and any native DSLR bridge remain pending hardware confirmation. Server integration contracts and an in-memory idempotency reservation are available for later work. No live provider, QR destination or retention period was selected.
- The inputs listed above remain open. Step 02 can proceed with visual assets and typography while official logos and font rights are obtained.
