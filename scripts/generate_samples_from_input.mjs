import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const inputImagePath = 'C:/Users/User/.gemini/antigravity/brain/b7191030-a7fa-4d31-872e-4b22b116ccd9/.user_uploaded/media_1795108325936_8395c5a0.jpg';

// Read .env.local
let openaiKey = '';
let geminiKey = '';
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('OPENAI_API_KEY=')) openaiKey = trimmed.split('=')[1].trim();
    if (trimmed.startsWith('GEMINI_API_KEY=') || trimmed.startsWith('# GEMINI_API_KEY=')) {
      geminiKey = trimmed.replace(/^#\s*/, '').split('=')[1].trim();
    }
  }
}

import { CARICATURE_PROMPT, LIDAR_PROMPT } from '../src/server/caricature/index.ts';

console.log('OpenAI Key present:', !!openaiKey);
console.log('Gemini Key present:', !!geminiKey);

async function prepareInputImage() {
  const raw = fs.readFileSync(inputImagePath);
  return await sharp(raw)
    .resize(1024, 1024, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function generateWithOpenAI(jpegBuffer, prompt) {
  const form = new FormData();
  form.append('model', 'gpt-image-2.5-flare');
  form.append('image', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'photo.jpg');
  form.append('prompt', prompt);
  form.append('size', '1024x1024');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const first = data?.data?.[0];
  if (first?.b64_json) {
    return Buffer.from(first.b64_json, 'base64');
  }
  if (first?.url) {
    const dl = await fetch(first.url);
    if (!dl.ok) throw new Error('Failed to download image from URL');
    return Buffer.from(await dl.arrayBuffer());
  }
  throw new Error('No image returned from OpenAI');
}

async function generateWithGemini(jpegBuffer, prompt) {
  const model = 'gemini-2.5-flash-image';
  const generationConfig = { responseModalities: ['IMAGE', 'TEXT'] };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: jpegBuffer.toString('base64') } }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img = parts.map((p) => p.inlineData || p.inline_data).find((d) => d && d.data);
  if (!img) throw new Error('No image returned from Gemini');
  return Buffer.from(img.data, 'base64');
}

async function generate(prompt, name) {
  console.log(`Generating ${name}...`);
  const prepared = await prepareInputImage();

  let outBuffer = null;
  if (openaiKey) {
    try {
      console.log(`Trying OpenAI for ${name}...`);
      outBuffer = await generateWithOpenAI(prepared, prompt);
      console.log(`OpenAI succeeded for ${name}!`);
    } catch (err) {
      console.error(`OpenAI error for ${name}:`, err.message);
    }
  }

  if (!outBuffer && geminiKey) {
    try {
      console.log(`Trying Gemini fallback for ${name}...`);
      outBuffer = await generateWithGemini(prepared, prompt);
      console.log(`Gemini succeeded for ${name}!`);
    } catch (err) {
      console.error(`Gemini error for ${name}:`, err.message);
    }
  }

  if (!outBuffer) {
    throw new Error(`Failed to generate ${name} with both providers`);
  }

  return outBuffer;
}

async function main() {
  const [caricatureBuf, lidarBuf] = await Promise.all([
    generate(CARICATURE_PROMPT, 'caricature'),
    generate(LIDAR_PROMPT, 'lidar'),
  ]);

  // Save caricature
  await sharp(caricatureBuf)
    .resize(1195, 1316, { fit: 'cover' })
    .webp({ quality: 90 })
    .toFile('public/artwork/web/caricature-sample-full.webp');

  await sharp(caricatureBuf)
    .resize(540, 595, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile('public/artwork/web/caricature-sample-compact.webp');

  console.log('Saved caricature sample images!');

  // Save lidar
  await sharp(lidarBuf)
    .resize(1195, 1316, { fit: 'cover' })
    .webp({ quality: 90 })
    .toFile('public/artwork/web/lidar-sample-full.webp');

  await sharp(lidarBuf)
    .resize(540, 595, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile('public/artwork/web/lidar-sample-compact.webp');

  console.log('Saved lidar sample images!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
