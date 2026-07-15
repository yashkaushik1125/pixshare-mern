import "dotenv/config"; 
import express from "express";
import cors from "cors";
import multer from "multer";

import { connectDB } from "./config/db.js";
import { ROLES } from "./config/roles.js";
import { UPLOAD_DIR } from "./middleware/upload.js";

import authRoutes from "./routes/auth.js";
import imageRoutes from "./routes/images.js";
import userRoutes from "./routes/users.js";
import listingsRoutes from "./routes/listings.js";

const app = express();
const PORT = process.env.PORT || 4000;
const IMAGE_CACHE_SECONDS = Number(process.env.IMAGE_CACHE_SECONDS || 86400);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images with a long-lived, immutable cache header for efficiency.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: IMAGE_CACHE_SECONDS * 1000,
    immutable: true,
    setHeaders: (res) => {
      res.setHeader(
        "Cache-Control",
        `public, max-age=${IMAGE_CACHE_SECONDS}, immutable`
      );
    },
  })
);

// Branding/config consumed by the React client (kept in one place: the server .env).
app.get("/api/config", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({
    name: process.env.APP_NAME || "भूमि पूजन",
    description: process.env.APP_DESCRIPTION || "Discover and share beautiful moments",
    primaryColor: process.env.APP_PRIMARY_COLOR || "#d4af37",
    accentColor: process.env.APP_ACCENT_COLOR || "#e8c86e",
    roles: ROLES,
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingsRoutes);

// Centralised error handler (covers multer upload errors and thrown errors).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err?.message?.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`\n  ${process.env.APP_NAME || "PixShare"} API on http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error("  Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
