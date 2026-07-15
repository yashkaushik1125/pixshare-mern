import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import Avatar from "../components/Avatar.jsx";

const CAP_LABELS = [
  ["view", "Browse property listings"],
  ["post", "Post new listings"],
  ["deleteAny", "Delete any listing"],
  ["manageUsers", "Manage users & roles"],
];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { name: appName, roles } = useConfig();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const caps = roles?.[user.role]?.can || {};

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, bio: user.bio || "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [error, setError] = useState("");

  // Fresh stats (listing count + follow counts) for the logged-in user.
  const { data: profile } = useQuery({
    queryKey: ["myProfile", user.id],
    queryFn: async () => (await api.get(`/users/${user.id}/profile`)).data,
  });

  const save = useMutation({
    mutationFn: (fd) =>
      api.patch("/users/me", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: (res) => {
      updateUser(res.data.user);
      queryClient.invalidateQueries({ queryKey: ["myProfile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarUrlInput("");
    },
    onError: (err) => setError(apiError(err, "Could not update your profile.")),
  });

  const onLogout = () => {
    logout();
    navigate("/");
  };

  const onAvatar = (e) => {
    const f = e.target.files?.[0];
    setAvatarFile(f || null);
    setAvatarPreview(f ? URL.createObjectURL(f) : "");
  };

  const startEdit = () => {
    setForm({ name: user.name, bio: user.bio || "" });
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarUrlInput("");
    setError("");
    setEditing(true);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name cannot be empty.");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("bio", form.bio);
    if (avatarFile) fd.append("avatar", avatarFile);
    else if (avatarUrlInput.trim()) fd.append("avatarUrl", avatarUrlInput.trim());
    save.mutate(fd);
  };

  const listingCount = profile?.listingCount ?? 0;
  const followerCount = profile?.followerCount ?? user.followerCount ?? 0;
  const followingCount = profile?.followingCount ?? user.followingCount ?? 0;

  return (
    <div className="container">
      <div className="profile-card">
        {!editing ? (
          <>
            <div className="profile-head">
              <Avatar name={user.name} url={user.avatarUrl} size={92} />
              <div className="profile-meta">
                <h1 style={{ margin: 0 }}>{user.name}</h1>
                <p className="muted" style={{ margin: "4px 0" }}>{user.email}</p>
                <RoleBadge role={user.role} />
                {user.bio && <p className="profile-bio">{user.bio}</p>}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={startEdit}>
                Edit profile
              </button>
              <Link to="/my-listings" className="btn btn-ghost btn-sm">
                My listings
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={submit} style={{ textAlign: "left" }}>
            <h2 style={{ marginBottom: 14 }}>Edit profile</h2>
            {error && <div className="flash flash-error">{error}</div>}
            <div className="avatar-edit">
              <Avatar
                name={form.name}
                url={avatarPreview || avatarUrlInput || user.avatarUrl}
                size={72}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <label className="label">Profile picture</label>
                <input className="input" type="file" accept="image/*" onChange={onAvatar} />
              </div>
            </div>
            <label className="label">Or paste an image URL</label>
            <input
              className="input"
              type="url"
              placeholder="https://example.com/me.jpg"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
            />
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <label className="label">Bio</label>
            <textarea
              className="input"
              rows="3"
              maxLength={300}
              placeholder="Tell buyers a little about yourself..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="stats-3">
        <div className="stat">
          <div className="num">{listingCount}</div>
          <div className="lbl">Listings</div>
        </div>
        <div className="stat">
          <div className="num">{followerCount}</div>
          <div className="lbl">Followers</div>
        </div>
        <div className="stat">
          <div className="num">{followingCount}</div>
          <div className="lbl">Following</div>
        </div>
      </div>

      <h2 style={{ margin: "18px 0 10px", fontSize: 18 }}>Your broker access</h2>
      <div className="profile-card" style={{ textAlign: "left" }}>
        <ul className="cap-list">
          {CAP_LABELS.map(([key, label]) => (
            <li key={key}>
              <span className={`ic ${caps[key] ? "cap-ok" : "cap-no"}`}>{caps[key] ? "✓" : "✕"}</span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-danger btn-block" style={{ marginTop: 24 }} onClick={onLogout}>
        Sign out
      </button>
      <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
        {appName} · v1.0.0
      </p>
    </div>
  );
}
