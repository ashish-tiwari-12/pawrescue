import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel, IUserDocument } from "../models/User.js";
import { NGOModel, INGODocument } from "../models/NGO.js";
import { ENV } from "../config/env.js";
import { logSecurityEvent } from "../services/securityLogger.js";

export interface NGOAuthRequest extends Request {
  user?: IUserDocument;
  ngo?: INGODocument;
}

/**
 * Middleware to protect routes that require authenticated NGO Admin or Volunteer
 */
export const requireNGOAuth = async (
  req: NGOAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. NGO authentication token missing." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. Empty token provided." });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      ngoId?: string;
    };

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid or expired authentication token." });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User account associated with token not found." });
    }

    if (user.role !== "ngo_admin" && user.role !== "volunteer") {
      logSecurityEvent({
        eventType: "FORBIDDEN_RESOURCE",
        ip: req.ip,
        userId: user._id.toString(),
        email: user.email,
        resource: req.originalUrl,
        details: `Non-NGO user role '${user.role}' attempted to access NGO portal`
      });
      return res.status(403).json({ error: "Access restricted. NGO privileges required." });
    }

    req.user = user;

    // Attach NGO document if user has an associated ngoId
    if (user.ngoId) {
      const ngo = await NGOModel.findById(user.ngoId);
      if (ngo) {
        req.ngo = ngo;
      }
    }

    next();
  } catch (error: any) {
    logSecurityEvent({
      eventType: "AUTH_FAILED",
      ip: req.ip,
      resource: req.originalUrl,
      details: `NGO Token Error: ${error.message}`
    });
    return res.status(401).json({ error: "Unauthorized access: " + (error.message || "Invalid token") });
  }
};
