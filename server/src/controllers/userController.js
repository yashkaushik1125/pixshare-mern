import { User } from "../models/User.js";
import { Listing } from "../models/Listing.js";
import { ROLE_NAMES } from "../config/roles.js";

export async function listUsers(_req, res) {
  const users = await User.find().sort({ role: 1, name: 1 });
  res.json(users.map((u) => u.toJSON()));
}

// --- Self-service profile + social features (any authenticated user) ---------

// Update the logged-in user's own profile: name, bio, and avatar (uploaded
// file under "avatar", or an avatarUrl string; empty string clears it).
export async function updateMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { name, bio, avatarUrl } = req.body;
  let nameChanged = false;

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "Name cannot be empty." });
    nameChanged = name.trim() !== user.name;
    user.name = name.trim();
  }
  if (bio !== undefined) user.bio = bio.trim().slice(0, 300);

  if (req.file) {
    user.avatarUrl = `/uploads/${req.file.filename}`;
  } else if (avatarUrl !== undefined) {
    const trimmed = avatarUrl.trim();
    if (trimmed === "" || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads/")) {
      user.avatarUrl = trimmed;
    }
  }

  await user.save();

  // Keep the denormalised broker name on listings in sync.
  if (nameChanged) {
    await Listing.updateMany({ broker: user.id }, { brokerName: user.name });
  }

  res.json({ user: user.toJSON() });
}

// Public profile for any user: adds listing count, follow state and self flag.
export async function getUserProfile(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const doc = user.toJSON();
  doc.listingCount = await Listing.countDocuments({ broker: user.id });
  doc.isMe = user.id === req.user.id;
  doc.isFollowing = user.followers.some((f) => f.toString() === req.user.id);
  res.json(doc);
}

export async function followUser(req, res) {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself." });
  }
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ error: "User not found." });

  await User.updateOne({ _id: req.user.id }, { $addToSet: { following: target._id } });
  await User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user.id } });

  const updated = await User.findById(targetId);
  const doc = updated.toJSON();
  doc.listingCount = await Listing.countDocuments({ broker: targetId });
  doc.isMe = false;
  doc.isFollowing = true;
  res.json(doc);
}

export async function unfollowUser(req, res) {
  const targetId = req.params.id;
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ error: "User not found." });

  await User.updateOne({ _id: req.user.id }, { $pull: { following: target._id } });
  await User.updateOne({ _id: target._id }, { $pull: { followers: req.user.id } });

  const updated = await User.findById(targetId);
  const doc = updated.toJSON();
  doc.listingCount = await Listing.countDocuments({ broker: targetId });
  doc.isMe = targetId === req.user.id;
  doc.isFollowing = false;
  res.json(doc);
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
