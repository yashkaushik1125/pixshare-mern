import { Listing } from "../models/Listing.js";

// Public listing list - returns full details for authenticated users, and
// limited/masked details for anonymous visitors.
export async function listListings(req, res) {
  const city = req.query.city;
  const filter = {};
  if (city) filter.location = new RegExp(city, "i");

  const isAuthed = Boolean(req.user);
  let listings;
  if (isAuthed) {
    // Authenticated users see newest listings first (show all recent listings)
    listings = await Listing.find(filter).sort({ createdAt: -1 }).limit(100);
  } else {
    // Anonymous visitors see top 10 by trustScore
    listings = await Listing.find(filter).sort({ trustScore: -1 }).limit(10);
  }
  const payload = listings.map((l) => {
    const doc = l.toJSON();
    if (!isAuthed) {
      doc.price = "₹****";
      doc.description = (doc.description || "").slice(0, 120);
    }
    return doc;
  });
  res.json(payload);
}

export async function getListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  const doc = listing.toJSON();
  if (!req.user) {
    doc.price = "₹****";
    doc.description = (doc.description || "").slice(0, 120);
  }
  res.json(doc);
}
