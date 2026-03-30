import { Router } from "express";
import { ScoresController } from "./scores.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { requireSubscription } from "../../common/middleware/subscription.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { addScoreSchema, updateScoreSchema } from "./scores.schema";

const router = Router();

// Subscriber routes (requires active subscription)
router.post("/", authenticate, requireSubscription, validate(addScoreSchema), ScoresController.addScore);
router.get("/me", authenticate, requireSubscription, ScoresController.getMyScores);
router.patch("/:id", authenticate, requireSubscription, validate(updateScoreSchema), ScoresController.updateScore);

// Admin routes
router.get("/user/:userId", authenticate, adminOnly, ScoresController.adminGetUserScores);
router.patch("/admin/:id", authenticate, adminOnly, validate(updateScoreSchema), ScoresController.adminUpdateScore);

export default router;