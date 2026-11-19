import { deliveryConfig } from "../src/server/delivery/config.ts";
import { cleanupExpired } from "../src/server/delivery/store.ts";

const config = deliveryConfig();
if (!config) throw new Error("Configure BOOTH_MODE before pruning.");
await cleanupExpired(config.root, Date.now());
