import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/umurava-screening",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  maxFileSize: 10 * 1024 * 1024, // 10MB
};
