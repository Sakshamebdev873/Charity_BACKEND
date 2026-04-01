import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthRequest } from "../../common/types";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: { user: result.user },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Registration failed" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      // Special handling for unverified email
      if (error.message === "EMAIL_NOT_VERIFIED") {
        res.status(403).json({
          success: false,
          message: "EMAIL_NOT_VERIFIED",
          data: { email: req.body.email },
        });
        return;
      }
      res.status(401).json({ success: false, message: error.message || "Login failed" });
    }
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) { res.status(400).json({ success: false, message: "Token is required" }); return; }
      const result = await AuthService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) { res.status(400).json({ success: false, message: "Email is required" }); return; }
      const result = await AuthService.resendVerification(email);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.status(200).json({ success: true, message: "Profile fetched", data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}