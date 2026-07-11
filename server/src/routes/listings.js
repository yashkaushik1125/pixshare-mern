import { Router } from "express";
import { listListings, getListing } from "../controllers/listingController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public endpoints - optional authentication applied so full details are
// returned to authenticated users and masked for guests.
router.get("/", optionalAuth, listListings);
router.get("/:id", optionalAuth, getListing);

export default router;
