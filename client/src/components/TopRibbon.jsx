import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const CITIES = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai", "Delhi"];

export default function TopRibbon({ cityFilter = "", onCityChange, searchText = "", onSearchChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showCityFilter = Boolean(user);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="top-ribbon">
      <div className="ribbon-inner">
        <div className="ribbon-left">
          <Link to="/" className="ribbon-brand" aria-label="Go to homepage">
            <span className="ribbon-logo">P</span>
            <span>Pixshare</span>
          </Link>
          <div className="ribbon-nav-links">
            <Link to="/" className="ribbon-nav-link">
              Home
            </Link>
            <Link to="/profile" className="ribbon-nav-link">
              Profile
            </Link>
            {user ? (
              <Link to="/post" className="ribbon-nav-link">
                Create
              </Link>
            ) : null}
          </div>
          {showCityFilter ? (
            <>
              <input
                className="input ribbon-search"
                placeholder="Search city, project, or landmark"
                value={searchText}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
              <select
                className="input ribbon-select"
                value={cityFilter}
                onChange={(event) => onCityChange?.(event.target.value)}
              >
                <option value="">All cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="ribbon-meta">Discover premium homes and land listings</span>
          )}
        </div>

        <div className="ribbon-right">
          {user ? (
            <>
              <span className="ribbon-user">Hi, {user.name || "there"}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-ghost">
                Sign up
              </Link>
              <Link to="/login" className="btn btn-primary">
                Sign in for free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
