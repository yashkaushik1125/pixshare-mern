import { useQuery } from "@tanstack/react-query";
import { api, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Feed() {
  const { user } = useAuth();
  const { name, roles } = useConfig();
  const caps = roles?.[user.role]?.can || {};
  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => (await api.get("/listings")).data,
  });

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
          <div className="row-between" style={{ gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <span
              className="badge"
              style={{
                color: "#1d4ed8",
                borderColor: "rgba(37, 99, 235, 0.18)",
                background: "rgba(37, 99, 235, 0.08)",
              }}
            >
              Live listings {listings.length}
            </span>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <div className="hero-graphic" aria-hidden="true" />
      </div>

      {isError && <div className="flash flash-error">Could not load the listings.</div>}

      {!listings.length && !isError && (
        <div className="empty">
          <span className="emoji">🏡</span>
          <strong>No listings available</strong>
          <p>{caps.post ? "Create the first listing from the Create page." : "Please check back soon."}</p>
        </div>
      )}
      {listings.length > 0 && (
        <div className="property-grid">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="card listing-card"
              onClick={() => window.open(`${window.location.origin}/listing/${listing.id}`, "_blank")}
              style={{ cursor: "pointer" }}
            >
              <img className="card-img" src={resolveImageUrl(listing.imageUrl)} alt={listing.title} />
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{listing.title}</h3>
                    <div className="muted">{listing.location} • {listing.specs}</div>
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
