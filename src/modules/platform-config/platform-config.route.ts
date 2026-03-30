import { Router } from "express";
import { PlatformConfigController } from "./platform-config.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { upsertConfigSchema } from "./platform-config.schema";

const router = Router();

// All admin-only
router.get("/", authenticate, adminOnly, PlatformConfigController.getAll);
router.get("/:key", authenticate, adminOnly, PlatformConfigController.getByKey);
router.put("/", authenticate, adminOnly, validate(upsertConfigSchema), PlatformConfigController.upsert);
router.delete("/:key", authenticate, adminOnly, PlatformConfigController.delete);

export default router;