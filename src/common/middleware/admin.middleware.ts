import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }
  next();
};