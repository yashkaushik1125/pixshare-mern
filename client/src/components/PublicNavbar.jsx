import { Link, NavLink } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";

// Lightweight navbar for public pages (login / register) where there is no
// authenticated user. Keeps the same look as the main app navbar.
export default function PublicNavbar() {
  const { name } = useConfig();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          {name}
        </Link>
        <NavLink to="/" end className="nav-link">
          Home
        </NavLink>
        <NavLink to="/login" className="nav-link">
          Login
        </NavLink>
        <NavLink to="/register" className="nav-link">
          Register
        </NavLink>
      </div>
    </nav>
  );
}
