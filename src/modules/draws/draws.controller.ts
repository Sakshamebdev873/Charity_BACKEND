import { Response } from "express";
import { DrawsService } from "./draws.service";
import { AuthRequest } from "../../common/types";

export class DrawsController {
  static async getPublished(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draws = await DrawsService.getPublished();
      res.json({ success: true, data: draws });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draws = await DrawsService.getAll();
      res.json({ success: true, data: draws });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draw = await DrawsService.getById(req.params.id);
      if (!draw) { res.status(404).json({ success: false, message: "Draw not found" }); return; }
      res.json({ success: true, data: draw });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draw = await DrawsService.create(req.body);
      res.status(201).json({ success: true, message: "Draw created", data: draw });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draw = await DrawsService.update(req.params.id, req.body);
      res.json({ success: true, message: "Draw updated", data: draw });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async simulate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sim = await DrawsService.simulate(req.params.id);
      res.json({ success: true, message: "Simulation complete", data: sim });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async execute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const draw = await DrawsService.executeDraw(req.params.id);
      res.json({ success: true, message: "Draw executed and published", data: draw });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}