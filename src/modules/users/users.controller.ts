import { Response } from "express";
import { UsersService } from "./users.service";
import { AuthRequest } from "../../common/types";

export class UsersController {
  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UsersService.getById(req.user!.userId);
      if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UsersService.update(req.user!.userId, req.body);
      res.json({ success: true, message: "Profile updated", data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Admin endpoints
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20", search } = req.query as any;
      const result = await UsersService.getAll(+page, +limit, search);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UsersService.getById(req.params.id);
      if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async toggleActive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UsersService.toggleActive(req.params.id);
      res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}