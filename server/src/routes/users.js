import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { requireAuth, requireCapability } from "../middleware/auth.js";

const router = Router();

// Every user-management route requires the "manageUsers" capability (admin only).
router.use(requireAuth, requireCapability("manageUsers"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
