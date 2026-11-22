import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import sharp from "sharp";
import QRCode from "qrcode";
import { createCaricatureAdapter } from "../src/server/caricature/index.ts";
import { deliveryConfig, publicOrigin } from "../src/server/delivery/config.ts";
import { exportPortrait } from "../src/server/delivery/export.ts";
import { photoResponse } from "../src/server/delivery/http.ts";
import { matchesToken, publicQr, tokenFor } from "../src/server/delivery/links.ts";
import { delivery } from "../src/server/delivery/service.ts";

const mock = createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "mock" }, () => { throw Error("Live request"); });
const owner = "a".repeat(64);
const jpeg = await sharp({ create: { width: 120, height: 160, channels: 3, background: "#4e4254" } }).jpeg().toBuffer();

async function fixture(t: TestContext, timeoutMs = 10000) {
  const root = await mkdtemp(join(tmpdir(), "do-booth-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const config = { ...deliveryConfig({ BOOTH_MODE: "local", BOOTH_MOCK_DELAY_SECONDS: "0" })!, root, timeoutMs };
  const capture = { captureId: randomUUID(), sessionId: randomUUID(), styleId: "caricature" as const,
    photo: new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }) };
  return { config, capture };
}

test("durable reservation transitions once through queue, slow running work, and persisted success", async t => {
  const { config, capture } = await fixture(t);
  let release!: () => void;
  let invoked!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { invoked = resolve; });
  let count = 0;
  const api = delivery(config, { provider: { async edit(req) { count++; invoked(); await gate; return mock.edit(req); } } });
  const now = Date.now();
  const claims = await Promise.all(Array.from({ length: 8 }, () => api.claim(capture, owner, now)));
  assert.equal(claims.filter(claim => claim?.created).length, 1);
  const job = claims[0]!.job;
  assert.equal((await api.status(job)).status, "QUEUED");
  const calls = Promise.all([api.run(job, capture), api.run(job, capture)]);
  await started;
  const restart = delivery(config);
  const resumed = (await restart.lookup(capture.captureId, owner))!;
  const statuses = await Promise.all(Array.from({ length: 8 }, () => restart.status(resumed)));
  assert.ok(statuses.every(value => value.status === "RUNNING" && value.startedAt && !value.completedAt));
  assert.equal(await restart.lookup(capture.captureId, "b".repeat(64)), null);
  assert.equal(await restart.claim({ ...capture, sessionId: randomUUID() }, owner, now), null);
  release();
  await calls;
  const complete = await restart.status(resumed);
  assert.equal(complete.status, "SUCCEEDED");
  assert.equal(complete.id, capture.captureId);
  assert.ok(complete.completedAt! >= complete.startedAt!);
  assert.equal(count, 1);
  const photo = (await restart.photo(resumed))!;
  const response = photoResponse(photo, true);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.match(response.headers.get("content-disposition")!, /^attachment;/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.arrayBuffer(), photo.bytes.buffer);
  assert.equal(photo.artifact.width, 1024);
  assert.equal(photo.artifact.height, 1535);
  assert.equal((await restart.claim(capture, owner, now))!.created, false);
});

test("provider failure stays terminal and timeout cancels without another edit", async t => {
  const { config, capture } = await fixture(t, 1500);
  let attempts = 0;
  for (const isTimeout of [false, true]) {
    const api = delivery(config, { provider: { async edit(_req, signal) {
      attempts++;
      if (!isTimeout) throw Error("redacted-provider-secret");
      return new Promise((_resolve, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
    } } });
    const current = { ...capture, captureId: randomUUID() };
    const now = Date.now();
    const { job } = (await api.claim(current, owner, now))!;
    await api.run(job, current);
    const state = await api.status(job);
    assert.equal(state.status, isTimeout ? "TIMED_OUT" : "FAILED");
    assert.equal(state.failureStage, "generation");
    assert.equal(state.canRecover, false);
    assert.doesNotMatch(JSON.stringify(state), /redacted|ownerHash|inputHash/);
    await api.run(job, current);
    assert.equal((await api.claim(current, owner, now))!.created, false);
  }
  assert.equal(attempts, 2);
});

test("bounded export retries recover from persisted source without generation or recompression", async t => {
  const { config, capture } = await fixture(t);
  let edits = 0;
  let exports = 0;
  const api = delivery({ ...config, format: "webp" }, { provider: { async edit(req) { edits++; return mock.edit(req); } },
    exporter: async (dir, format) => {
      if (++exports <= 2) throw Error("Storage unavailable");
      return exportPortrait(dir, format);
    } });
  const { job } = (await api.claim(capture, owner, Date.now()))!;
  await api.run(job, capture);
  assert.equal((await api.status(job)).failureStage, "export");
  assert.equal(exports, 2);
  assert.equal((await api.recover(job)).status, "SUCCEEDED");
  const { bytes, artifact } = (await api.photo(job))!;
  assert.equal(artifact.contentType, "image/webp");
  const source = await readFile(join(job.dir, "source.png"));
  const pixels = await sharp(source).raw().toBuffer({ resolveWithObject: true });
  const result = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([result.info.width, result.info.height], [1024, 1535]);
  assert.ok(result.info.channels >= 3);
  await api.recover(job);
  assert.equal(exports, 3);
  assert.equal(edits, 1);
});

test("expiration denies access and prunes the job record and all local files", async t => {
  const { config, capture } = await fixture(t);
  let time = Date.now();
  const api = delivery(config, { clock: () => time });
  const { job } = (await api.claim(capture, owner, time))!;
  await api.run(job, capture);
  time = job.claim.expiresAt;
  assert.equal(await api.lookup(capture.captureId, owner), null);
  assert.equal(await api.photo(job), null);
  await api.cleanup();
  await assert.rejects(readFile(join(job.dir, "claim.json")), { code: "ENOENT" });
});

test("local live mode requires OpenAI and throttles new attempts without calling a provider twice", async t => {
  const { config, capture } = await fixture(t, 10_000);
  assert.throws(() => deliveryConfig({ BOOTH_MODE: "local-live", IMAGE_EDIT_PROVIDER: "mock" }));
  const configured = deliveryConfig({ BOOTH_MODE: "local-live", IMAGE_EDIT_PROVIDER: "openai",
    IMAGE_EDIT_API_KEY: "synthetic-test-key", RATE_LIMIT_PER_MINUTE: "1", RATE_LIMIT_PER_HOUR: "2" })!;
  assert.equal(configured.local, true);
  assert.equal(configured.mock, false);
  assert.equal(configured.origin, null);
  const now = Date.now();
  let edits = 0;
  const api = delivery({ ...configured, root: config.root }, {
    clock: () => now,
    provider: { async edit(req) { edits++; return mock.edit(req); } },
  });
  const first = (await api.claim(capture, owner, now))!;
  await api.run(first.job, capture);
  assert.equal((await api.status(first.job)).status, "SUCCEEDED");
  assert.equal((await api.status(first.job)).mock, false);
  await api.run(first.job, capture);
  const second = { ...capture, captureId: randomUUID() };
  const held = (await api.claim(second, owner, now))!;
  await api.run(held.job, second);
  const state = await api.status(held.job);
  assert.equal(state.status, "FAILED");
  assert.equal(state.rateLimited, true);
  assert.equal(edits, 1);
});

test("signed QR URL uses the exact capability, clean margin and an HTTPS canonical origin", async () => {
  const id = randomUUID();
  const at = Date.now() + 600000;
  const token = tokenFor(id, at, "test signing secret");
  assert.ok(matchesToken(token, id, at, "test signing secret"));
  assert.equal(matchesToken(token, randomUUID(), at, "test signing secret"), false);
  assert.equal(matchesToken(token, id, at + 1, "test signing secret"), false);
  assert.equal(matchesToken(token.slice(0, -1), id, at, "test signing secret"), false);
  for (const url of ["http://photos.example.com", "https://localhost", "https://127.0.0.1",
    "https://booth.internal", "https://example.org", "https://a.example.com", "https://10.1.1.1", "https://photos.openai.com/a"]) {
    assert.throws(() => publicOrigin(url));
  }
  // Encoder fixture only. It is never rendered in the local application.
  const { url, qr } = await publicQr("https://photos.openai.com", token);
  assert.equal(new URL(url).pathname, "/download/" + token);
  assert.deepEqual(await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, scale: 12 }), qr);
  const pixels = await sharp(Buffer.from(qr.split(",")[1], "base64")).raw().toBuffer();
  assert.deepEqual([...pixels.subarray(0, 4)], [255, 255, 255, 255]);
});
