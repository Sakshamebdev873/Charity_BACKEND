import { Router } from "express";
import { WinnersController } from "./winners.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { adminOnly } from "../../common/middleware/admin.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { uploadProofSchema, verifyWinnerSchema, updatePayoutSchema } from "./winners.schema";

const router = Router();

// Subscriber
router.get("/me", authenticate, WinnersController.getMine);
router.patch("/:id/proof", authenticate, validate(uploadProofSchema), WinnersController.uploadProof);

// Admin
router.get("/", authenticate, adminOnly, WinnersController.getAll);
router.get("/draw/:drawId", authenticate, adminOnly, WinnersController.getByDraw);
router.patch("/:id/verify", authenticate, adminOnly, validate(verifyWinnerSchema), WinnersController.verify);
router.patch("/:id/payout", authenticate, adminOnly, validate(updatePayoutSchema), WinnersController.updatePayout);

export default router;