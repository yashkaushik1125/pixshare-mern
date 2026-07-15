import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useMemo, useState } from "react";
import { api, resolveImageUrl } from "../api/client";
import { filterListings } from "../lib/format.js";
import { detectCurrentCity } from "../lib/geo.js";

const OPTIONS = [
  {
    title: "For buyers",
    description: "Discover verified homes and land listings curated for your budget and location.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "For owners",
    description: "List your property with confidence and reach serious buyers across the network.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "For tenants",
    description: "Find rental homes, apartments, and easy move-in listings near you.",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "For owners",
    description: "Sell faster with verified broker support and featured placement.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  },
];

const CATEGORIES = [
  {
    title: "Premium homes",
    subtitle: "Modern residences with high-end finishes.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Land plots",
    subtitle: "Plots in fast-growing neighborhoods and gated communities.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ready-to-move",
    subtitle: "Properties available for immediate handover.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
];

const CITIES = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai", "Delhi"];

const BUDGET_OPTIONS = [
  { label: "Any budget", value: "" },
  { label: "Under ₹50 Lakh", value: String(50 * 1e5) },
  { label: "Under ₹1 Cr", value: String(1e7) },
  { label: "Under ₹1.5 Cr", value: String(1.5e7) },
  { label: "Under ₹3 Cr", value: String(3e7) },
];

const PROPERTY_TYPES = [
  { label: "Property type", value: "any" },
  { label: "Residential", value: "residential" },
  { label: "Plot", value: "plot" },
  { label: "Rental", value: "rental" },
];

const BENEFITS = [
  { title: "Verified listings", description: "All properties are posted by licensed brokers." },
  { title: "Easy search", description: "Filter by budget, city, and property type instantly." },
  { title: "Secure contact", description: "Connect directly with sellers through the platform." },
];

function Ribbon({ search, onSearchChange, city, onCityChange, onDetect, detecting }) {
  return (
    <div className="top-ribbon">
      <div className="ribbon-inner">
        <div className="ribbon-left">
          <input
            className="input"
            placeholder="Search city, project, or landmark"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select
            className="input"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm detect-btn"
            onClick={onDetect}
            disabled={detecting}
            style={{ marginLeft: 8, whiteSpace: "nowrap" }}
            title="Use my current location"
          >
            {detecting ? "Locating…" : "📍 Near me"}
          </button>
        </div>
        <div className="ribbon-right">
          <Link to="/register" className="btn btn-ghost">
            Sign up
          </Link>
          <Link to="/login" className="btn btn-primary" style={{ marginLeft: 8 }}>
            Sign in for free
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListingsGrid({ filters }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch by city on the server (fast narrowing), then refine the remaining
  // filters (search text, budget, property type) on the client.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const url = filters.city
      ? `/listings?city=${encodeURIComponent(filters.city)}`
      : "/listings";
    api
      .get(url)
      .then((r) => {
        if (mounted) setListings(r.data || []);
      })
      .catch(() => {
        if (mounted) setListings([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => (mounted = false);
  }, [filters.city]);

  const visible = useMemo(
    () =>
      filterListings(listings, {
        search: filters.search,
        type: filters.type,
        maxBudget: filters.maxBudget,
        // city already applied server-side; keep client guard for safety
        city: filters.city,
      }),
    [listings, filters.search, filters.type, filters.maxBudget, filters.city]
  );

  if (loading) {
    return (
      <div className="listing-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="listing-card skeleton-card" aria-hidden="true">
            <div className="skeleton skeleton-img" />
            <div className="listing-copy">
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!visible.length) {
    return (
      <div className="empty">
        <span className="emoji">🔍</span>
        <strong>No matching listings</strong>
        <p>Try widening your budget, clearing the search, or picking another city.</p>
      </div>
    );
  }

  return (
    <div className="listing-grid">
      {visible.map((listing, i) => (
        <article
          key={listing.id}
          className="listing-card clickable"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
          onClick={() => window.open(`${window.location.origin}/listing/${listing.id}`, "_blank")}
        >
          <div className="listing-media">
            <img src={resolveImageUrl(listing.imageUrl)} alt={listing.title} loading="lazy" />
          </div>
          <div className="listing-copy">
            <span className="listing-badge">Featured</span>
            <h3>{listing.title}</h3>
            <p className="listing-location">📍 {listing.location}</p>
            <p className="listing-specs">{listing.specs}</p>
            <div className="listing-footer">
              <strong>{listing.price}</strong>
              <span className="btn btn-sm btn-ghost">View</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [detecting, setDetecting] = useState(false);
  const [locationNote, setLocationNote] = useState(null);

  const filters = useMemo(
    () => ({
      search,
      city: cityFilter,
      type: propertyType,
      maxBudget: budget ? Number(budget) : null,
    }),
    [search, cityFilter, propertyType, budget]
  );

  const hasActiveFilters =
    search || cityFilter || budget || (propertyType && propertyType !== "any");

  async function handleDetect() {
    setDetecting(true);
    setLocationNote(null);
    try {
      const { city, region } = await detectCurrentCity();
      setCityFilter(city);
      setLocationNote({ type: "success", text: `Showing listings near ${city}${region ? `, ${region}` : ""}.` });
    } catch (err) {
      setLocationNote({ type: "error", text: err.message });
    } finally {
      setDetecting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setCityFilter("");
    setBudget("");
    setPropertyType("any");
    setLocationNote(null);
  }

  return (
    <main className="home-page">
      <Ribbon
        search={search}
        onSearchChange={setSearch}
        city={cityFilter}
        onCityChange={setCityFilter}
        onDetect={handleDetect}
        detecting={detecting}
      />

      <section className="home-hero">
        <div className="home-copy">
          <span className="eyebrow">Property marketplace</span>
          <h1>Find your next home, land parcel, or rental in one place.</h1>
          <p>
            Browse verified listings from licensed brokers, connect with owners, and start your property journey today.
            Inspired by the best of 99acres.com.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-ghost">
              Sign up
            </Link>
          </div>
          <div className="home-search">
            <input
              className="input"
              type="search"
              placeholder="Search location, project, or landmark"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            <button
              type="button"
              className="btn btn-primary home-search-btn"
              onClick={() => {
                document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Search now
            </button>
          </div>

          <div className="filter-utility">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDetect}
              disabled={detecting}
            >
              {detecting ? "Detecting location…" : "📍 Detect my location"}
            </button>
            {hasActiveFilters && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            )}
            {cityFilter && <span className="filter-chip">City: {cityFilter}</span>}
            {budget && (
              <span className="filter-chip">
                {BUDGET_OPTIONS.find((b) => b.value === budget)?.label}
              </span>
            )}
            {propertyType !== "any" && (
              <span className="filter-chip">
                {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label}
              </span>
            )}
          </div>

          {locationNote && (
            <div className={`flash ${locationNote.type === "error" ? "flash-error" : "flash-success"}`} style={{ marginTop: 16 }}>
              {locationNote.text}
            </div>
          )}

          <div className="hero-pill-row">
            <span className="hero-pill">For buyers</span>
            <span className="hero-pill">For owners</span>
            <span className="hero-pill">For tenants</span>
            <span className="hero-pill">For brokers</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
            alt="Modern home interior"
          />
          <div className="hero-banner">Trusted homes and land in one place.</div>
        </div>
      </section>

      <section className="home-stats">
        <div className="stat-card">
          <h3>10K+</h3>
          <p>Active listings</p>
        </div>
        <div className="stat-card">
          <h3>8.7K</h3>
          <p>Verified brokers</p>
        </div>
        <div className="stat-card">
          <h3>98%</h3>
          <p>Happy buyers</p>
        </div>
      </section>

      <section className="home-options">
        <div className="section-head">
          <h2>Choose your path</h2>
          <p>Whether you are buying, renting, or selling, we have a tailored experience for you.</p>
        </div>
        <div className="option-grid">
          {OPTIONS.map((option, i) => (
            <article key={`${option.title}-${i}`} className="option-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="option-image">
                <img src={option.image} alt={option.title} loading="lazy" />
              </div>
              <div className="option-body">
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-listings" id="listings">
        <div className="section-head">
          <h2>Featured listings</h2>
          <p>
            {hasActiveFilters
              ? "Results matching your search and filters."
              : "Popular properties handpicked from the marketplace."}
          </p>
        </div>
        <ListingsGrid filters={filters} />
      </section>

      <section className="home-categories">
        <div className="section-head">
          <h2>Featured categories</h2>
          <p>Explore popular property types that buyers and tenants search for most.</p>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((item, i) => (
            <article key={item.title} className="category-card" style={{ animationDelay: `${i * 70}ms` }}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="category-copy">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-quickcity">
        <div className="section-head">
          <h2>Popular cities</h2>
          <p>Search properties where buyers are most active.</p>
        </div>
        <div className="city-row">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              className={`city-pill ${cityFilter === city ? "active" : ""}`}
              onClick={() => {
                setCityFilter(city);
                document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      <section className="home-benefits">
        <div className="section-head">
          <h2>Why choose us</h2>
          <p>Get the most comfortable property search and secure contacts with brokers.</p>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map((item, i) => (
            <div key={item.title} className="benefit-card" style={{ animationDelay: `${i * 70}ms` }}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-contact" id="contact">
        <div>
          <h2>Ready to get started?</h2>
          <p>
            Contact our support team or sign in to see verified listings and broker details.
          </p>
        </div>
        <div className="contact-actions">
          <a href="mailto:hello@example.com" className="btn btn-primary">
            Contact us
          </a>
          <Link to="/register" className="btn btn-ghost">
            Create an account
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <p>Inspired by 99acres.com • Copyright-free property imagery.</p>
      </footer>
    </main>
  );
}
