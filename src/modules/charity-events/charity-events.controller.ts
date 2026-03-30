import { Request, Response } from "express";
import { CharityEventsService } from "./charity-events.service";
import { AuthRequest } from "../../common/types";

export class CharityEventsController {
  static async getByCharity(req: Request, res: Response): Promise<void> {
    try {
      const events = await CharityEventsService.getByCharity(req.params.charityId);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const events = await CharityEventsService.getUpcoming();
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const event = await CharityEventsService.create(req.body);
      res.status(201).json({ success: true, message: "Event created", data: event });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const event = await CharityEventsService.update(req.params.id, req.body);
      res.json({ success: true, message: "Event updated", data: event });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await CharityEventsService.delete(req.params.id);
      res.json({ success: true, message: "Event deleted" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}