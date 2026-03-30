import { Response } from "express";
import { NotificationsService } from "./notifications.service";
import { AuthRequest } from "../../common/types";

export class NotificationsController {
  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await NotificationsService.getByUser(req.user!.userId, +page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notif = await NotificationsService.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true, data: notif });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await NotificationsService.markAllAsRead(req.user!.userId);
      res.json({ success: true, message: `${result.count} notifications marked as read` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin — send to all
  static async notifyAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, body, type, metadata } = req.body;
      const result = await NotificationsService.notifyAllSubscribers(title, body, type, metadata);
      res.json({ success: true, message: `${result.count} notifications sent` });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}