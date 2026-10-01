import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Fallback development key with high entropy; warn in production if not set
const DEFAULT_JWT_SECRET = "pawconnect_dev_secret_jwt_key_2026_entropy_98432176435";
const DEFAULT_REFRESH_SECRET = "pawconnect_dev_refresh_jwt_key_2026_entropy_5129481723";

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.warn(
    "⚠️ [SECURITY WARNING]: JWT_SECRET in production is missing or shorter than 32 characters. Please set a strong JWT_SECRET."
  );
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: isProduction,
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pawrescue",
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  BCRYPT_SALT_ROUNDS: 12, // OWASP requirement: minimum 12 salt rounds
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLODINARY_CLOUD_NAME || "",
    API_KEY: process.env.CLOUDINARY_API_KEY || process.env.CLODINARY_API_KEY || "",
    API_SECRET: process.env.CLOUDINARY_API_SECRET || process.env.CLODINARY_API_SECRET_KEY || ""
  },
  EMAIL: {
    USER: process.env.EMAIL_USER || "",
    PASS: process.env.EMAIL_PASS || ""
  },
  ALLOWED_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://pawrescue-nine.vercel.app",
        "https://pawrescue.vercel.app",
        "https://pawconnect-india.vercel.app"
      ]
};
