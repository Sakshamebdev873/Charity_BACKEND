import { Response } from "express";
import { AdminService } from "./admin.service";
import { AuthRequest } from "../../common/types";

export class AdminController {
  static async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dashboard = await AdminService.getDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reports = await AdminService.getReports();
      res.json({ success: true, data: reports });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}