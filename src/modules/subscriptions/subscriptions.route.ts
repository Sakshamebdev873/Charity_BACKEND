import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createSubscriptionSchema, updateSubscriptionSchema } from "./subscriptions.schema";

const router = Router();

// Subscriber routes
router.post("/", authenticate, validate(createSubscriptionSchema), SubscriptionsController.create);
router.get("/me", authenticate, SubscriptionsController.getMine);
router.patch("/me", authenticate, validate(updateSubscriptionSchema), SubscriptionsController.update);
router.post("/me/cancel", authenticate, SubscriptionsController.cancel);

// Admin routes
router.get("/", authenticate, adminOnly, SubscriptionsController.getAll);
router.patch("/admin/:userId", authenticate, adminOnly, SubscriptionsController.adminUpdate);

export default router;