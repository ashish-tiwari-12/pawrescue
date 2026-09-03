import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel, IUserDocument } from "../models/User.js";
import { NGOModel, INGODocument } from "../models/NGO.js";

const JWT_SECRET = process.env.JWT_SECRET || "pawconnect_secret_jwt_key_2026";

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
    const decoded = jwt.verify(token, JWT_SECRET) as {
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
    console.error("NGO Auth Middleware Error:", error.message);
    return res.status(401).json({ error: "Unauthorized access: " + (error.message || "Invalid token") });
  }
};
