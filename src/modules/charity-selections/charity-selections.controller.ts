import { Response } from "express";
import { CharitySelectionsService } from "./charity-selections.service";
import { AuthRequest } from "../../common/types";

export class CharitySelectionsController {
  static async select(req: AuthRequest, res: Response): Promise<void> {
    try {
      const selection = await CharitySelectionsService.select(req.user!.userId, req.body);
      res.json({ success: true, message: "Charity selected", data: selection });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const selection = await CharitySelectionsService.getMine(req.user!.userId);
      res.json({ success: true, data: selection });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}