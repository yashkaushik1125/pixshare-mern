import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then((r) => {
        if (mounted) setListing(r.data);
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

  return (
    <div className="container">
      <div className="hero-panel" style={{ padding: "24px 28px" }}>
        <div>
          <p className="muted">Property detail</p>
          <h1>{listing.title}</h1>
          <p>{listing.location}</p>
        </div>
        <Link to="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <img className="card-img" src={resolveImageUrl(listing.imageUrl)} alt={listing.title} />
        <div className="card-body">
          <div className="row-between" style={{ gap: 24, flexWrap: "wrap" }}>
            <div>
              <p className="muted">Price</p>
              <h2>{listing.price}</h2>
            </div>
            <div>
              <p className="muted">Size</p>
              <strong>{listing.specs}</strong>
            </div>
          </div>
          <p style={{ marginTop: 24, lineHeight: 1.85 }}>{listing.description}</p>
          <div className="row-between" style={{ gap: 16, marginTop: 32, flexWrap: "wrap" }}>
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
