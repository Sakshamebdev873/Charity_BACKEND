import { Router } from "express";
import { DrawsController } from "./draws.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createDrawSchema, updateDrawSchema } from "./draws.schema";

const router = Router();

// ═══ SPECIFIC routes FIRST (no :id) ═══
router.get("/upcoming", authenticate, DrawsController.getUpcoming);
router.get("/published", authenticate, DrawsController.getPublished);

// ═══ ADMIN routes ═══
router.get("/", authenticate, adminOnly, DrawsController.getAll);
router.post("/", authenticate, adminOnly, validate(createDrawSchema), DrawsController.create);

// ═══ PARAM routes LAST (/:id catches everything) ═══
router.get("/:id", authenticate, adminOnly, DrawsController.getById);
router.patch("/:id", authenticate, adminOnly, validate(updateDrawSchema), DrawsController.update);
router.post("/:id/simulate", authenticate, adminOnly, DrawsController.simulate);
router.post("/:id/execute", authenticate, adminOnly, DrawsController.execute);
router.delete("/:id", authenticate, adminOnly, DrawsController.delete);

export default router;