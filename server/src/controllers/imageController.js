import fs from "node:fs";
import path from "node:path";
import { Image } from "../models/Image.js";
import { can } from "../config/roles.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

export async function listImages(_req, res) {
  const images = await Image.find().sort({ createdAt: -1 });
  res.json(images.map((i) => i.toJSON()));
}

export async function getImage(req, res) {
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found." });
  res.json(image.toJSON());
}

// Accepts either an uploaded file (multipart) or an image URL (JSON/form).
export async function createImage(req, res) {
  let url = req.body.imageUrl?.trim();
  if (req.file) {
    url = `/uploads/${req.file.filename}`;
  }
  if (!url) {
    return res.status(400).json({ error: "Provide an image file or an image URL." });
  }

  const image = await Image.create({
    url,
    caption: req.body.caption || "",
    author: req.user.id,
    authorName: req.user.name,
    likedBy: [],
  });

  res.status(201).json(image.toJSON());
}

export async function deleteImage(req, res) {
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found." });

  const isOwner = image.author.toString() === req.user.id;
  if (!can(req.user.role, "deleteAny") && !isOwner) {
    return res.status(403).json({ error: "You can only delete your own images." });
  }

  // Remove the local upload file if this was a hosted upload.
  if (image.url.startsWith("/uploads/")) {
    const filePath = path.join(UPLOAD_DIR, path.basename(image.url));
    fs.promises.unlink(filePath).catch(() => {});
  }

  await image.deleteOne();
  res.json({ ok: true });
}

export async function toggleLike(req, res) {
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found." });

  const userId = req.user.id;
  const idx = image.likedBy.findIndex((id) => id.toString() === userId);
  if (idx >= 0) image.likedBy.splice(idx, 1);
  else image.likedBy.push(userId);

  await image.save();
  res.json(image.toJSON());
}
