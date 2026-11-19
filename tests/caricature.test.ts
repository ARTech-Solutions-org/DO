import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { createCaricatureAdapter, promptForStyle } from "../src/server/caricature/index.ts";
import { mockSubjectLayer } from "../src/server/caricature/mock.ts";
import { compositePortrait, preparePortrait } from "../src/server/caricature/portrait.ts";
import { MemoryJobRepository, processGeneration } from "../src/server/jobs.ts";

async function fixture() {
  const input = await sharp({ create: { width: 1200, height: 1500, channels: 3, background: "#675473" } }).jpeg().toBuffer();
  return { sessionId: "synthetic", captureId: "1", styleId: "caricature" as const,
    photo: new Blob([new Uint8Array(input)], { type: "image/jpeg" }) };
}

test("selects the approved prompt and rejects unsupported styles and providers", () => {
  const prompt = promptForStyle("caricature");
  for (const term of ["complexion", "headwear", "transparent", "#966BFC"]) assert.ok(prompt.includes(term));
  assert.throws(() => promptForStyle("glam"));
  assert.throws(() => createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "unknown" }));
  assert.throws(() => createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "openai", IMAGE_EDIT_MODEL: "unknown", IMAGE_EDIT_API_KEY: "fixture" }));
});

test("preprocessing fits the input once and preserves its bytes and aspect ratio", async () => {
  const { photo } = await fixture();
  const original = Buffer.from(await photo.arrayBuffer());
  const meta = await sharp(await preparePortrait(photo)).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ["jpeg", 819, 1024]);
  assert.deepEqual(Buffer.from(await photo.arrayBuffer()), original);
});

test("all matte pixels composite exactly, preserving opaque green eyes, clothing and fine soft edges", async () => {
  const layer = await mockSubjectLayer();
  const original = Buffer.from(layer);
  const source = await sharp(layer).raw().toBuffer();
  const out = await compositePortrait(layer);
  const { data, info } = await sharp(Buffer.from(await out.arrayBuffer())).raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height, info.channels], [1024, 1024, 3]);
  let clear = 0, soft = 0, green = 0;
  const purple = [150, 107, 252];
  for (let i = 0; i < info.width * info.height; i++) {
    const alpha = source[i * 4 + 3] / 255;
    if (alpha === 0) clear++;
    else if (alpha < 1) soft++;
    else if (source[i * 4 + 1] > source[i * 4] && source[i * 4 + 1] > source[i * 4 + 2]) green++;
    for (let c = 0; c < 3; c++) {
      const expected = Math.round(source[i * 4 + c] * alpha + purple[c] * (1 - alpha));
      assert.equal(data[3 * i + c], expected);
    }
  }
  assert.ok(clear > 500000 && soft > 1000 && green > 10000);
  assert.deepEqual(layer, original);
});

test("fails closed for opaque green, empty alpha, bad dimensions and a padded frame with an opaque border", async () => {
  for (const [width, background] of [[1024, "#00ff00"], [1024, "#00000000"], [64, "#00000000"]] as const) {
    const bytes = await sharp({ create: { width, height: width, channels: 4, background } }).png().toBuffer();
    await assert.rejects(compositePortrait(bytes));
  }
  const border = await sharp(await mockSubjectLayer()).composite([{ input: {
    create: { width: 1, height: 1, channels: 4, background: "#ffffff" } }, left: 0, top: 0 }]).png().toBuffer();
  await assert.rejects(compositePortrait(border), /padding/);
});

test("mock runs through job reservation and result storage without network", async () => {
  const req = await fixture();
  const adapter = createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "mock" }, () => { throw Error("network"); });
  const repo = new MemoryJobRepository();
  const results: Blob[] = [];
  const save = async (_id: string, image: Blob) => { results.push(image); return "stored"; };
  const run = () => processGeneration(req, repo, adapter, { save: async (id, image) => ({ resultId: await save(id, image) }) });
  const job = await run();
  assert.equal(job.status, "succeeded");
  assert.deepEqual(await run(), job);
  assert.equal(results.length, 1);
  assert.equal(results[0].type, "image/png");
});

test("OpenAI edit sends one prepared portrait and uses the configured model and native PNG alpha", async () => {
  const layer = await mockSubjectLayer();
  let requests = 0;
  const adapter = createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "openai", IMAGE_EDIT_API_KEY: "fixture",
    IMAGE_EDIT_MODEL: "gpt-image-2.5-sunburst" }, async (url, init) => {
    requests++;
    assert.equal(url, "https://api.openai.com/v1/images/edits");
    assert.equal(init?.method, "POST");
    const body = JSON.parse(String(init.body));
    assert.deepEqual([body.model, body.background, body.output_format, body.n, body.size],
      ["gpt-image-2.5-sunburst", "transparent", "png", 1, "1024x1024"]);
    assert.equal(body.prompt, promptForStyle("caricature"));
    assert.equal(body.images.length, 1);
    assert.match(body.images[0].image_url, /^data:image\/jpeg;base64,/);
    return Response.json({ data: [{ b64_json: layer.toString("base64") }] });
  });
  const out = await adapter.edit(await fixture());
  assert.equal(requests, 1);
  assert.deepEqual(await out.arrayBuffer(), await (await compositePortrait(layer)).arrayBuffer());
});

const legacy = process.env.BOOTH_LEGACY_READONLY_ROOT;
test("inspected legacy sources retain their pre-integration SHA-256 hashes", { skip: !legacy }, async () => {
  const expected = {
    "src/prompts.js": "fcb96085f856cb71729c77b8dce9323b9e1ba36d5e48b0aef357b0e370192156",
    "api/caricature.js": "a1ee540cdea6a595d3b51eda226770ff9f831d9b3e68489b2bdc76400c9dbf41",
    "src/main.js": "7fa26f6dee68119244b97973a98a8410d339751fd2ec4b20488f067bbfea7fe6",
    "src/sketch.js": "d683c839da64b1f96622beae0b493913060d1237a5bd1bf1f40e29fff0ae2580",
    "src/config.js": "7638fd76a528bcabb039425adae22bd0700e90383093d2e2f1ffb5abc6c29fad",
    "package.json": "dc5d1bf78477100804626c6d176f2df873dd9071134ef59d2340ff6007adb312",
  };
  for (const [file, hash] of Object.entries(expected)) {
    const bytes = await readFile(join(legacy!, file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, file);
  }
});
