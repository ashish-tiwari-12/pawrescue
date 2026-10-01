import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel, IUserDocument } from "../models/User.js";
import { UserRole } from "../types.js";
import { ENV } from "../config/env.js";
import { logSecurityEvent } from "../services/securityLogger.js";

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  ngoId?: string;
  tokenType?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

/**
 * 1. Authenticate Access Token Middleware
 */
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logSecurityEvent({
      eventType: "UNAUTHORIZED_ACCESS",
      ip: req.ip,
      resource: req.originalUrl,
      details: "Missing Bearer authorization header"
    });
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token.trim().length === 0) {
    return res.status(401).json({ error: "Access denied. Empty token provided." });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid token payload." });
    }

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      logSecurityEvent({
        eventType: "UNAUTHORIZED_ACCESS",
        ip: req.ip,
        resource: req.originalUrl,
        details: `Token valid but user ${decoded.id} no longer exists in database`
      });
      return res.status(401).json({ error: "User session invalid or user not found." });
    }

    req.user = user;
    next();
  } catch (err: any) {
    logSecurityEvent({
      eventType: "AUTH_FAILED",
      ip: req.ip,
      resource: req.originalUrl,
      details: `JWT Verification Failed: ${err.message}`
    });

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired. Please log in again.", code: "TOKEN_EXPIRED" });
    }

    return res.status(401).json({ error: "Invalid or tampered authentication token.", code: "INVALID_TOKEN" });
  }
};

/**
 * 2. Optional Auth Middleware (Attaches user if valid token present, otherwise proceeds)
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
        if (decoded && decoded.id) {
          const user = await UserModel.findById(decoded.id);
          if (user) {
            req.user = user;
          }
        }
      } catch {
        // Ignore invalid optional token, continue as guest
      }
    }
  }
  next();
};

/**
 * 3. Role-Based Access Control (RBAC) Guard
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        eventType: "FORBIDDEN_RESOURCE",
        ip: req.ip,
        userId: req.user._id.toString(),
        email: req.user.email,
        resource: req.originalUrl,
        details: `User role '${req.user.role}' attempted to access endpoint restricted to: [${allowedRoles.join(", ")}]`
      });
      return res.status(403).json({
        error: `Forbidden. You do not have the required permissions (${allowedRoles.join(" or ")} required).`
      });
    }

    next();
  };
};

/**
 * 4. Generate Access Token (Standard JWT signed with ENV.JWT_SECRET)
 */
export const generateToken = (user: IUserDocument | any): string => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      ngoId: user.ngoId,
      tokenType: "access"
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );
};

/**
 * 5. Generate Refresh Token
 */
export const generateRefreshToken = (user: IUserDocument | any): string => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      id: userId,
      tokenType: "refresh"
    },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any }
  );
};
