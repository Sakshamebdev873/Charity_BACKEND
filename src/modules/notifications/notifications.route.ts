import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";

const router = Router();

// Subscriber
router.get("/me", authenticate, NotificationsController.getMine);
router.patch("/:id/read", authenticate, NotificationsController.markAsRead);
router.patch("/read-all", authenticate, NotificationsController.markAllAsRead);

// Admin — broadcast
router.post("/broadcast", authenticate, adminOnly, NotificationsController.notifyAll);

export default router;