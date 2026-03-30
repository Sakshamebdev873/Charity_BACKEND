import { Router } from "express";
import { DrawSimulationsController } from "./draw-simulations.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";

const router = Router();

router.get("/draw/:drawId", authenticate, adminOnly, DrawSimulationsController.getByDraw);
router.get("/:id", authenticate, adminOnly, DrawSimulationsController.getById);
router.delete("/:id", authenticate, adminOnly, DrawSimulationsController.delete);

export default router;