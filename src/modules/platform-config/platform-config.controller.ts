import { Response } from "express";
import { PlatformConfigService } from "./platform-config.service";
import { AuthRequest } from "../../common/types";

export class PlatformConfigController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const configs = await PlatformConfigService.getAll();
      res.json({ success: true, data: configs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const config = await PlatformConfigService.getByKey(req.params.key);
      if (!config) { res.status(404).json({ success: false, message: "Config not found" }); return; }
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async upsert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const config = await PlatformConfigService.upsert(req.body);
      res.json({ success: true, message: "Config saved", data: config });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await PlatformConfigService.delete(req.params.key);
      res.json({ success: true, message: "Config deleted" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}