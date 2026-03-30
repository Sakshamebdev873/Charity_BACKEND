import { Response } from "express";
import { DrawSimulationsService } from "./draw-simulations.service";
import { AuthRequest } from "../../common/types";

export class DrawSimulationsController {
  static async getByDraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sims = await DrawSimulationsService.getByDraw(req.params.drawId);
      res.json({ success: true, data: sims });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sim = await DrawSimulationsService.getById(req.params.id);
      if (!sim) { res.status(404).json({ success: false, message: "Simulation not found" }); return; }
      res.json({ success: true, data: sim });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await DrawSimulationsService.delete(req.params.id);
      res.json({ success: true, message: "Simulation deleted" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}