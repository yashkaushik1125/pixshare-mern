import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
  updateMe,
  getUserProfile,
  followUser,
  unfollowUser,
} from "../controllers/userController.js";
import { requireAuth, requireCapability } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// --- Self-service + social routes (any authenticated user) ------------------
// Declared BEFORE the admin guard below so they are not gated by manageUsers.
router.patch("/me", requireAuth, upload.single("avatar"), updateMe);
router.get("/:id/profile", requireAuth, getUserProfile);
router.post("/:id/follow", requireAuth, followUser);
router.delete("/:id/follow", requireAuth, unfollowUser);

// --- Admin-only management routes -------------------------------------------
router.use(requireAuth, requireCapability("manageUsers"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
