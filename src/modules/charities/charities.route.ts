import { Router } from "express";
import { CharitiesController } from "./charities.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createCharitySchema, updateCharitySchema } from "./charities.schema";

const router = Router();

// Public
router.get("/", CharitiesController.getAll);
router.get("/featured", CharitiesController.getFeatured);
router.get("/slug/:slug", CharitiesController.getBySlug);

// Admin
router.get("/admin", authenticate, adminOnly, CharitiesController.adminGetAll);
router.get("/admin/donation-totals", authenticate, adminOnly, CharitiesController.getDonationTotals);
router.post("/", authenticate, adminOnly, validate(createCharitySchema), CharitiesController.create);
router.patch("/:id", authenticate, adminOnly, validate(updateCharitySchema), CharitiesController.update);
router.delete("/:id", authenticate, adminOnly, CharitiesController.delete);

export default router;