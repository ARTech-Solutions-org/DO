import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { transition, welcome, type BoothEvent, type BoothState } from "../src/booth/flow.ts";
import { enabledStyles } from "../src/booth/config.ts";
import { MemoryJobRepository, processGeneration } from "../src/server/jobs.ts";
import { browserCamera, portraitCrop } from "../src/camera/browser.ts";

const consent = { type: "consent", sessionId: "session-1", consentAt: "2026-01-01T00:00:00Z" } as const;
const chooseStyle = transition(welcome, consent);
const selected = transition(chooseStyle, { type: "select-style", styleId: "caricature" });

const events: BoothEvent[] = [
  { type: "continue" }, { type: "arm" }, { type: "captured", jobId: "job-1" },
  { type: "generated", jobId: "job-1", resultId: "result-1" }, { type: "open-qr" }, { type: "done" }, { type: "reset" },
];
const path: BoothState[] = [welcome, selected];
for (const event of events) path.push(transition(path[path.length - 1], event));

test("matches the brief’s complete route and clears guest identifiers on exit", () => {
  const brief = JSON.parse(readFileSync(new URL("../brief/config/screens.json", import.meta.url), "utf8"));
  assert.deepEqual(path.map((state) => state.stage), brief.standardFlow);
  assert.deepEqual(new Set([...path.map((s) => s.stage), "error"]).size, 9);
  assert.deepEqual(path.at(-2), { stage: "thank-you" });
  assert.deepEqual(path.at(-1), welcome);
});

test("every active stage supports error, contextual retry and clean reset", () => {
  for (const state of path.slice(0, -1)) {
    const failed = transition(state, { type: "fail" });
    assert.deepEqual(failed, { stage: "error", failed: state });
    assert.deepEqual(transition(failed, { type: "retry" }), state.stage === "countdown" ? path[2] : state);
    assert.deepEqual(transition(failed, { type: "reset" }), welcome);
  }
});

test("ignores early, duplicate and stale events and supports cancelling a countdown", () => {
  assert.equal(transition(welcome, events[2]), welcome);
  assert.equal(transition(path[4], events[2]), path[4]);
  assert.equal(transition(path[4], { type: "generated", jobId: "old", resultId: "old" }), path[4]);
  assert.deepEqual(transition(path[3], { type: "cancel" }), path[2]);
  assert.deepEqual(transition(path[2], { type: "back" }), selected);
});

test("one approved style can be selected before continuing and survives the capture handoff", () => {
  assert.deepEqual(enabledStyles.map((s) => s.id), ["caricature", "lidar"]);
  assert.deepEqual(selected, { ...chooseStyle, styleId: "caricature" });
  assert.deepEqual(path[2], { ...selected, stage: "camera" });
  assert.deepEqual(path[3], { ...selected, stage: "countdown" });
  assert.deepEqual(transition(path[2], { type: "back" }), selected);
});

test("Continue requires a selection and Back clears the session", () => {
  assert.equal(transition(chooseStyle, { type: "continue" }), chooseStyle);
  assert.equal(transition(chooseStyle, { type: "back" }), welcome);
  assert.equal(transition(selected, { type: "back" }), welcome);
  assert.equal(transition(selected, { type: "reset" }), welcome);
  const restarted = transition(transition(selected, { type: "back" }), { ...consent, sessionId: "session-2" });
  assert.deepEqual(restarted, { stage: "choose-style", sessionId: "session-2", consentAt: consent.consentAt });
  assert.equal(transition(restarted, { type: "continue" }), restarted);
});

const request = { sessionId: "s", captureId: "c", styleId: "caricature" as const, photo: new Blob(["fixture"]) };

test("concurrent and repeated submissions share one edit and one stored result", async () => {
  const repo = new MemoryJobRepository();
  let edits = 0;
  let saves = 0;
  const submit = () => processGeneration(request, repo, { async edit() { edits++; return request.photo; } },
    { async save() { saves++; return { resultId: "r" }; } });
  const [first, duplicate] = await Promise.all([submit(), submit()]);
  assert.equal(first.id, duplicate.id);
  assert.deepEqual(first, { id: first.id, status: "succeeded", resultId: "r" });
  assert.deepEqual(await repo.get(first.id), first);
  assert.deepEqual(await submit(), first);
  assert.deepEqual([edits, saves], [1, 1]);
});

test("a storage failure keeps the key reserved and isolates different sessions", async () => {
  const repo = new MemoryJobRepository();
  let edits = 0;
  const submit = (sessionId: string) => processGeneration({ ...request, sessionId }, repo,
    { async edit() { edits++; return request.photo; } }, { async save() { throw Error("fixture"); } });
  const first = await submit("s");
  assert.equal(first.status, "failed");
  assert.deepEqual(await submit("s"), first);
  assert.notEqual((await submit("other")).id, first.id);
  assert.equal(edits, 2);
});

test("centers a native 4:5 crop in landscape and portrait camera coordinates", () => {
  assert.deepEqual(portraitCrop(3840, 2160), { x: 1056, y: 0, w: 1728, h: 2160 });
  assert.deepEqual(portraitCrop(1080, 1920), { x: 0, y: 285, w: 1080, h: 1350 });
  assert.deepEqual(portraitCrop(801, 1001), { x: 0, y: 0, w: 800, h: 1000 });
  assert.throws(() => portraitCrop(0, 0), /unavailable/);
});

test("webcam adapter releases the stream if preview startup fails", async (t) => {
  let stops = 0;
  const stream = { getTracks: () => [{ stop() { stops++; } }] };
  const media = { getUserMedia: async () => stream };
  t.mock.getter(globalThis, "navigator", () => ({ mediaDevices: media }) as unknown as Navigator);
  const preview = { srcObject: null, async play() { throw Error("play failed"); } };
  await assert.rejects(browserCamera.open(preview as unknown as HTMLVideoElement), /play failed/);
  assert.equal(stops, 1);
  assert.equal(preview.srcObject, null);
});
