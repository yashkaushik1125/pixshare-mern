import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { api, resolveImageUrl } from "../api/client";

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

// dynamic listings loaded from the API
const LISTINGS = [];

const CITIES = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai", "Delhi"];

const BENEFITS = [
  { title: "Verified listings", description: "All properties are posted by licensed brokers." },
  { title: "Easy search", description: "Filter by budget, city, and property type instantly." },
  { title: "Secure contact", description: "Connect directly with sellers through the platform." },
];

function Ribbon({ city, onCityChange }) {
  return (
    <div className="top-ribbon">
      <div className="ribbon-inner">
        <div className="ribbon-left">
          <input className="input" placeholder="Search city, project, or landmark" />
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

function ListingsGrid({ city }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    let mounted = true;
    const url = city ? `/listings?city=${encodeURIComponent(city)}` : "/listings";
    api
      .get(url)
      .then((r) => {
        if (mounted) setListings(r.data || []);
      })
      .catch(() => {});
    return () => (mounted = false);
  }, [city]);

  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <article
          key={listing.id}
          className="listing-card clickable"
          onClick={() => window.open(`${window.location.origin}/listing/${listing.id}`, "_blank")}
        >
          <img src={resolveImageUrl(listing.imageUrl)} alt={listing.title} />
          <div className="listing-copy">
            <span className="listing-badge">Featured</span>
            <h3>{listing.title}</h3>
            <p className="listing-location">{listing.location}</p>
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
  const [cityFilter, setCityFilter] = useState("");

  return (
    <main className="home-page">
      <Ribbon city={cityFilter} onCityChange={setCityFilter} />

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
            <input className="input" type="search" placeholder="Search location, project, or landmark" />
            <input className="input" type="text" placeholder="Budget range" />
            <select className="input">
              <option>Property type</option>
              <option>Residential</option>
              <option>Plot</option>
              <option>Rental</option>
            </select>
            <button className="btn btn-primary home-search-btn">Search now</button>
          </div>
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
          {OPTIONS.map((option) => (
            <article key={option.title} className="option-card">
              <div className="option-image">
                <img src={option.image} alt={option.title} />
              </div>
              <div className="option-body">
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-listings">
        <div className="section-head">
          <h2>Featured listings</h2>
          <p>Popular properties handpicked from the marketplace.</p>
        </div>
        <ListingsGrid city={cityFilter} />
      </section>


      <section className="home-categories">
        <div className="section-head">
          <h2>Featured categories</h2>
          <p>Explore popular property types that buyers and tenants search for most.</p>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((item) => (
            <article key={item.title} className="category-card">
              <img src={item.image} alt={item.title} />
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
            <span key={city} className="city-pill">
              {city}
            </span>
          ))}
        </div>
      </section>

      <section className="home-benefits">
        <div className="section-head">
          <h2>Why choose us</h2>
          <p>Get the most comfortable property search and secure contacts with brokers.</p>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map((item) => (
            <div key={item.title} className="benefit-card">
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
