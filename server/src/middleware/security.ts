import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import { ENV } from "../config/env.js";
import { logSecurityEvent } from "../services/securityLogger.js";

/**
 * 1. HTTP Security Headers with Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http:",
        "https://res.cloudinary.com",
        "https://images.unsplash.com",
        "https://api.dicebear.com",
        "https://tile.openstreetmap.org",
        "https://*.tile.openstreetmap.org"
      ],
      connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: ENV.IS_PRODUCTION ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Permissive for external map tiles & image CDNs
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "sameorigin" },
  hidePoweredBy: true,
  hsts: ENV.IS_PRODUCTION
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    : false,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

/**
 * 2. Rate Limiting Configurations
 */
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  name: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logSecurityEvent({
        eventType: "RATE_LIMIT_EXCEEDED",
        ip: req.ip || req.socket.remoteAddress,
        resource: req.originalUrl,
        details: `Rate limit hit for ${options.name} (${options.max} requests per ${options.windowMs / 1000}s)`
      });
      res.status(429).json({
        error: options.message,
        retryAfterSeconds: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Global API rate limiter (250 req / 15 min per IP)
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests to PawConnect API. Please slow down and try again later.",
  name: "Global API"
});

// Login Limiter: 5 requests / minute
export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please wait 60 seconds before trying again.",
  name: "Auth Login"
});

// Registration Limiter: 10 requests / hour
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts from this IP. Please try again in an hour.",
  name: "Auth Register"
});

// Password Reset Limiter: 3 requests / 15 minutes
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many password reset attempts. Please wait 15 minutes before requesting a new code.",
  name: "Password Reset"
});

// OTP Resend Limiter: 5 requests / 15 minutes
export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests. Please wait a few minutes.",
  name: "OTP Request"
});

// Complaint Submission Limiter: 20 complaints / hour per IP
export const complaintSubmitRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Complaint submission rate limit reached. Please wait before filing more reports.",
  name: "Complaint Submission"
});

// AI Validation & Detection Limiter: 30 requests / minute
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "AI Vision analysis rate limit reached. Please try again shortly.",
  name: "AI Vision"
});

/**
 * 3. NoSQL Injection Prevention Middleware (Strips $ and . keys from body, query, params)
 */
export const sanitizeNoSql = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeNoSql);
  }

  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with $ or containing . (MongoDB operator injections)
    if (key.startsWith("$") || key.includes(".")) {
      console.warn(`🛡️ [NoSQL Sanitize] Stripped potentially malicious key: '${key}'`);
      continue;
    }
    sanitized[key] = sanitizeNoSql(obj[key]);
  }
  return sanitized;
};

export const noSqlSanitizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeNoSql(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeNoSql(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeNoSql(req.params);
  }
  next();
};

/**
 * 4. Helper to Escape Regular Expressions in Queries (Prevents ReDoS & Regex Injections)
 */
export const escapeRegExp = (string: string): string => {
  if (!string || typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * 5. XSS Sanitization helper for User Text Content
 */
export const sanitizeText = (input?: string): string => {
  if (!input || typeof input !== "string") return "";
  return sanitizeHtml(input, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {}
  }).trim();
};

/**
 * 6. CORS Configuration Helper
 */
export const corsOptionsDelegate = (req: any, callback: any) => {
  const origin = req.header("Origin");
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  const isAllowed =
    ENV.ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  if (isAllowed) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
    });
  } else {
    logSecurityEvent({
      eventType: "UNAUTHORIZED_ACCESS",
      ip: req.ip,
      resource: req.originalUrl,
      details: `Blocked CORS request from unapproved origin: ${origin}`
    });
    callback(new Error("CORS origin access blocked by security policy."), { origin: false });
  }
};
