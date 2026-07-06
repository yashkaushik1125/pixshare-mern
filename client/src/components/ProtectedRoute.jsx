import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";

// Gates a route behind authentication and (optionally) a capability.
export default function ProtectedRoute({ children, capability }) {
  const { user } = useAuth();
  const { roles } = useConfig();

  if (!user) return <Navigate to="/login" replace />;

  if (capability && !roles?.[user.role]?.can?.[capability]) {
    return (
      <div className="container">
        <div className="empty">
          <span className="emoji">🚫</span>
          <h1>403</h1>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
