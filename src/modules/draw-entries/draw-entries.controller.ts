import { Response } from "express";
import { DrawEntriesService } from "./draw-entries.service";
import { AuthRequest } from "../../common/types";

export class DrawEntriesController {
  static async enter(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entry = await DrawEntriesService.enter(req.user!.userId, req.body.drawId);
      res.status(201).json({ success: true, message: "Entered draw successfully", data: entry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyEntries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entries = await DrawEntriesService.getMyEntries(req.user!.userId);
      res.json({ success: true, data: entries });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin
  static async getByDraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entries = await DrawEntriesService.getEntriesByDraw(req.params.drawId);
      res.json({ success: true, data: entries });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}