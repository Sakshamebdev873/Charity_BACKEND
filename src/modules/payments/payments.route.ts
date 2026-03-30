import { Router } from "express";
import { PaymentsController } from "./payments.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";

const router = Router();

router.get("/me", authenticate, PaymentsController.getMine);
router.get("/", authenticate, adminOnly, PaymentsController.getAll);
router.get("/prize-pool", authenticate, adminOnly, PaymentsController.getPrizePool);

export default router;