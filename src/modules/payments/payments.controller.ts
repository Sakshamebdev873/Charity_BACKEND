import { Response } from "express";
import { PaymentsService } from "./payments.service";
import { AuthRequest } from "../../common/types";

export class PaymentsController {
  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await PaymentsService.getByUser(req.user!.userId, +page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await PaymentsService.getAll(+page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPrizePool(req: AuthRequest, res: Response): Promise<void> {
    try {
      const total = await PaymentsService.getTotalPrizePool();
      res.json({ success: true, data: { totalPrizePoolCents: total } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}