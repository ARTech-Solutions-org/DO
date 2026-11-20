import "server-only";
import type { ImageEditAdapter } from "../ports.ts";
import { mockSubjectLayer } from "./mock.ts";
import { compositeLidar, compositePortrait, preparePortrait } from "./portrait.ts";

export const CARICATURE_PROMPT = `Transform the person in the uploaded photo into a highly stylized, exaggerated professional caricature, using the attached reference image ONLY as the visual style reference.

IMPORTANT:
Preserve the exact identity and recognizable facial characteristics of the person in the original photo. Keep their actual hairstyle (or hijab/headscarf), skin tone, face structure, eyebrows, eyes, nose, lips, smile, and distinctive facial features recognizable. Do NOT turn them into a different person.

HIJAB, HEADWEAR & COVERED EARS (STRICT ABSOLUTE REQUIREMENT):
* If the person in the photo is wearing a HIJAB, headscarf, shayla, veil, or turban:
  - NEVER show, draw, invent, or expose ears! Ears MUST remain 100% completely hidden and covered under the hijab at all times. It is strictly forbidden to draw ears on or protruding through a hijab.
  - NEVER show, invent, or expose hair if the person's hair is covered by the hijab in the original photo.
  - Faithfully preserve the exact color, fabric texture, style, wrap, and draping of the hijab.
  - The caricature neck elongation must remain properly covered by the hijab/neckline, keeping the modest coverage identical to the original photo.
* If the person's ears are covered by hair (such as long hair, curls, side volume, or bangs):
  - NEVER draw or expose ears over or through the hair. Keep ears completely covered by the hair exactly as in the photo.
* EAR EXAGGERATION RULE: ONLY draw or enlarge ears IF AND ONLY IF the person's ears are already clearly visible, exposed, and uncovered in the original photo. If ears are not visible in the input photo, DO NOT draw or invent them under any circumstances.

HAIR & LIGHTING CONSISTENCY:
For subjects with exposed hair: Regardless of camera flash reflection, harsh overhead room/ceiling lights, or overexposed highlights in the input photo, ALWAYS render full, solid, natural hair with rich volume, realistic texture, and the person's true hair color. NEVER leave any pure white, blank, transparent, bleached-out, or missing patches on the hair, forehead, or face. All hair must be fully painted and detailed. (If the person wears a hijab, keep the hijab fully opaque and detailed with no exposed hair).

CARICATURE STYLE:
Create a bold, exaggerated caricature with an oversized head and dramatically elongated neck. Exaggerate the person's real facial characteristics in a humorous but aesthetically pleasing way:

* enlarged and expressive eyes
* emphasized eyebrows
* slightly exaggerated nose
* fuller, more expressive lips
* exaggerated smile and cheeks
* elongated jaw and neck
* slightly enlarged forehead
* noticeably enlarged ears (ONLY IF the person's ears are already exposed and visible in the original photo — NEVER on hijab or ear-covering hair)
* exaggerated facial proportions while keeping the person clearly recognizable
* preserve the person's natural hairstyle (or hijab/headwear) but make it more stylized and detailed

The exaggeration should feel intentional and professionally designed, like a premium digital caricature illustration, NOT like a random distortion or cheap cartoon filter.

RENDERING STYLE:
Highly detailed digital caricature illustration with a semi-realistic painterly finish.
Smooth but highly detailed skin.
Visible subtle skin texture and fine facial details.
Painterly brush strokes blended into realistic digital rendering.
Strong clean silhouettes.
Soft but defined facial shadows.
Crisp highlights on the forehead, nose, cheeks and lips.
Detailed individual hair strands (or detailed fabric texture and smooth folds on hijab).
Rich dimensional shading.
Slightly glossy eyes and lips.
Professional character-illustration quality.
High-end editorial caricature aesthetic.

LIGHTING:
Soft cinematic studio lighting.
Warm highlights on the face.
Subtle rim light around the head and shoulders.
Deep but smooth shadows.
Strong facial dimensionality without harsh contrast.

BACKGROUND:
Use a simple artistic studio background similar to the reference image:
a flat #966BFC purple background with a soft warm ambient glow behind the subject.
Subtle painterly texture.
Soft vignette.
No objects or distracting elements.

COMPOSITION:
Square 1:1 composition (1024x1024).
The subject must be fully centered horizontally and vertically within the square canvas.
Full head, neck, and upper torso (shoulders) must be completely visible — nothing cut off at any edge.
Leave generous padding on all four sides between the subject and the image border.
Face should dominate the composition with the characteristic oversized caricature head.
Clean professional portrait framing.

CLOTHING:
Preserve the person's original clothing and headwear from the input photo and render it as detailed illustrated clothing.
Do not randomly change the outfit or remove/modify head coverings.

OVERALL RESULT:
The final image should look like a professionally painted, exaggerated celebrity/editorial caricature — humorous, stylish, highly detailed, expressive and polished.

Do not make it photorealistic.
Do not make it a flat cartoon.
Do not use anime style.
Do not use generic 3D animation style.
Do not simplify the facial features.
Do not add text, logos, watermarks, props, or extra people.
Never draw ears on a hijab or over hair that covers the ears.

The uploaded subject photo defines the PERSON, identity, facial features, clothing, headwear and expression.`;

export const LIDAR_PROMPT = `Transform the uploaded photograph into a pure high-density scientific LiDAR point-cloud visualization in 4:5 vertical portrait composition. Abandon photographic surfaces entirely: no skin texture, no continuous meshes, no smooth shading, and no solid forms. Reconstruct the subject exclusively as thousands of separate glowing laser-return points suspended in space with clearly visible black gaps between them. Preserve the subject's exact facial features, proportions, expression, spatial relationships, and head-and-shoulders composition with generous clear padding on all sides. Color every point by spatial depth using a vibrant branded palette: electric ultraviolet and neon purple (#966BFC and #C34AFF) on near-field laser returns, transitioning through magenta into incandescent amber and warm gold (#FFB044 and #E48D3D) on far-field depth returns. Scanner origin and radial sweep geometry should produce clean laser trajectories and realistic occlusion shadows. Render only the discrete point-cloud returns on transparent pixels, ready for placement on pure deep void black space (#05040A), with no background scenery, no fog, no bloom-heavy haze, and no outer edge contact.`;

export function promptForStyle(style: string) {
  if (style === "caricature") return CARICATURE_PROMPT;
  if (style === "lidar") return LIDAR_PROMPT;
  throw new Error("Unsupported portrait style.");
}

type Settings = { IMAGE_EDIT_PROVIDER?: string; IMAGE_EDIT_MODEL?: string; IMAGE_EDIT_API_KEY?: string };
const models = [
  "gpt-image-2.5-flare",
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare-2026-09-08",
  "gpt-image-2.5-sunburst-2026-09-08",
];

export function createCaricatureAdapter(settings: Settings = {
  IMAGE_EDIT_PROVIDER: process.env.IMAGE_EDIT_PROVIDER,
  IMAGE_EDIT_MODEL: process.env.IMAGE_EDIT_MODEL || process.env.OPENAI_IMAGE_MODEL,
  IMAGE_EDIT_API_KEY: process.env.IMAGE_EDIT_API_KEY || process.env.OPENAI_API_KEY,
}, send: typeof fetch = fetch): ImageEditAdapter {
  const provider = settings.IMAGE_EDIT_PROVIDER || "mock";
  const model = settings.IMAGE_EDIT_MODEL || process.env.OPENAI_IMAGE_MODEL || models[0];
  const apiKey = settings.IMAGE_EDIT_API_KEY || process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (provider !== "mock" && provider !== "openai") throw new Error("Unknown caricature provider.");
  if (provider === "openai" && (!apiKey || !models.includes(model)) && !geminiKey) {
    throw new Error("OpenAI requires a configured key and a supported transparent-edit model.");
  }
  return {
    async edit(request, signal) {
      const prompt = promptForStyle(request.styleId);
      const portrait = await preparePortrait(request.photo);
      const compose = request.styleId === "lidar" ? compositeLidar : compositePortrait;
      signal?.throwIfAborted();
      if (provider === "mock") return compose(await mockSubjectLayer());

      let imageBuffer: Buffer | null = null;

      // 1. Primary: OpenAI (ChatGPT) Image Provider via FormData
      if (apiKey) {
        try {
          const form = new FormData();
          const blob = new Blob([new Uint8Array(portrait)], { type: "image/jpeg" });
          form.append("model", model);
          form.append("image", blob, "photo.jpg");
          form.append("prompt", prompt);
          form.append("size", "1024x1024");

          const response = await send("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
            signal: AbortSignal.any([AbortSignal.timeout(180_000), ...(signal ? [signal] : [])]),
          });

          if (response.ok) {
            const data = (await response.json()).data;
            const first = data?.[0];
            if (first?.b64_json) {
              imageBuffer = Buffer.from(first.b64_json, "base64");
            } else if (first?.url) {
              const dl = await send(first.url);
              if (dl.ok) imageBuffer = Buffer.from(await dl.arrayBuffer());
            }
          } else {
            console.error("OpenAI edit error:", response.status, await response.text().catch(() => ""));
          }
        } catch (err) {
          console.error("OpenAI request error:", err);
        }
      }

      // 2. Secondary fallback: Google Gemini
      if (!imageBuffer && geminiKey) {
        try {
          const geminiModel = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
          const generationConfig: Record<string, unknown> = { responseModalities: ["IMAGE", "TEXT"] };
          if (process.env.GEMINI_ASPECT_RATIO) generationConfig.imageConfig = { aspectRatio: process.env.GEMINI_ASPECT_RATIO };

          const gRes = await send(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: portrait.toString("base64") } }] }],
              generationConfig,
            }),
            signal: AbortSignal.any([AbortSignal.timeout(180_000), ...(signal ? [signal] : [])]),
          });
          if (gRes.ok) {
            const data = await gRes.json();
            const parts = data?.candidates?.[0]?.content?.parts || [];
            const img = parts.map((p: any) => p.inlineData || p.inline_data).find((d: any) => d && d.data);
            if (img?.data) {
              imageBuffer = Buffer.from(img.data, "base64");
            }
          }
        } catch (err) {
          console.error("Gemini fallback error:", err);
        }
      }

      if (!imageBuffer) {
        throw new Error("Image edit failed on both OpenAI and Gemini providers.");
      }

      return compose(imageBuffer);
    },
  };
}
