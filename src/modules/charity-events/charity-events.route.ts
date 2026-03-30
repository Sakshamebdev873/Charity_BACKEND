import { Router } from "express";
import { CharityEventsController } from "./charity-events.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { createCharityEventSchema, updateCharityEventSchema } from "./charity-events.schema";

const router = Router();

// Public
router.get("/upcoming", CharityEventsController.getUpcoming);
router.get("/charity/:charityId", CharityEventsController.getByCharity);

// Admin
router.post("/", authenticate, adminOnly, validate(createCharityEventSchema), CharityEventsController.create);
router.patch("/:id", authenticate, adminOnly, validate(updateCharityEventSchema), CharityEventsController.update);
router.delete("/:id", authenticate, adminOnly, CharityEventsController.delete);

export default router;