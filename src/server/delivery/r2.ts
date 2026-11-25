import "server-only";
import { createHash, createHmac } from "node:crypto";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  host: string;
  region: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "ai-booth";
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    host: `${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  };
}

function hmac(key: string | Buffer, str: string) {
  return createHmac("sha256", key).update(str).digest();
}

function sha256(data: string | Buffer | Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function uriEncodePath(p: string) {
  return p
    .split("/")
    .map(seg => encodeURIComponent(seg))
    .join("/");
}

export async function uploadToR2(params: {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  headers?: Record<string, string>;
}): Promise<string | null> {
  const config = getR2Config();
  if (!config) return null;

  const { host, bucket, region, accessKeyId, secretAccessKey } = config;
  const { key, buffer, contentType } = params;

  const payloadHash = sha256(buffer);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const method = "PUT";
  const canonicalUri = `/${bucket}/${uriEncodePath(key)}`;
  const canonicalQuery = "";

  const headers: Record<string, string> = {
    ...params.headers,
    "content-type": contentType,
    "host": host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(k => `${k}:${headers[k]}\n`)
    .join("");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method,
    headers: {
      ...headers,
      Authorization: authorization,
    },
    body: new Blob([new Uint8Array(buffer)]),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`R2 upload failed: ${res.status} ${res.statusText} - ${errText}`);
  }

  return getPresignedDownloadUrl(key);
}

export function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 604800, // 7 days
  downloadFilename = "do-hotels-caricature.png"
): string | null {
  return presignRead("GET", key, expiresInSeconds, downloadFilename);
}

export function getPresignedMetadataUrl(key: string, expiresInSeconds: number) {
  return presignRead("HEAD", key, expiresInSeconds);
}

function presignRead(method: "GET" | "HEAD", key: string, expiresInSeconds: number, downloadFilename?: string) {
  const config = getR2Config();
  if (!config) return null;

  const { host, bucket, region, accessKeyId, secretAccessKey } = config;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${bucket}/${uriEncodePath(key)}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const credentialParam = `${accessKeyId}/${credentialScope}`;

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credentialParam,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresInSeconds.toString(),
    "X-Amz-SignedHeaders": "host",
    ...(downloadFilename ? { "response-content-disposition": `inline; filename="${downloadFilename}"` } : {}),
  };

  const canonicalQuery = Object.keys(queryParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export async function archiveFramedPhoto(params: {
  jobId: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  folder?: string;
}): Promise<string | null> {
  const ext = params.contentType === "image/webp" ? "webp" : "png";
  const folder = params.folder || process.env.R2_ARCHIVE_FOLDER || "all-photos";
  const cleanFolder = folder.replace(/\/+$/, "");
  const key = `${cleanFolder}/do-hotels-${params.jobId}.${ext}`;
  try {
    return await uploadToR2({
      key,
      buffer: params.buffer,
      contentType: params.contentType,
      headers: {
        "x-amz-meta-job-id": params.jobId,
        "x-amz-meta-archived-at": new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("R2 archive upload error for job:", params.jobId, err);
    return null;
  }
}

export interface ArchivedPhotoItem {
  id: string;
  key: string;
  url: string;
  createdAt: string;
  size: number;
  passNumber: string;
  filename: string;
}

export async function listArchivedPhotos(options?: {
  prefix?: string;
  limit?: number;
}): Promise<ArchivedPhotoItem[]> {
  const config = getR2Config();
  if (!config) return [];

  const { host, bucket, region, accessKeyId, secretAccessKey } = config;
  const folder = options?.prefix ?? (process.env.R2_ARCHIVE_FOLDER || "all-photos");
  const cleanFolder = folder.replace(/\/+$/, "") + "/";
  const limit = Math.min(Math.max(options?.limit ?? 1000, 1), 1000);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const method = "GET";
  const canonicalUri = `/${bucket}`;
  const queryParams: Record<string, string> = {
    "list-type": "2",
    "max-keys": limit.toString(),
    "prefix": cleanFolder,
  };

  const canonicalQuery = Object.keys(queryParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const payloadHash = sha256("");
  const headers: Record<string, string> = {
    "host": host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(k => `${k}:${headers[k]}\n`)
    .join("");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(`https://${host}${canonicalUri}?${canonicalQuery}`, {
      method,
      headers: {
        ...headers,
        Authorization: authorization,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`R2 list failed with status ${res.status} ${res.statusText}`);
      return [];
    }

    const xml = await res.text();
    const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
    const items: ArchivedPhotoItem[] = [];

    let match: RegExpExecArray | null;
    while ((match = contentsRegex.exec(xml)) !== null) {
      const block = match[1];
      const keyMatch = block.match(/<Key>(.*?)<\/Key>/);
      if (!keyMatch) continue;
      const key = keyMatch[1];

      // Ignore folder placeholder or non-image files
      if (key === cleanFolder || key.endsWith("/")) continue;

      const lastModifiedMatch = block.match(/<LastModified>(.*?)<\/LastModified>/);
      const sizeMatch = block.match(/<Size>(\d+)<\/Size>/);

      const lastModified = lastModifiedMatch ? lastModifiedMatch[1] : new Date().toISOString();
      const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

      const filePart = key.split("/").pop() || "";
      const idMatch = filePart.match(/do-hotels-([a-f0-9-]+)\.(png|webp|jpg|jpeg)/i);
      const id = idMatch ? idMatch[1] : filePart;
      const ext = idMatch ? idMatch[2] : "png";
      const downloadFilename = `do-hotels-${id}.${ext}`;

      const presignedUrl = getPresignedDownloadUrl(key, 86400, downloadFilename);
      if (!presignedUrl) continue;

      const shortId = id.length >= 4 ? id.slice(0, 4).toUpperCase() : id.toUpperCase();
      const passNumber = `#DO-${shortId}`;

      items.push({
        id,
        key,
        url: presignedUrl,
        createdAt: lastModified,
        size,
        passNumber,
        filename: downloadFilename,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.error("Failed to list archived photos from R2:", err);
    return [];
  }
}
