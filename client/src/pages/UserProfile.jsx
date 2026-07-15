import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import Spinner from "../components/Spinner.jsx";

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: async () => (await api.get(`/users/${id}/profile`)).data,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["userListings", id],
    queryFn: async () => (await api.get(`/listings?broker=${id}`)).data,
    enabled: Boolean(id),
  });

  const follow = useMutation({
    mutationFn: (isFollowing) =>
      isFollowing ? api.delete(`/users/${id}/follow`) : api.post(`/users/${id}/follow`),
    onSuccess: (res) => queryClient.setQueryData(["userProfile", id], res.data),
    onError: (err) => alert(apiError(err, "Could not update follow.")),
  });

  if (isLoading) return <Spinner />;
  if (isError || !profile)
    return (
      <div className="container">
        <div className="empty">
          <span className="emoji">👤</span>
          <strong>User not found</strong>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            Back to home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="profile-card">
        <div className="profile-head">
          <Avatar name={profile.name} url={profile.avatarUrl} size={92} />
          <div className="profile-meta">
            <h1 style={{ margin: 0 }}>{profile.name}</h1>
            <div style={{ marginTop: 6 }}>
              <RoleBadge role={profile.role} />
            </div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="follow-row">
              <span>
                <span className="fc-num">{profile.followerCount}</span>
                <span className="fc-lbl">Followers</span>
              </span>
              <span>
                <span className="fc-num">{profile.followingCount}</span>
                <span className="fc-lbl">Following</span>
              </span>
              <span>
                <span className="fc-num">{profile.listingCount}</span>
                <span className="fc-lbl">Listings</span>
              </span>
            </div>
          </div>
          {user && profile.isMe ? (
            <Link to="/profile" className="btn btn-ghost btn-sm">
              Edit profile
            </Link>
          ) : (
            <button
              type="button"
              className={`btn btn-sm ${profile.isFollowing ? "btn-ghost" : ""}`}
              disabled={follow.isPending}
              onClick={() => follow.mutate(profile.isFollowing)}
            >
              {follow.isPending ? "…" : profile.isFollowing ? "Following ✓" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <h2 style={{ margin: "20px 0 12px", fontSize: 18 }}>Listings by {profile.name}</h2>
      {!listings.length ? (
        <div className="empty">
          <span className="emoji">🏠</span>
          <strong>No listings yet</strong>
          <p>This user hasn't posted any properties.</p>
        </div>
      ) : (
        <div className="property-grid">
          {listings.map((l) => (
            <article
              key={l.id}
              className="card listing-card"
              onClick={() => window.open(`${window.location.origin}/listing/${l.id}`, "_blank")}
              style={{ cursor: "pointer" }}
            >
              <div className="listing-media">
                <img className="card-img" src={resolveImageUrl(l.imageUrl)} alt={l.title} loading="lazy" />
              </div>
              <div className="card-body">
                <h3 style={{ margin: 0 }}>{l.title}</h3>
                <div className="muted">
                  📍 {l.location}
                  {l.specs ? ` • ${l.specs}` : ""}
                </div>
                <strong>{l.price}</strong>
              </div>
            </article>
          ))}
        </div>
      )}

      <Link to="/" className="btn btn-ghost btn-sm" style={{ marginTop: 20 }}>
        Back to home
      </Link>
    </div>
  );
}
