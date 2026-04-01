import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
// Route imports
import uploadsRoutes from "./modules/uploads/uploads.route";
import authRoutes from "./modules/auth/auth.route";
import usersRoutes from "./modules/users/users.route";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.route";
import paymentsRoutes from "./modules/payments/payments.route";
import scoresRoutes from "./modules/scores/scores.route";
import drawsRoutes from "./modules/draws/draws.route";
import drawEntriesRoutes from "./modules/draw-entries/draw-entries.route";
import drawSimulationsRoutes from "./modules/draw-simulations/draw-simulations.route";
import charitiesRoutes from "./modules/charities/charities.route";
import charityEventsRoutes from "./modules/charity-events/charity-events.route";
import charitySelectionsRoutes from "./modules/charity-selections/charity-selections.route";
import donationsRoutes from "./modules/donations/donations.route";
import winnersRoutes from "./modules/winners/winners.route";
import notificationsRoutes from "./modules/notifications/notifications.route";
import platformConfigRoutes from "./modules/platform-config/platform-config.route";
import adminRoutes from "./modules/admin/admin.route";
import stripeWebhookRoutes from "./modules/subscriptions/stripe-webhook.route";
const app = express();

// ── Global Middleware ──
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRoutes);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// ── Health Check ──
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Golf Charity Platform API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});
// ── API Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/scores", scoresRoutes);
app.use("/api/draws", drawsRoutes);
app.use("/api/draw-entries", drawEntriesRoutes);
app.use("/api/draw-simulations", drawSimulationsRoutes);
app.use("/api/charities", charitiesRoutes);
app.use("/api/charity-events", charityEventsRoutes);
app.use("/api/charity-selections", charitySelectionsRoutes);
app.use("/api/donations", donationsRoutes);
app.use("/api/winners", winnersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/platform-config", platformConfigRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadsRoutes);
// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;