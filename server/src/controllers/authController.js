import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Public self-registration. New accounts are always created as "viewer".
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "A user with that email already exists." });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: email.trim(),
    passwordHash,
    role: "viewer", // role is forced server-side regardless of input
  });

  return res.status(201).json({ token: signToken(user), user: user.toJSON() });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  return res.json({ token: signToken(user), user: user.toJSON() });
}

export async function me(req, res) {
  return res.json({ user: req.user.toJSON() });
}
