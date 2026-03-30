import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(env.PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}\n`);
      console.log("── Available Routes ──────────────────────────");
      console.log("  POST   /api/auth/register");
      console.log("  POST   /api/auth/login");
      console.log("  GET    /api/auth/profile");
      console.log("  GET    /api/users/me");
      console.log("  PATCH  /api/users/me");
      console.log("  POST   /api/subscriptions");
      console.log("  GET    /api/subscriptions/me");
      console.log("  POST   /api/subscriptions/me/cancel");
      console.log("  POST   /api/scores");
      console.log("  GET    /api/scores/me");
      console.log("  GET    /api/draws/published");
      console.log("  POST   /api/draw-entries");
      console.log("  GET    /api/draw-entries/me");
      console.log("  GET    /api/charities");
      console.log("  GET    /api/charities/featured");
      console.log("  GET    /api/charity-events/upcoming");
      console.log("  POST   /api/charity-selections");
      console.log("  POST   /api/donations");
      console.log("  GET    /api/winners/me");
      console.log("  GET    /api/notifications/me");
      console.log("  GET    /api/admin/dashboard");
      console.log("  GET    /api/admin/reports");
      console.log("──────────────────────────────────────────────\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();