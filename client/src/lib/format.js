export function initials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "?").toUpperCase();
}

// Parse Indian-style price strings ("₹1.6 Cr", "₹85 Lakh", "₹12,50,000")
// into a comparable number of rupees. Returns null when it can't be parsed.
export function parsePrice(input) {
  if (input == null) return null;
  const str = String(input).toLowerCase();
  const match = str.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  if (/cr|crore/.test(str)) return value * 1e7;
  if (/lakh|lac|l\b/.test(str)) return value * 1e5;
  if (/k\b/.test(str)) return value * 1e3;
  return value;
}

// Property-type buckets used by the filters. Each listing is matched against
// a combined text blob (title + specs + description).
export function matchesPropertyType(listing, type) {
  if (!type || type === "any") return true;
  const blob = `${listing.title || ""} ${listing.specs || ""} ${listing.description || ""}`.toLowerCase();
  switch (type) {
    case "plot":
      return /plot|land|sqft plot|acre/.test(blob);
    case "rental":
      return /rent|rental|lease|tenant/.test(blob);
    case "residential":
      return /bhk|apartment|villa|home|house|flat|residence/.test(blob);
    default:
      return true;
  }
}

// Apply search text, city, property type and max-budget filters to a list.
export function filterListings(listings, { search = "", city = "", type = "any", maxBudget = null } = {}) {
  const q = search.trim().toLowerCase();
  return (listings || []).filter((l) => {
    if (q) {
      const blob = `${l.title || ""} ${l.location || ""} ${l.specs || ""} ${l.description || ""}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (city && !`${l.location || ""}`.toLowerCase().includes(city.toLowerCase())) return false;
    if (!matchesPropertyType(l, type)) return false;
    if (maxBudget != null) {
      const price = parsePrice(l.price);
      if (price != null && price > maxBudget) return false;
    }
    return true;
  });
}

export function timeAgo(dateInput) {
  const ts = new Date(dateInput).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
