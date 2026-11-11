import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

// Uploaded images live outside the app folder on the server (UPLOAD_DIR) so
// rebuilds and redeploys never touch them. Served at /uploads/<name>.
export const uploadDir = () => process.env.UPLOAD_DIR?.trim() || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
export const maxUploadBytes = () => Number(process.env.MAX_UPLOAD_BYTES ?? 15 * 1024 * 1024);

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,80}\.(webp|png|jpe?g|gif)$/;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "heif", "avif", "tiff"]);
const MAX_DIMENSION = 2000;

export type UploadedImage = { name: string; url: string; size: number; width?: number; height?: number; createdAt: string };

export function isSafeName(name: string) {
  return NAME_RE.test(name);
}

function baseName(original: string) {
  const stem = original.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (stem || "image").slice(0, 60);
}

/** Validate, resize (max 2000 px) and store as WebP. Throws a user-readable error. */
export async function saveImage(bytes: Buffer, originalName: string): Promise<UploadedImage> {
  if (bytes.length > maxUploadBytes()) {
    throw new Error(`Image is too large (max ${Math.round(maxUploadBytes() / 1024 / 1024)} MB).`);
  }
  let meta: sharp.Metadata;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    throw new Error("That file isn't a supported image (use JPG, PNG or WebP).");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new Error("That file isn't a supported image (use JPG, PNG or WebP).");
  }

  const out = await sharp(bytes, { animated: false })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const name = `${baseName(originalName)}-${randomBytes(3).toString("hex")}.webp`;
  await mkdir(/*turbopackIgnore: true*/ uploadDir(), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name), out.data);
  return { name, url: `/uploads/${name}`, size: out.info.size, width: out.info.width, height: out.info.height, createdAt: new Date().toISOString() };
}

export async function listImages(): Promise<UploadedImage[]> {
  let names: string[] = [];
  try {
    names = (await readdir(/*turbopackIgnore: true*/ uploadDir())).filter(isSafeName);
  } catch {
    return [];
  }
  const items = await Promise.all(
    names.map(async (name) => {
      const s = await stat(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
      return { name, url: `/uploads/${name}`, size: s.size, createdAt: s.mtime.toISOString() };
    }),
  );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readImage(name: string) {
  if (!isSafeName(name)) return null;
  try {
    return await readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
  } catch {
    return null;
  }
}

export async function deleteImage(name: string) {
  if (!isSafeName(name)) throw new Error("Invalid file name");
  await unlink(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
}
