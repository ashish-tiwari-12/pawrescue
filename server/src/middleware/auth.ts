import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel, IUserDocument } from "../models/User.js";
import { UserRole } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "pawconnect_secret_key_2026_secure";

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User session invalid or user not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
      const user = await UserModel.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // ignore invalid optional token
    }
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Requires one of roles: ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
};

export const generateToken = (user: IUserDocument): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      ngoId: user.ngoId
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};
