import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import { filterListings } from "../lib/format.js";
import { detectCurrentCity } from "../lib/geo.js";
import RoleBadge from "../components/RoleBadge.jsx";
import Spinner from "../components/Spinner.jsx";

const BUDGET_OPTIONS = [
  { label: "Any budget", value: "" },
  { label: "Under ₹50 Lakh", value: String(50 * 1e5) },
  { label: "Under ₹1 Cr", value: String(1e7) },
  { label: "Under ₹1.5 Cr", value: String(1.5e7) },
  { label: "Under ₹3 Cr", value: String(3e7) },
];

const PROPERTY_TYPES = [
  { label: "All types", value: "any" },
  { label: "Residential", value: "residential" },
  { label: "Plot", value: "plot" },
  { label: "Rental", value: "rental" },
];

const CATEGORY_LABEL = {
  villa: "Villa",
  flat: "Flat",
  bunglow: "Bungalow",
  farm: "Farm",
};

export default function Feed() {
  const { user } = useAuth();
  const { roles } = useConfig();
  const caps = roles?.[user.role]?.can || {};

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [detecting, setDetecting] = useState(false);
  const [locationNote, setLocationNote] = useState(null);

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => (await api.get("/listings")).data,
  });

  const visible = useMemo(
    () =>
      filterListings(listings, {
        search,
        city,
        type: propertyType,
        maxBudget: budget ? Number(budget) : null,
      }),
    [listings, search, city, propertyType, budget]
  );

  const hasActiveFilters = search || city || budget || (propertyType && propertyType !== "any");

  async function handleDetect() {
    setDetecting(true);
    setLocationNote(null);
    try {
      const { city: detected, region } = await detectCurrentCity();
      setCity(detected);
      setLocationNote({ type: "success", text: `Showing listings near ${detected}${region ? `, ${region}` : ""}.` });
    } catch (err) {
      setLocationNote({ type: "error", text: err.message });
    } finally {
      setDetecting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setBudget("");
    setPropertyType("any");
    setLocationNote(null);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="container">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="muted">Trusted broker marketplace</p>
          <h1>Discover land and home listings from licensed brokers</h1>
          <p>
            Only verified brokers can share property listings here. Browse each home,
            review details, and save the listings that matter most.
          </p>
          <div className="row-between" style={{ gap: 12, flexWrap: "wrap", marginTop: 24, display: "flex", alignItems: "center" }}>
            <span
              className="badge"
              style={{
                color: "var(--primary)",
                borderColor: "rgba(var(--primary-rgb), 0.18)",
                background: "rgba(var(--primary-rgb), 0.08)",
              }}
            >
              Live listings {visible.length}
            </span>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <div className="hero-graphic" aria-hidden="true" />
      </div>

      {/* Search + filter toolbar */}
      <div className="filter-bar">
        <div className="filter-search">
          <span className="filter-search-icon" aria-hidden="true">🔍</span>
          <input
            className="input"
            type="search"
            placeholder="Search title, location, or specs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          className="input"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)}>
          {BUDGET_OPTIONS.map((b) => (
            <option key={b.label} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={handleDetect} disabled={detecting} style={{ whiteSpace: "nowrap" }}>
          {detecting ? "Locating…" : "📍 Near me"}
        </button>
        {hasActiveFilters && (
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {locationNote && (
        <div className={`flash ${locationNote.type === "error" ? "flash-error" : "flash-success"}`}>
          {locationNote.text}
        </div>
      )}

      {isError && <div className="flash flash-error">Could not load the listings.</div>}

      {!visible.length && !isError && (
        <div className="empty">
          <span className="emoji">{hasActiveFilters ? "🔍" : "🏡"}</span>
          <strong>{hasActiveFilters ? "No matching listings" : "No listings available"}</strong>
          <p>
            {hasActiveFilters
              ? "Try widening your budget, clearing the search, or picking another city."
              : caps.post
              ? "Create the first listing from the Create page."
              : "Please check back soon."}
          </p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="property-grid">
          {visible.map((listing, i) => (
            <article
              key={listing.id}
              className="card listing-card"
              onClick={() => window.open(`${window.location.origin}/listing/${listing.id}`, "_blank")}
              style={{ cursor: "pointer", animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className="listing-media">
                <img className="card-img" src={resolveImageUrl(listing.imageUrl)} alt={listing.title} loading="lazy" />
              </div>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {listing.category && (
                      <span className="listing-category" style={{ marginBottom: 6 }}>
                        {CATEGORY_LABEL[listing.category] || listing.category}
                      </span>
                    )}
                    <h3 style={{ margin: "6px 0 0" }}>{listing.title}</h3>
                    <div className="muted">📍 {listing.location}{listing.specs ? ` • ${listing.specs}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{listing.price}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{listing.trustScore ? `Trust ${listing.trustScore}` : ""}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
