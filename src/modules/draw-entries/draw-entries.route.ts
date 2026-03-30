import { Router } from "express";
import { DrawEntriesController } from "./draw-entries.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { requireSubscription } from "../../common/middleware/subscription.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { enterDrawSchema } from "./draw-entries.schema";

const router = Router();

// Subscriber
router.post("/", authenticate, requireSubscription, validate(enterDrawSchema), DrawEntriesController.enter);
router.get("/me", authenticate, DrawEntriesController.getMyEntries);

// Admin
router.get("/draw/:drawId", authenticate, adminOnly, DrawEntriesController.getByDraw);

export default router;