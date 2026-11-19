import "server-only";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

export const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

// Publish a complete file atomically. A concurrent winner's bytes are immutable.
export async function publish(path: string, bytes: string | Uint8Array) {
  const temp = path + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temp, bytes, { flag: "wx", mode: 0o600, flush: true });
    await link(temp, path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  } finally {
    await unlink(temp).catch(error => { if (!missing(error)) throw error; });
  }
}

export async function read<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await readFile(file, "utf8")) as T; }
  catch (error) { if (missing(error)) return null; throw error; }
}

export function jobPath(root: string, id: string) {
  if (!validId(id)) throw new Error("Invalid job identity.");
  return join(root, "jobs", id);
}

export async function cleanupExpired(root: string, now: number) {
  const parent = resolve(root, "jobs");
  const entries = await readdir(parent, { withFileTypes: true }).catch(error => {
    if (missing(error)) return [];
    throw error;
  });
  for (const entry of entries) {
    if (!entry.isDirectory() || !validId(entry.name)) continue;
    const dir = jobPath(root, entry.name);
    const record = await read<{ expiresAt: number }>(join(dir, "claim.json"));
    if (record && record.expiresAt <= now && resolve(dir).startsWith(parent + sep)) {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

export { join, mkdir, readFile };
