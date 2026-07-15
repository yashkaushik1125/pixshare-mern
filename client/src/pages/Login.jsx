import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import PublicNavbar from "../components/PublicNavbar.jsx";

export default function Login() {
  const { login } = useAuth();
  const { name, description } = useConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate("/");
    else setError(res.error);
  };

  const quick = (em, pw) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <>
      <PublicNavbar />
      <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div className="auth-hero">
          <h1>{name}</h1>
          <p>{description}</p>
        </div>
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            Sign in to browse property listings from verified brokers.
          </p>
          {error && <div className="flash flash-error">{error}</div>}
          <form onSubmit={submit}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-block" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="divider">Quick demo login</div>
          <div className="quick-row">
            <div className="quick-chip" onClick={() => quick("admin@demo.app", "admin123")}>Broker</div>
            <div className="quick-chip" onClick={() => quick("editor@demo.app", "editor123")}>Broker</div>
            <div className="quick-chip" onClick={() => quick("viewer@demo.app", "viewer123")}>Viewer</div>
          </div>

          <div className="divider">New here?</div>
          <Link to="/register" className="btn btn-ghost btn-block">
            Create an account
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
