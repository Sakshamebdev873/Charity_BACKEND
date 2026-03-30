import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";

const router = Router();

router.get("/dashboard", authenticate, adminOnly, AdminController.getDashboard);
router.get("/reports", authenticate, adminOnly, AdminController.getReports);

export default router;