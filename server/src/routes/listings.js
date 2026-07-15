import { Router } from "express";
import {
  listListings,
  listMyListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController.js";
import { optionalAuth, requireAuth, requireCapability } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public endpoints - optional authentication applied so full details are
// returned to authenticated users and masked for guests.
router.get("/", optionalAuth, listListings);
// Current user's own listings. MUST be declared before "/:id" so it is not
// treated as an id lookup.
router.get("/mine", requireAuth, listMyListings);
router.get("/:id", optionalAuth, getListing);

// Create a listing (brokers/admins only). Accepts up to 8 uploaded images
// under the "imageFiles" field, plus any image URLs in the body.
router.post(
  "/",
  requireAuth,
  requireCapability("post"),
  upload.array("imageFiles", 8),
  createListing
);

// Edit / delete. Ownership (or admin) is enforced inside the controller.
router.patch("/:id", requireAuth, upload.array("imageFiles", 8), updateListing);
router.delete("/:id", requireAuth, deleteListing);

export default router;
