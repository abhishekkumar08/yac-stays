import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../bookings.js";

const SAFE_NAME = /^[\w-]+\.(svg|png|jpe?g|webp)$/;
const TYPES = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const MAX_BYTES = 6 * 1024 * 1024;

function sniff(buf) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export async function savePhoto(photosDir, dataUrl) {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new AppError(400, "bad_image");
  const buf = Buffer.from(m[2], "base64");
  const ext = sniff(buf);
  if (!ext || buf.length > MAX_BYTES) throw new AppError(400, "bad_image");
  const file = `u-${randomUUID()}.${ext}`;
  await writeFile(join(photosDir, file), buf);
  return file;
}

export default function photoRoutes(app, { photosDir }) {
  app.get("/photos/:file", async (req, reply) => {
    const { file } = req.params;
    if (!SAFE_NAME.test(file)) throw new AppError(404, "not_found");
    try {
      const data = await readFile(join(photosDir, file));
      const ext = file.split(".").pop();
      return reply
        .header("content-type", TYPES[ext])
        .header("cache-control", "public, max-age=86400")
        .header("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'")
        .send(data);
    } catch (err) {
      if (err.code === "ENOENT") throw new AppError(404, "not_found");
      throw err;
    }
  });
}
