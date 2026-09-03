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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.resolve("uploads")));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/ngo/auth", ngoAuthRouter);
app.use("/api/ngos/auth", ngoAuthRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/volunteers", volunteersRouter);
app.use("/api/ngos", ngosRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
// Lazy DB connection middleware for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error("DB connection error in request middleware:", err);
  }
  next();
});

// API Routes
app.use("/api/dogs", dogsRouter);
app.use("/api/gov-analytics", govAnalyticsRouter);
app.use("/api/geospatial", geospatialRouter);

// Root & Health Check
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "🐾 PawConnect India Backend API is online!",
    endpoints: [
      "/api/auth",
      "/api/complaints",
      "/api/ngos",
      "/api/dogs",
      "/api/geospatial",
      "/api/gov-analytics"
    ],
    version: "2.1.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "PawConnect India API (MongoDB Atlas)",
    database: "pawrescue",
    version: "2.1.0",
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Error Handler:", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// Connect to MongoDB Atlas & Start Server
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  connectDatabase().then(() => {
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
  connectDatabase().catch(console.error);
}

export { app, server };
export default app;
