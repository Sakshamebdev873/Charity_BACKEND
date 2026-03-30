import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { registerSchema, loginSchema } from "./auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/profile", authenticate, AuthController.getProfile);

export default router;