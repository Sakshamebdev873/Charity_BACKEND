import { Router } from "express";
import { CharitySelectionsController } from "./charity-selections.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { selectCharitySchema } from "./charity-selections.schema";

const router = Router();

router.get("/me", authenticate, CharitySelectionsController.getMine);
router.post("/", authenticate, validate(selectCharitySchema), CharitySelectionsController.select);

export default router;