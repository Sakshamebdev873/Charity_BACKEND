import { Router } from "express";
import { DrawsController } from "./draws.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createDrawSchema, updateDrawSchema } from "./draws.schema";

const router = Router();

// Public / subscriber
router.get("/published", authenticate, DrawsController.getPublished);

// Admin
router.get("/", authenticate, adminOnly, DrawsController.getAll);
router.get("/:id", authenticate, adminOnly, DrawsController.getById);
router.post("/", authenticate, adminOnly, validate(createDrawSchema), DrawsController.create);
router.patch("/:id", authenticate, adminOnly, validate(updateDrawSchema), DrawsController.update);
router.post("/:id/simulate", authenticate, adminOnly, DrawsController.simulate);
router.post("/:id/execute", authenticate, adminOnly, DrawsController.execute);

export default router;