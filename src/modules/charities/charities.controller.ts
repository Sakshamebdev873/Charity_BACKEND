import { Request, Response } from "express";
import { CharitiesService } from "./charities.service";
import { AuthRequest } from "../../common/types";

export class CharitiesController {
  // Public
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, category } = req.query as any;
      const charities = await CharitiesService.getAll(search, category);
      res.json({ success: true, data: charities });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const charity = await CharitiesService.getBySlug(req.params.slug);
      if (!charity) { res.status(404).json({ success: false, message: "Charity not found" }); return; }
      res.json({ success: true, data: charity });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getFeatured(req: Request, res: Response): Promise<void> {
    try {
      const charities = await CharitiesService.getFeatured();
      res.json({ success: true, data: charities });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const charity = await CharitiesService.create(req.body);
      res.status(201).json({ success: true, message: "Charity created", data: charity });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const charity = await CharitiesService.update(req.params.id, req.body);
      res.json({ success: true, message: "Charity updated", data: charity });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await CharitiesService.delete(req.params.id);
      res.json({ success: true, message: "Charity deactivated" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async adminGetAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await CharitiesService.adminGetAll(+page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDonationTotals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const totals = await CharitiesService.getDonationTotals();
      res.json({ success: true, data: totals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}