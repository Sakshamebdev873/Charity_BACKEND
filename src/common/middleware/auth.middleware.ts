import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AuthRequest, AuthPayload } from "../types";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.token;

    if (!token) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};