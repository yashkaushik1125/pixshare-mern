import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const { name, description } = useConfig();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    const res = await register(form.name, form.email, form.password);
    setLoading(false);
    if (res.ok) navigate("/");
    else setError(res.error);
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 410 }}>
        <div className="auth-hero">
          <h1>{name}</h1>
          <p>{description}</p>
        </div>
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            New accounts can browse properties and discover broker listings.
          </p>
          {error && <div className="flash flash-error">{error}</div>}
          <form onSubmit={submit}>
            <input className="input" placeholder="Full name" value={form.name}
              onChange={update("name")} required />
            <input className="input" type="email" placeholder="Email" value={form.email}
              onChange={update("email")} required />
            <input className="input" type="password" placeholder="Password (min 6 characters)"
              value={form.password} onChange={update("password")} required />
            <input className="input" type="password" placeholder="Confirm password"
              value={form.confirm} onChange={update("confirm")} required />
            <button className="btn btn-block" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <div className="divider">Already have an account?</div>
          <Link to="/login" className="btn btn-ghost btn-block">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}
