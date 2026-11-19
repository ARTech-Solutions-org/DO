import "server-only";
import type { ImageEditAdapter } from "../ports.ts";
import { mockSubjectLayer } from "./mock.ts";
import { compositePortrait, preparePortrait } from "./portrait.ts";

export function promptForStyle(style: string) {
  if (style === "caricature") {
    return [
      "Illustrate the person in the supplied photograph as a flattering editorial caricature.",
      "Build the exaggeration from their own features and expression. Retain their complexion, hair texture, clothing and headwear, including the coverage visible in the photograph.",
      "Keep the full head and shoulders within the square, with generous clear padding on every side.",
      "Render only the subject on transparent pixels, ready for placement on a flat #966BFC purple background. Preserve soft hair strands with clean alpha and natural edge colors.",
      "Omit scenery, cast shadows on the backdrop, colored spill, lettering, logos and additional people.",
    ].join(" ");
  }
  if (style === "lidar") {
    return [
      "Transform the uploaded photograph into a pure high-density scientific LiDAR point-cloud visualization in 4:5 vertical portrait composition.",
      "Abandon photographic surfaces entirely: no skin texture, no continuous meshes, no smooth shading, and no solid forms.",
      "Reconstruct the subject exclusively as thousands of separate glowing laser-return points suspended in space with clearly visible black gaps between them.",
      "Preserve the subject's exact facial features, proportions, expression, spatial relationships, and head-and-shoulders composition with generous clear padding on all sides.",
      "Color every point by spatial depth using a vibrant branded palette: electric ultraviolet and neon purple (#966BFC and #C34AFF) on near-field laser returns, transitioning through magenta into incandescent amber and warm gold (#FFB044 and #E48D3D) on far-field depth returns.",
      "Scanner origin and radial sweep geometry should produce clean laser trajectories and realistic occlusion shadows.",
      "Render only the discrete point-cloud returns on transparent pixels, ready for placement on pure deep void black space (#05040A), with no background scenery, no fog, no bloom-heavy haze, and no outer edge contact.",
    ].join(" ");
  }
  throw new Error("Unsupported portrait style.");
}

type Settings = { IMAGE_EDIT_PROVIDER?: string; IMAGE_EDIT_MODEL?: string; IMAGE_EDIT_API_KEY?: string };
const models = ["gpt-image-2.5-flare", "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare-2026-09-08", "gpt-image-2.5-sunburst-2026-09-08"];

export function createCaricatureAdapter(settings: Settings = {
  IMAGE_EDIT_PROVIDER: process.env.IMAGE_EDIT_PROVIDER,
  IMAGE_EDIT_MODEL: process.env.IMAGE_EDIT_MODEL || process.env.OPENAI_IMAGE_MODEL,
  IMAGE_EDIT_API_KEY: process.env.IMAGE_EDIT_API_KEY || process.env.OPENAI_API_KEY,
}, send: typeof fetch = fetch): ImageEditAdapter {
  const provider = settings.IMAGE_EDIT_PROVIDER || "mock";
  const model = settings.IMAGE_EDIT_MODEL || process.env.OPENAI_IMAGE_MODEL || models[0];
  const apiKey = settings.IMAGE_EDIT_API_KEY || process.env.OPENAI_API_KEY;
  if (provider !== "mock" && provider !== "openai") throw new Error("Unknown caricature provider.");
  if (provider === "openai" && (!apiKey || !models.includes(model))) {
    throw new Error("OpenAI requires a configured key and a supported transparent-edit model.");
  }
  return {
    async edit(request, signal) {
      const prompt = promptForStyle(request.styleId);
      const portrait = await preparePortrait(request.photo);
      const bg = request.styleId === "lidar" ? ([5, 4, 10] as const) : ([150, 107, 252] as const);
      signal?.throwIfAborted();
      if (provider === "mock") return compositePortrait(await mockSubjectLayer(), bg);
      const response = await send("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, images: [{ image_url: `data:image/jpeg;base64,${portrait.toString("base64")}` }],
          n: 1, size: "1024x1024", output_format: "png", background: "transparent", quality: "high" }),
        signal: AbortSignal.any([AbortSignal.timeout(180_000), ...(signal ? [signal] : [])]),
        redirect: "error",
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Image edit failed (HTTP ${response.status}): ${errText.slice(0, 300)}`);
      }
      const data = (await response.json()).data;
      let encoded = data?.[0]?.b64_json;
      if (!encoded && data?.[0]?.url) {
        const dl = await send(data[0].url);
        if (!dl.ok) throw new Error("Failed to download image from provider URL.");
        const ab = await dl.arrayBuffer();
        return compositePortrait(Buffer.from(ab), bg);
      }
      if (data?.length !== 1 || typeof encoded !== "string" || !encoded || encoded.length > 23_000_000) {
        throw new Error("Expected one encoded image from the edit provider.");
      }
      return compositePortrait(Buffer.from(encoded, "base64"), bg);
    },
  };
}
