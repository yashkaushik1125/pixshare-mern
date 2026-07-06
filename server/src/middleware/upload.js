import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const maxMb = Number(process.env.MAX_UPLOAD_MB || 8);

export const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type. Use png, jpg, gif or webp."));
  },
});
