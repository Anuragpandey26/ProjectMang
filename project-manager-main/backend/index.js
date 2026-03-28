import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import http from "http";
import cookieParser from "cookie-parser";
import initializeSocket from "./services/socket.service.js";
import connectDB from "./db/connect.js";
import routes from "./routes/api.routes.js";
import { globalErrorHandler } from "./error-handlers/global.error-handler.js";
import { globalLimiter } from "./middleware/rate-limiter.middleware.js";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

// Redis, Queue & Worker imports
import redisService from "./services/redis.service.js";
import queueService from "./services/queue.service.js";
import cronService from "./services/cron.service.js";
import { startEmailWorker } from "./workers/email.worker.js";
import { startMaintenanceWorker } from "./workers/maintenance.worker.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Apply health-first security headers
app.use(helmet());

// Apply global rate limiter
app.use(globalLimiter);

// ─── Initialize Core Services ───────────────────────────────────────────
async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    connectDB();

    // 2. Try connecting to Redis (optional — app works without it)
    const redisAvailable = await redisService.connect();

    if (redisAvailable) {
      // 3. Initialize BullMQ queues & workers (only if Redis is up)
      queueService.init();
      startEmailWorker();
      startMaintenanceWorker();
    }

    // 4. Schedule cron jobs (BullMQ if Redis, node-cron if not)
    await cronService.init();

    // 5. Initialize WebSocket
    initializeSocket(server);

    console.log("----------------------------------------------------");
    console.log("  All services initialized successfully");
    if (!redisAvailable) {
      console.log("  [WARN] Running without Redis (using fallbacks)");
    }
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("[FATAL] Failed to initialize services:", error);
    process.exit(1);
  }
}

bootstrap();

// ─── Middleware Stack ───────────────────────────────────────────────────

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());
// Data Sanitization against XSS
app.use(xss());
app.use(cookieParser(process.env.COOKIE_SECRET));

const PORT = process.env.PORT || 5000;

// ─── Routes ─────────────────────────────────────────────────────────────

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Welcome to Catalyst API",
    tagline: "Accelerate Your Team's Productivity",
    version: "1.0.0",
    status: "running",
    redis: redisService.isAvailable() ? "connected" : "unavailable (using fallbacks)",
    endpoints: {
      health: "/api-v1/health",
      auth: "/api-v1/auth",
      workspaces: "/api-v1/workspaces",
      projects: "/api-v1/projects",
      tasks: "/api-v1/tasks",
      users: "/api-v1/users",
      chat: "/api-v1/chat",
    },
    documentation: "https://docs.catalyst.app",
  });
});

app.use("/api-v1", routes);

app.use(globalErrorHandler);

app.use((req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────

async function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  server.close(async () => {
    try {
      if (queueService.isEnabled()) {
        await queueService.closeAll();
      }
      await redisService.disconnect();
      console.log("[Shutdown] All connections closed. Goodbye!");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("[WARN] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Start Server ───────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[Server] Catalyst API running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api-v1/health`);
  console.log(`[Server] API docs: http://localhost:${PORT}/`);
});