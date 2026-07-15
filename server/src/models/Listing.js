import mongoose from "mongoose";

// Allowed property categories. Note: "bunglow" spelling is intentional to
// match the product requirement (displayed as "Bungalow" in the UI).
export const LISTING_CATEGORIES = ["villa", "flat", "bunglow", "farm"];

// Price is expressed in Indian units: lakhs or crores.
export const PRICE_UNITS = ["lakh", "crore"];

function formatPrice(amount, unit) {
  if (!amount) return "Price on request";
  const label = unit === "crore" ? "Cr" : "Lakh";
  return `₹${amount} ${label}`;
}

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    // Property category (villa / flat / bunglow / farm).
    category: {
      type: String,
      enum: LISTING_CATEGORIES,
      default: "flat",
      index: true,
    },

    // Built-up / carpet size in square feet.
    size: { type: Number, min: 0, default: 0 },

    // Number of bedrooms (BHK). Not relevant for farm/land, kept 0 there.
    bhk: { type: Number, min: 0, default: 0 },

    // Price in lakhs or crores, stored as an amount + unit so it can be
    // formatted and compared reliably.
    priceAmount: { type: Number, min: 0, default: 0 },
    priceUnit: { type: String, enum: PRICE_UNITS, default: "lakh" },

    // Full street address is SENSITIVE and only exposed to admins by the
    // controller. City & state are public and used for search/filtering.
    address: { type: String, default: "" },
    city: { type: String, default: "", index: true },
    state: { type: String, default: "" },

    description: { type: String, default: "" },

    // One or more image URLs. The first entry is used as the cover image.
    images: { type: [String], default: [] },

    // Amenities such as ["Parking", "Gym", "Swimming Pool"].
    amenities: { type: [String], default: [] },

    // Trust score between 0 and 100 used to rank listings (higher = more trusted).
    trustScore: { type: Number, min: 0, max: 100, default: 88, index: true },

    broker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brokerName: { type: String, required: true },
  },
  { timestamps: true }
);

listingSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;

    // NEVER expose the full street address by default. The controller
    // re-attaches it only for admin users.
    delete ret.address;

    // Public location string built from city + state only.
    ret.city = ret.city || "";
    ret.state = ret.state || "";
    ret.location = [ret.city, ret.state].filter(Boolean).join(", ");

    // Cover image + legacy single-image field consumed by the cards.
    ret.images = Array.isArray(ret.images) ? ret.images : [];
    ret.imageUrl = ret.images[0] || "";

    // Human-readable specs + price string used across the existing UI.
    const specParts = [];
    if (ret.bhk) specParts.push(`${ret.bhk} BHK`);
    if (ret.size) specParts.push(`${ret.size} sqft`);
    ret.specs = specParts.join(" • ");
    ret.price = formatPrice(ret.priceAmount, ret.priceUnit);

    ret.amenities = Array.isArray(ret.amenities) ? ret.amenities : [];
    return ret;
  },
});

export const Listing = mongoose.model("Listing", listingSchema);
