import { Router } from "express";
import { DonationsController } from "./donations.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createDonationSchema } from "./donations.schema";

const router = Router();

// Subscriber
router.post("/", authenticate, validate(createDonationSchema), DonationsController.create);
router.get("/me", authenticate, DonationsController.getMine);

// Admin
router.get("/", authenticate, adminOnly, DonationsController.getAll);

export default router;