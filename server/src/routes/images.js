import { Router } from "express";
import {
  listImages,
  getImage,
  createImage,
  deleteImage,
  toggleLike,
} from "../controllers/imageController.js";
import { requireAuth, requireCapability } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth); // all image routes require a logged-in user

router.get("/", listImages);
router.get("/:id", getImage);
router.post("/", requireCapability("post"), upload.single("imageFile"), createImage);
router.post("/:id/like", toggleLike);
router.delete("/:id", deleteImage);

export default router;
