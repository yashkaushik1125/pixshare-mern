import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, apiError, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";

const CATEGORY_LABEL = {
  villa: "Villa",
  flat: "Flat",
  bunglow: "Bungalow",
  farm: "Farm",
};

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { roles } = useConfig();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${id}`);
      navigate("/");
    } catch (err) {
      alert(apiError(err, "Could not delete the listing."));
      setDeleting(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then((r) => {
        if (mounted) {
          setListing(r.data);
          setActiveImage(0);
        }
      })
      .catch(() => {
        if (mounted) setListing(null);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;
  if (!listing)
    return (
      <div className="container">
        <div className="empty">
          <span className="emoji">🏡</span>
          <strong>Listing not found</strong>
          <p>Please return to the homepage and choose another property.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            Back to home
          </Link>
        </div>
      </div>
    );

  const isMasked = listing.price === "₹****";
  const images = listing.images?.length ? listing.images : [listing.imageUrl].filter(Boolean);
  const cover = images[activeImage] || listing.imageUrl;
  const amenities = listing.amenities || [];

  const caps = user ? roles?.[user.role]?.can || {} : {};
  const canManage = Boolean(user) && (String(listing.broker) === user.id || caps.deleteAny);

  return (
    <div className="container">
      <div className="hero-panel" style={{ padding: "24px 28px" }}>
        <div>
          <p className="muted">Property detail</p>
          <h1>{listing.title}</h1>
          <p>
            📍 {listing.location || "Location on request"}
            {listing.category ? ` • ${CATEGORY_LABEL[listing.category] || listing.category}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          {canManage && (
            <>
              <Link to={`/post/${listing.id}`} className="btn btn-ghost btn-sm">
                Edit
              </Link>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          )}
          <Link to="/" className="btn btn-ghost btn-sm">
            Back to home
          </Link>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <img className="card-img" src={resolveImageUrl(cover)} alt={listing.title} />
        {images.length > 1 && (
          <div className="thumb-strip">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                className={`thumb ${i === activeImage ? "active" : ""}`}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={resolveImageUrl(img)} alt={`${listing.title} ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}

        <div className="card-body">
          {/* Key facts */}
          <div className="detail-facts">
            <div className="fact">
              <span className="fact-label">Price</span>
              <strong className="fact-value">{listing.price}</strong>
            </div>
            <div className="fact">
              <span className="fact-label">Category</span>
              <strong className="fact-value">{CATEGORY_LABEL[listing.category] || "—"}</strong>
            </div>
            {listing.bhk ? (
              <div className="fact">
                <span className="fact-label">Configuration</span>
                <strong className="fact-value">{listing.bhk} BHK</strong>
              </div>
            ) : null}
            <div className="fact">
              <span className="fact-label">Size</span>
              <strong className="fact-value">{listing.size ? `${listing.size} sq ft` : "—"}</strong>
            </div>
            {typeof listing.trustScore === "number" && (
              <div className="fact">
                <span className="fact-label">Trust score</span>
                <strong className="fact-value">{listing.trustScore}/100</strong>
              </div>
            )}
          </div>

          {/* Location: city & state are public; full address only for admins */}
          <div className="detail-section">
            <h3>Location</h3>
            <p className="muted" style={{ margin: 0 }}>
              {listing.city || "—"}
              {listing.state ? `, ${listing.state}` : ""}
            </p>
            {listing.address ? (
              <p style={{ marginTop: 8 }}>
                <span className="listing-badge" style={{ marginRight: 8 }}>Private</span>
                {listing.address}
              </p>
            ) : (
              <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                The full address is shared with the broker and admins only.
              </p>
            )}
          </div>

          {listing.brokerName && (
            <div className="detail-section">
              <h3>Listed by</h3>
              <Link to={`/users/${listing.broker}`} className="author-link">
                {listing.brokerName}
              </Link>
            </div>
          )}

          {amenities.length > 0 && (
            <div className="detail-section">
              <h3>Amenities</h3>
              <div className="amenity-list">
                {amenities.map((a) => (
                  <span key={a} className="amenity-chip">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ lineHeight: 1.85, margin: 0 }}>{listing.description}</p>
          </div>

          <div className="row-between" style={{ gap: 16, marginTop: 24, flexWrap: "wrap" }}>
            {isMasked && !user ? (
              <Link to="/login" className="btn btn-primary">
                Sign in for free
              </Link>
            ) : (
              <>
                <button className="btn btn-primary">Contact broker</button>
                <button className="btn btn-ghost">Save listing</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
