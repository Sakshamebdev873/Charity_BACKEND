import { Response } from "express";
import { WinnersService } from "./winners.service";
import { AuthRequest } from "../../common/types";

export class WinnersController {
  // Subscriber
  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await WinnersService.getByUser(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async uploadProof(req: AuthRequest, res: Response): Promise<void> {
    try {
      const winner = await WinnersService.uploadProof(
        req.params.id,
        req.user!.userId,
        req.body.proofImageUrl
      );
      res.json({ success: true, message: "Proof uploaded", data: winner });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Admin
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20", status } = req.query as any;
      const result = await WinnersService.getAll(+page, +limit, status);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByDraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      const winners = await WinnersService.getByDraw(req.params.drawId);
      res.json({ success: true, data: winners });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async verify(req: AuthRequest, res: Response): Promise<void> {
    try {
      const winner = await WinnersService.verify(req.params.id, req.body);
      res.json({ success: true, message: "Winner verification updated", data: winner });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updatePayout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const winner = await WinnersService.updatePayout(req.params.id, req.body);
      res.json({ success: true, message: "Payout status updated", data: winner });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}