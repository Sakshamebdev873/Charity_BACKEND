import { Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { AuthRequest } from "../types";

export const requireSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role === "ADMIN") {
      next();
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      res.status(403).json({
        success: false,
        message: "Active subscription required",
      });
      return;
    }

    if (new Date() > subscription.currentPeriodEnd) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "LAPSED" },
      });
      res.status(403).json({
        success: false,
        message: "Subscription has lapsed. Please renew.",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Subscription check failed" });
  }
};