import fs from "node:fs";
import path from "node:path";
import { Listing, LISTING_CATEGORIES, PRICE_UNITS } from "../models/Listing.js";
import { can } from "../config/roles.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;
const GUEST_LIMIT = 10;

function isAdmin(user) {
  return Boolean(user) && can(user.role, "manageUsers");
}

function isOwner(user, listing) {
  return Boolean(user) && listing.broker?.toString() === user.id;
}

// A listing may be edited/deleted by its owner or an admin (deleteAny).
function canModify(user, listing) {
  return isOwner(user, listing) || (Boolean(user) && can(user.role, "deleteAny"));
}

// Accept either an array (repeated form fields) or a comma/newline-separated
// string, and return a clean array of trimmed, non-empty strings.
function normalizeList(input) {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === "string") return input.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// Final image list from uploaded files + provided URLs.
function collectImages(req) {
  const uploaded = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const urls = normalizeList(req.body.imageUrls).filter(
    (u) => /^https?:\/\//i.test(u) || u.startsWith("/uploads/")
  );
  return [...uploaded, ...urls];
}

// Remove a local upload file if it lives in our uploads dir.
function unlinkUpload(imagePath) {
  if (imagePath && imagePath.startsWith("/uploads/")) {
    fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(imagePath))).catch(() => {});
  }
}

// Shape a listing for the response. The full street address is shown to the
// owner or an admin; price/description are masked for anonymous visitors.
function present(listing, user) {
  const doc = listing.toJSON();
  if (isAdmin(user) || isOwner(user, listing)) doc.address = listing.address || "";
  if (!user) {
    doc.price = "₹****";
    doc.description = (doc.description || "").slice(0, 120);
  }
  return doc;
}

// Public listing list. Supports filtering by city and category, and a
// "top" view (sorted by trust score) used by the homepage category cards.
//   GET /listings?city=Mumbai&category=villa&sort=trust&limit=10
export async function listListings(req, res) {
  const { city, category, sort, broker } = req.query;

  const filter = {};
  if (city) filter.city = new RegExp(city, "i");
  if (category) filter.category = category;
  if (broker) filter.broker = broker;

  const isAuthed = Boolean(req.user);

  // Guests and explicit "top" requests are ranked by trust score; otherwise
  // authenticated users see the newest listings first.
  const rankByTrust = sort === "trust" || !isAuthed;
  const sortSpec = rankByTrust ? { trustScore: -1, createdAt: -1 } : { createdAt: -1 };

  let limit = Number(req.query.limit);
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = isAuthed && sort !== "trust" ? DEFAULT_LIMIT : GUEST_LIMIT;
  }
  limit = Math.min(limit, MAX_LIMIT);

  const listings = await Listing.find(filter).sort(sortSpec).limit(limit);
  res.json(listings.map((l) => present(l, req.user)));
}

// Listings owned by the current user (broker/admin management view).
export async function listMyListings(req, res) {
  const listings = await Listing.find({ broker: req.user.id })
    .sort({ createdAt: -1 })
    .limit(MAX_LIMIT);
  res.json(listings.map((l) => present(l, req.user)));
}

export async function getListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  res.json(present(listing, req.user));
}

// Create a listing. Broker/admin only (guarded by requireCapability("post")).
export async function createListing(req, res) {
  const {
    title,
    category,
    city,
    state,
    address,
    priceAmount,
    priceUnit,
    bhk,
    size,
    description,
    amenities,
  } = req.body;

  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });
  if (!city || !city.trim()) return res.status(400).json({ error: "City is required." });
  if (category && !LISTING_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category." });
  }
  if (priceUnit && !PRICE_UNITS.includes(priceUnit)) {
    return res.status(400).json({ error: "Invalid price unit." });
  }

  const amount = Number(priceAmount);
  if (priceAmount != null && priceAmount !== "" && (Number.isNaN(amount) || amount < 0)) {
    return res.status(400).json({ error: "Price must be a positive number." });
  }

  const images = collectImages(req);
  if (!images.length) {
    return res.status(400).json({ error: "Add at least one image (upload a file or paste an image URL)." });
  }

  const listing = await Listing.create({
    title: title.trim(),
    category: category || "flat",
    city: city.trim(),
    state: (state || "").trim(),
    address: (address || "").trim(),
    priceAmount: Number.isFinite(amount) ? amount : 0,
    priceUnit: priceUnit || "lakh",
    bhk: Math.max(0, Math.trunc(Number(bhk) || 0)),
    size: Math.max(0, Number(size) || 0),
    description: (description || "").trim(),
    amenities: normalizeList(amenities),
    images,
    broker: req.user.id,
    brokerName: req.user.name,
  });

  res.status(201).json(present(listing, req.user));
}

// Update a listing. Owner or admin only. Only provided fields are changed.
export async function updateListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (!canModify(req.user, listing)) {
    return res.status(403).json({ error: "You can only edit your own listings." });
  }

  const b = req.body;

  if (b.title !== undefined) {
    if (!b.title.trim()) return res.status(400).json({ error: "Title is required." });
    listing.title = b.title.trim();
  }
  if (b.category !== undefined) {
    if (!LISTING_CATEGORIES.includes(b.category)) return res.status(400).json({ error: "Invalid category." });
    listing.category = b.category;
  }
  if (b.city !== undefined) {
    if (!b.city.trim()) return res.status(400).json({ error: "City is required." });
    listing.city = b.city.trim();
  }
  if (b.state !== undefined) listing.state = b.state.trim();
  if (b.address !== undefined) listing.address = b.address.trim();
  if (b.priceUnit !== undefined) {
    if (!PRICE_UNITS.includes(b.priceUnit)) return res.status(400).json({ error: "Invalid price unit." });
    listing.priceUnit = b.priceUnit;
  }
  if (b.priceAmount !== undefined && b.priceAmount !== "") {
    const amount = Number(b.priceAmount);
    if (Number.isNaN(amount) || amount < 0) return res.status(400).json({ error: "Price must be a positive number." });
    listing.priceAmount = amount;
  }
  if (b.bhk !== undefined) listing.bhk = Math.max(0, Math.trunc(Number(b.bhk) || 0));
  if (b.size !== undefined) listing.size = Math.max(0, Number(b.size) || 0);
  if (b.description !== undefined) listing.description = b.description.trim();
  if (b.amenities !== undefined) listing.amenities = normalizeList(b.amenities);

  // Recompute images only if any image input was sent (files or imageUrls).
  const hasImageInput = (req.files && req.files.length) || b.imageUrls !== undefined;
  if (hasImageInput) {
    const images = collectImages(req);
    if (!images.length) return res.status(400).json({ error: "A listing needs at least one image." });
    // Delete local upload files that are no longer referenced.
    (listing.images || [])
      .filter((img) => img.startsWith("/uploads/") && !images.includes(img))
      .forEach(unlinkUpload);
    listing.images = images;
  }

  await listing.save();
  res.json(present(listing, req.user));
}

// Delete a listing. Owner or admin only.
export async function deleteListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (!canModify(req.user, listing)) {
    return res.status(403).json({ error: "You can only delete your own listings." });
  }

  (listing.images || []).forEach(unlinkUpload);

  await listing.deleteOne();
  res.json({ ok: true });
}
