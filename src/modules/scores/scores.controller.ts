import { Response } from "express";
import { ScoresService } from "./scores.service";
import { AuthRequest } from "../../common/types";

export class ScoresController {
  static async addScore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const score = await ScoresService.addScore(req.user!.userId, req.body);
      res.status(201).json({ success: true, message: "Score added", data: score });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyScores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const scores = await ScoresService.getByUser(req.user!.userId);
      res.json({ success: true, data: scores });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateScore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const score = await ScoresService.updateScore(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, message: "Score updated", data: score });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Admin
  static async adminGetUserScores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const scores = await ScoresService.adminGetByUser(req.params.userId);
      res.json({ success: true, data: scores });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async adminUpdateScore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const score = await ScoresService.adminUpdateScore(req.params.id, req.body);
      res.json({ success: true, message: "Score updated by admin", data: score });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}