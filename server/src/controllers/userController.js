import { User } from "../models/User.js";
import { ROLE_NAMES } from "../config/roles.js";

export async function listUsers(_req, res) {
  const users = await User.find().sort({ role: 1, name: 1 });
  res.json(users.map((u) => u.toJSON()));
}

export async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!ROLE_NAMES.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "A user with that email already exists." });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name: name.trim(), email: email.trim(), passwordHash, role });
  res.status(201).json(user.toJSON());
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!ROLE_NAMES.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(user.toJSON());
}

export async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ ok: true });
}
