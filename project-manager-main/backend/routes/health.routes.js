import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get("/", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      service: "Catalyst API",
      version: "1.0.0",
      checks: {
        database: "checking...",
        memory: "checking...",
      },
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.checks.database = "connected";
    } else {
      healthCheck.checks.database = "disconnected";
      healthCheck.status = "DEGRADED";
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    healthCheck.checks.memory = {
      status: "OK",
      usage: memoryUsageMB,
      unit: "MB",
    };

    // If database is disconnected, return 503
    if (healthCheck.status === "DEGRADED") {
      return res.status(503).json(healthCheck);
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Readiness check endpoint
 * GET /health/ready
 */
router.get("/ready", async (req, res) => {
  try {
    // Check if database is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "NOT_READY",
        message: "Database not connected",
      });
    }

    res.status(200).json({
      status: "READY",
      message: "Service is ready to accept requests",
    });
  } catch (error) {
    res.status(503).json({
      status: "NOT_READY",
      error: error.message,
    });
  }
});

/**
 * Liveness check endpoint
 * GET /health/live
 */
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "ALIVE",
    timestamp: new Date().toISOString(),
  });
});

export default router;
