import express from "express";
import cors from "cors";
import { config } from "./config";
import { connectDB } from "./config/database";
import authRoutes from "./routes/auth";
import jobRoutes from "./routes/jobs";

const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbState,
    });
  } catch {
    res.status(500).json({ status: "error" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// Start server
const startServer = async () => {
  await connectDB();

  // Ensure uploads directory exists
  const fs = require("fs");
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads", { recursive: true });
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/api/health`);
  });
};

startServer().catch(console.error);

export default app;
