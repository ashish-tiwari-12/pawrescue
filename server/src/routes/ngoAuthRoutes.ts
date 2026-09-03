import { Router } from "express";
import {
  login,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  demoLogin
} from "../controllers/ngoAuthController.js";
import { requireNGOAuth } from "../middleware/ngoAuthMiddleware.js";

const router = Router();

// Public NGO Auth Endpoints
router.post("/login", login);
router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/demo-login", demoLogin);

// Protected NGO Auth Endpoints
router.get("/me", requireNGOAuth, getProfile);
router.get("/profile", requireNGOAuth, getProfile);
router.put("/profile", requireNGOAuth, updateProfile);

export default router;
