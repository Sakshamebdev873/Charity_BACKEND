import { Response } from "express";
import { SubscriptionsService } from "./subscriptions.service";
import { AuthRequest } from "../../common/types";

export class SubscriptionsController {
  // Creates Stripe Checkout — returns redirect URL
  static async createCheckout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await SubscriptionsService.createCheckoutSession(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Called after successful Stripe redirect
  static async confirmCheckout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      if (!sessionId) { res.status(400).json({ success: false, message: "Session ID required" }); return; }
      const sub = await SubscriptionsService.activateFromCheckout(sessionId);
      res.json({ success: true, message: "Subscription activated", data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sub = await SubscriptionsService.getByUserId(req.user!.userId);
      res.json({ success: true, data: sub });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sub = await SubscriptionsService.cancel(req.user!.userId);
      res.json({ success: true, message: "Subscription cancelled", data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sub = await SubscriptionsService.update(req.user!.userId, req.body);
      res.json({ success: true, message: "Subscription updated", data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "20" } = req.query as any;
      const result = await SubscriptionsService.getAll(+page, +limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async adminUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sub = await SubscriptionsService.adminUpdate(req.params.userId, req.body);
      res.json({ success: true, message: "Updated by admin", data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}