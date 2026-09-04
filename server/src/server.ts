import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { connectDatabase } from "./config/db.js";
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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import { uploadDir } from "./middleware/upload.js";

// Serve uploaded images statically
app.use("/uploads", express.static(uploadDir));

// Lazy DB connection middleware for all incoming requests (Serverless warm-start compatible)
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error("DB connection error in request middleware:", err);
  }
  next();
});

// Root & Health Check Endpoints
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: "healthy",
    platform: "PawConnect India API (MongoDB Atlas)",
    database: "pawrescue",
    version: "2.1.0",
    serverTime: new Date().toISOString()
  });
};

app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "🐾 PawConnect India Backend API is online!",
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

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Error Handler:", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// Connect to MongoDB Atlas & Start Server
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  connectDatabase().then(() => {
    // Run validation check in background to ensure all resolved complaints have dog profiles
    validateAndSyncResolvedComplaints().catch((e) =>
      console.warn("[Dog Registry Startup Sync Warning]:", e.message)
    );

    server.listen(PORT, () => {
      console.log(`🚀 PawConnect India Server running on http://localhost:${PORT}`);
      console.log(`🗄️ Connected to MongoDB Atlas cluster 'pawrescue'`);
      console.log(`📡 Real-time Socket.io active on port ${PORT}`);
    });
  }).catch((err) => {
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
