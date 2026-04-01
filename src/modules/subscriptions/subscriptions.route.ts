import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createSubscriptionSchema, updateSubscriptionSchema } from "./subscriptions.schema";

const router = Router();

// Subscriber
router.post("/checkout", authenticate, validate(createSubscriptionSchema), SubscriptionsController.createCheckout);
router.post("/confirm", authenticate, SubscriptionsController.confirmCheckout);
router.get("/me", authenticate, SubscriptionsController.getMine);
router.patch("/me", authenticate, validate(updateSubscriptionSchema), SubscriptionsController.update);
router.post("/me/cancel", authenticate, SubscriptionsController.cancel);

// Admin
router.get("/", authenticate, adminOnly, SubscriptionsController.getAll);
router.patch("/admin/:userId", authenticate, adminOnly, SubscriptionsController.adminUpdate);

export default router;