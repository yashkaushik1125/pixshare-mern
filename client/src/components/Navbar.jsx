import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { name, roles } = useConfig();
  const navigate = useNavigate();
  const caps = roles?.[user.role]?.can || {};

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">{name}</NavLink>
        <NavLink to="/" end className="nav-link">Feed</NavLink>
        {caps.post && <NavLink to="/post" className="nav-link">Post</NavLink>}
        {caps.manageUsers && <NavLink to="/admin" className="nav-link">Admin</NavLink>}
        <NavLink to="/profile" className="nav-link">Profile</NavLink>
        <button className="nav-link" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
