import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import { initials } from "../lib/format";
import RoleBadge from "../components/RoleBadge.jsx";

const CAP_LABELS = [
  ["view", "View the image feed"],
  ["post", "Post new images"],
  ["deleteAny", "Delete any image"],
  ["manageUsers", "Manage users & roles"],
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { name, roles } = useConfig();
  const navigate = useNavigate();
  const caps = roles?.[user.role]?.can || {};

  const { data: images = [] } = useQuery({
    queryKey: ["images"],
    queryFn: async () => (await api.get("/images")).data,
  });

  const mine = images.filter((i) => i.author === user.id);
  const totalLikes = mine.reduce((s, i) => s + i.likes, 0);

  const onLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="container">
      <div className="profile-card">
        <span className="avatar avatar-lg">{initials(user.name)}</span>
        <h1 style={{ marginTop: 12 }}>{user.name}</h1>
        <p className="muted">{user.email}</p>
        <div style={{ marginTop: 10 }}><RoleBadge role={user.role} /></div>
      </div>

      <div className="stats">
        <div className="stat"><div className="num">{mine.length}</div><div className="lbl">Listings</div></div>
        <div className="stat"><div className="num">{totalLikes}</div><div className="lbl">Total Interest</div></div>
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

      {mine.length > 0 && (
        <>
          <h2 style={{ margin: "18px 0 10px", fontSize: 18 }}>Your posts</h2>
          <div className="grid-thumbs">
            {mine.map((i) => (
              <Link key={i.id} to={`/image/${i.id}`}>
                <img src={resolveImageUrl(i.url)} alt={i.caption} loading="lazy" />
              </Link>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-danger btn-block" style={{ marginTop: 24 }} onClick={onLogout}>
        Sign out
      </button>
      <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
        {name} · v1.0.0
      </p>
    </div>
  );
}
