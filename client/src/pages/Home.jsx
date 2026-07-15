import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
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

// Featured property categories. `key` matches the Listing.category enum on the
// server (villa / flat / bunglow / farm).
const CATEGORIES = [
  {
    key: "villa",
    title: "Villa",
    subtitle: "Spacious standalone villas with premium finishes.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "flat",
    title: "Flat",
    subtitle: "Apartments and flats in prime, well-connected locations.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "bunglow",
    title: "Bungalow",
    subtitle: "Independent bungalows with open, private space.",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "farm",
    title: "Farm",
    subtitle: "Farmhouses and agricultural land in green surroundings.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.title]));

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

// SquareYards-style sticky site header for the public homepage: brand, primary
// nav (with a Property Types dropdown), a city selector, and the Post Property
// CTA alongside sign in / sign up. Nav actions drive the existing Home filters.
function SiteHeader({ city, onCityChange, onSelectType, onSelectCategory }) {
  const { name } = useConfig();
  const brandMark = (name || "P").trim().charAt(0);

  const goToListings = () =>
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });

  const pickType = (type) => {
    onSelectType(type);
    goToListings();
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand" aria-label="Go to homepage">
          <span className="site-brand-mark">{brandMark}</span>
          <span className="site-brand-name">{name}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <button type="button" className="site-nav-link" onClick={() => pickType("residential")}>
            Buy
          </button>
          <button type="button" className="site-nav-link" onClick={() => pickType("rental")}>
            Rent
          </button>
          <button type="button" className="site-nav-link" onClick={goToListings}>
            New Projects
          </button>

          <div className="site-nav-item">
            <button type="button" className="site-nav-link has-caret" aria-haspopup="true">
              Property Types
              <span className="caret" aria-hidden="true">▾</span>
            </button>
            <div className="site-dropdown" role="menu">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="site-dropdown-link"
                  role="menuitem"
                  onClick={() => onSelectCategory(c.key)}
                >
                  <span>{c.title}</span>
                  <small>{c.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="site-header-actions">
          <select
            className="site-city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Select a city"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Link to="/post" className="btn btn-post">
            Post Property
            <span className="free-badge">FREE</span>
          </Link>
          <Link to="/login" className="btn btn-ghost btn-sm site-signin">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function ListingsGrid({ filters }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from the server, narrowing by city and (optionally) category. When a
  // category is selected we ask the server for the top 10 by trust score.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.category) {
      params.set("category", filters.category);
      params.set("sort", "trust");
      params.set("limit", "10");
    }
    const qs = params.toString();
    const url = qs ? `/listings?${qs}` : "/listings";
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
  }, [filters.city, filters.category]);

  const visible = useMemo(() => {
    // With a category selected, the server already returns the ranked top 10
    // for the chosen city + category, so show them as-is.
    if (filters.category) return listings;
    return filterListings(listings, {
      search: filters.search,
      type: filters.type,
      maxBudget: filters.maxBudget,
      // city already applied server-side; keep client guard for safety
      city: filters.city,
    });
  }, [listings, filters.search, filters.type, filters.maxBudget, filters.city, filters.category]);

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
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="listing-badge">Featured</span>
              {listing.category && (
                <span className="listing-category">{CATEGORY_LABELS[listing.category] || listing.category}</span>
              )}
            </div>
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
  const [category, setCategory] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationNote, setLocationNote] = useState(null);

  const filters = useMemo(
    () => ({
      search,
      city: cityFilter,
      type: propertyType,
      category,
      maxBudget: budget ? Number(budget) : null,
    }),
    [search, cityFilter, propertyType, category, budget]
  );

  const hasActiveFilters =
    search || cityFilter || budget || category || (propertyType && propertyType !== "any");

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === category);

  // Select a featured category and jump to the results.
  function selectCategory(key) {
    setCategory((prev) => (prev === key ? "" : key));
    setTimeout(() => {
      document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

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
    setCategory("");
    setLocationNote(null);
  }

  return (
    <>
      <SiteHeader
        city={cityFilter}
        onCityChange={setCityFilter}
        onSelectType={setPropertyType}
        onSelectCategory={selectCategory}
      />
      <main className="home-page">
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
          <h2>
            {activeCategoryMeta
              ? `Top ${activeCategoryMeta.title} listings${cityFilter ? ` in ${cityFilter}` : ""}`
              : "Featured listings"}
          </h2>
          <p>
            {activeCategoryMeta
              ? `Showing the top 10 ${activeCategoryMeta.title.toLowerCase()} properties${
                  cityFilter ? ` in ${cityFilter}` : " across all cities"
                }, ranked by trust score.`
              : hasActiveFilters
              ? "Results matching your search and filters."
              : "Popular properties handpicked from the marketplace."}
          </p>
          {activeCategoryMeta && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setCategory("")}
            >
              Clear category
            </button>
          )}
        </div>
        <ListingsGrid filters={filters} />
      </section>

      <section className="home-categories">
        <div className="section-head">
          <h2>Featured categories</h2>
          <p>Pick a city, then choose a category to see the top 10 listings there.</p>
        </div>
        <div className="category-toolbar">
          <select
            className="input"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Select a city for category results"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: 14 }}>
            {cityFilter ? `Showing categories for ${cityFilter}` : "Select a city to narrow results"}
          </span>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className={`category-card clickable ${category === item.key ? "active" : ""}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => selectCategory(item.key)}
              aria-pressed={category === item.key}
            >
              <div className="category-media">
                <img src={item.image} alt={item.title} loading="lazy" />
              </div>
              <div className="category-copy">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
                <span className="category-cta">
                  {category === item.key ? "Showing top 10 ↓" : "View top 10 →"}
                </span>
              </div>
            </button>
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
    </>
  );
}
