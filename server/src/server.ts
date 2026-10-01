import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import {
  securityHeaders,
  globalRateLimiter,
  noSqlSanitizationMiddleware,
  corsOptionsDelegate
} from "./middleware/security.js";
import { uploadDir } from "./middleware/upload.js";
import authRouter from "./routes/auth.js";
import complaintsRouter from "./routes/complaints.js";
import volunteersRouter from "./routes/volunteers.js";
import ngosRouter from "./routes/ngos.js";
import notificationsRouter from "./routes/notifications.js";
import analyticsRouter from "./routes/analytics.js";
import dogsRouter from "./routes/dogs.js";
import govAnalyticsRouter from "./routes/govAnalytics.js";
import geospatialRouter from "./routes/geospatial.js";
import ngoAuthRouter from "./routes/ngoAuthRoutes.js";
import { initSocket } from "./sockets/index.js";
import { validateAndSyncResolvedComplaints } from "./services/aiDogProfilingService.js";
import { logSecurityEvent } from "./services/securityLogger.js";

const app = express();
const server = http.createServer(app);
const PORT = ENV.PORT || 5000;

// Trust reverse proxy for accurate IP tracking & rate limiting (Vercel, Render, Nginx)
app.set("trust proxy", 1);

// Initialize Socket.io with Authentication & Room Authorization
initSocket(server);

// 1. HTTP Security Headers (Helmet CSP, HSTS, X-Frame-Options, NoSniff)
app.use(securityHeaders);

// 2. Controlled Cross-Origin Resource Sharing (CORS)
app.use(cors(corsOptionsDelegate));

// 3. Global Rate Limiter
app.use(globalRateLimiter);

// 4. Request Body Parsing (with strictly enforced body size limits)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// 5. NoSQL Injection Prevention Middleware (Strips $ and . query/body/param keys)
app.use(noSqlSanitizationMiddleware);

// 6. Serve uploaded images statically
app.use("/uploads", express.static(uploadDir));

// 7. Lazy DB connection middleware for all incoming requests (Serverless warm-start compatible)
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error("DB connection error in request middleware:", err);
  }
  next();
});

// Root & Health Check Endpoints
const healthHandler = (req: express.Request, res: Response | any) => {
  res.json({
    status: "healthy",
    platform: "PawConnect India API",
    securityStatus: "Hardened (OWASP compliant)",
    version: "2.1.0",
    serverTime: new Date().toISOString()
  });
};

app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "🐾 PawConnect India Backend API is online & secured!",
    endpoints: [
      "/api/auth",
      "/api/ngo/auth",
      "/api/complaints",
      "/api/ngos",
      "/api/dogs",
      "/api/geospatial",
      "/api/gov-analytics"
    ],
    version: "2.1.0"
  });
});

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/ngo/auth", ngoAuthRouter);
app.use("/api/ngos/auth", ngoAuthRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/volunteers", volunteersRouter);
app.use("/api/ngos", ngosRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/dogs", dogsRouter);
app.use("/api/gov-analytics", govAnalyticsRouter);
app.use("/api/geospatial", geospatialRouter);

// 8. 404 Route Handler for undefined endpoints
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: `Endpoint '${req.method} ${req.originalUrl}' not found.` });
});

// 9. Sanitized Global Error Handler (Never leaks stack traces or internal DB details to clients)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🛡️ [Server Error Handler]:", err.message || err);

  logSecurityEvent({
    eventType: "UNAUTHORIZED_ACCESS",
    ip: req.ip,
    resource: req.originalUrl,
    details: `Unhandled Error: ${err.message}`
  });

  // Check for Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Uploaded image file exceeds the maximum allowed size (10MB)." });
  }

  // Check for Multer file count error
  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ error: "Too many files uploaded in a single request (maximum 5 images)." });
  }

  // Check for CORS error
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS access denied. Origin not permitted." });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProd = ENV.IS_PRODUCTION;

  res.status(statusCode).json({
    error: isProd && statusCode === 500
      ? "An unexpected error occurred. Please try again later."
      : err.message || "Internal server error."
  });
});

// Connect to MongoDB Atlas & Start Server
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  connectDatabase()
    .then(() => {
      // Run validation check in background to ensure all resolved complaints have dog profiles
      validateAndSyncResolvedComplaints().catch((e) =>
        console.warn("[Dog Registry Startup Sync Warning]:", e.message)
      );

      server.listen(PORT, () => {
        console.log(`🚀 PawConnect India Server running on http://localhost:${PORT}`);
        console.log(`🗄️ Connected to MongoDB Atlas cluster 'pawrescue'`);
        console.log(`📡 Real-time Socket.io active on port ${PORT}`);
        console.log(`🛡️ OWASP Security Hardening active (Helmet, Rate Limiting, NoSQL & XSS Sanitization, RBAC)`);
      });
    })
    .catch((err) => {
      console.error("Database connection failed:", err);
    });
} else {
  // Ensure DB connects lazily in serverless environments
  connectDatabase()
    .then(() => {
      validateAndSyncResolvedComplaints().catch(() => {});
    })
    .catch(console.error);
}

export { app, server };
export default app;
