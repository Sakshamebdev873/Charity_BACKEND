import { Response } from "express";
import { DonationsService } from "./donations.service";
import { AuthRequest } from "../../common/types";

export class DonationsController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const donation = await DonationsService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, message: "Donation recorded", data: donation });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await DonationsService.getByUser(req.user!.userId, +page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await DonationsService.getAll(+page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}