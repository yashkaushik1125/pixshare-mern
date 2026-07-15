import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import Avatar from "../components/Avatar.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Admin() {
  const { user } = useAuth();
  const { roles } = useConfig();
  const queryClient = useQueryClient();
  const roleNames = Object.keys(roles || {});
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [error, setError] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/users", payload),
    onSuccess: () => { invalidate(); setForm({ name: "", email: "", password: "", role: "viewer" }); },
    onError: (err) => setError(apiError(err, "Could not create user.")),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: invalidate,
    onError: (err) => alert(apiError(err)),
  });

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(form);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="container">
      <div className="page-head">
        <h1>Team management</h1>
        <p>Create users and assign broker or viewer access.</p>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Add a user</h2>
        {error && <div className="flash flash-error">{error}</div>}
        <form onSubmit={submit}>
          <input className="input" placeholder="Full name" value={form.name} onChange={update("name")} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={update("password")} required />
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={update("role")}>
            {roleNames.map((r) => <option key={r} value={r}>{roles[r].label}</option>)}
          </select>
          <button className="btn btn-block" disabled={createMutation.isPending}>Create user</button>
        </form>
      </div>

      <h2 style={{ fontSize: 17, margin: "22px 0 12px" }}>All users</h2>
      {users.map((u) => (
        <div className="user-row" key={u.id}>
          <Avatar name={u.name} url={u.avatarUrl} size={44} />
          <div className="info">
            <div className="name">
              <Link to={`/users/${u.id}`} className="author-link">{u.name}</Link>
              {u.id === user.id ? " (you)" : ""}
            </div>
            <div className="email">{u.email}</div>
          </div>
          <RoleBadge role={u.role} />
          <select className="inline-select" value={u.role}
            onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}>
            {roleNames.map((r) => <option key={r} value={r}>{roles[r].label}</option>)}
          </select>
          {u.id !== user.id && (
            <button className="btn btn-danger btn-sm"
              onClick={() => window.confirm(`Delete ${u.name}?`) && deleteMutation.mutate(u.id)}>
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
