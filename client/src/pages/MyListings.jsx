import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError, resolveImageUrl } from "../api/client";
import Spinner from "../components/Spinner.jsx";

const CATEGORY_LABEL = {
  villa: "Villa",
  flat: "Flat",
  bunglow: "Bungalow",
  farm: "Farm",
};

export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: listings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => (await api.get("/listings/mine")).data,
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err) => alert(apiError(err, "Could not delete the listing.")),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="container">
      <div className="page-head">
        <h1>My listings</h1>
        <p>Manage the properties you have posted — edit the details or remove a listing.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Link to="/post" className="btn">
          + New listing
        </Link>
      </div>

      {isError && <div className="flash flash-error">Could not load your listings.</div>}

      {!listings.length && !isError && (
        <div className="empty">
          <span className="emoji">🏠</span>
          <strong>No listings yet</strong>
          <p>Create your first property listing and it will show up here.</p>
          <Link to="/post" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create listing
          </Link>
        </div>
      )}

      {listings.length > 0 && (
        <div className="property-grid">
          {listings.map((l) => (
            <article key={l.id} className="card listing-card">
              <div
                className="listing-media"
                onClick={() => navigate(`/listing/${l.id}`)}
                style={{ cursor: "pointer" }}
              >
                <img className="card-img" src={resolveImageUrl(l.imageUrl)} alt={l.title} loading="lazy" />
              </div>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    {l.category && (
                      <span className="listing-category" style={{ marginBottom: 6 }}>
                        {CATEGORY_LABEL[l.category] || l.category}
                      </span>
                    )}
                    <h3 style={{ margin: "6px 0 0" }}>{l.title}</h3>
                    <div className="muted">
                      📍 {l.location}
                      {l.specs ? ` • ${l.specs}` : ""}
                    </div>
                  </div>
                  <strong style={{ whiteSpace: "nowrap" }}>{l.price}</strong>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <Link to={`/post/${l.id}`} className="btn btn-ghost btn-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={del.isPending && del.variables === l.id}
                    onClick={() => window.confirm(`Delete "${l.title}"?`) && del.mutate(l.id)}
                  >
                    {del.isPending && del.variables === l.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
