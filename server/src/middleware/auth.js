import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { can } from "../config/roles.js";

// Verifies the Bearer token and attaches the current user to req.user.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Account no longer exists." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// Optional authentication: if a valid Bearer token is present, attach req.user,
// otherwise continue without error. Useful for public endpoints that may show
// limited data to anonymous visitors.
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next();
    req.user = user;
    return next();
  } catch (err) {
    return next();
  }
}
// Guards a route by capability (e.g. "post", "manageUsers").
export function requireCapability(capability) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!can(req.user.role, capability)) {
      return res.status(403).json({ error: "You don't have permission to do that." });
    }
    next();
  };
}
