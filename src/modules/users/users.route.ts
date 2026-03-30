import { Router } from "express";
import { UsersController } from "./users.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { updateUserSchema } from "./users.schema";

const router = Router();

// Subscriber routes
router.get("/me", authenticate, UsersController.getMe);
router.patch("/me", authenticate, validate(updateUserSchema), UsersController.updateMe);

// Admin routes
router.get("/", authenticate, adminOnly, UsersController.getAll);
router.get("/:id", authenticate, adminOnly, UsersController.getById);
router.patch("/:id/toggle-active", authenticate, adminOnly, UsersController.toggleActive);

export default router;