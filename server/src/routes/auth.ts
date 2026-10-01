import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import {
  generateToken,
  generateRefreshToken,
  authenticateJWT,
  AuthRequest
} from "../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { UserRole } from "../types.js";
import { ENV } from "../config/env.js";
import { logSecurityEvent } from "../services/securityLogger.js";
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  otpRateLimiter
} from "../middleware/security.js";
import {
  validateRequest,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema
} from "../middleware/validation.js";

const router = Router();

// Helper to generate cryptographically secure 6-digit numeric OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Register new user (Rate limited, Zod validated, 12 salt rounds, Sends Email Verification OTP)
router.post(
  "/register",
  registerRateLimiter,
  validateRequest(RegisterSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password, role = "citizen", ngoId, avatarUrl } = req.body;

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      // Enforce bcrypt with minimum 12 salt rounds
      const salt = await bcrypt.genSalt(ENV.BCRYPT_SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);

      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      const newUser = await UserModel.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password: hashedPassword,
        role: (role as UserRole) || "citizen",
        ngoId: role === "ngo_admin" ? (ngoId || "ngo-1") : undefined,
        avatarUrl:
          avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpiry: otpExpiry
      });

      // Send verification email in background
      sendVerificationEmail(normalizedEmail, name, otp).catch((err) => {
        console.warn("Notice: Failed to send verification email:", err.message);
      });

      logSecurityEvent({
        eventType: "AUTH_SUCCESS",
        ip: req.ip,
        userId: newUser._id.toString(),
        email: normalizedEmail,
        details: `New account registered as '${newUser.role}'`
      });

      return res.status(201).json({
        message: "Registration initiated! A 6-digit verification code has been sent to your email.",
        requiresVerification: true,
        email: normalizedEmail,
        user: newUser.toJSON()
      });
    } catch (error: any) {
      console.error("Register Error:", error);
      return res.status(500).json({ error: "Failed to register user." });
    }
  }
);

// 2. Verify Email with 6-digit OTP
router.post(
  "/verify-email",
  otpRateLimiter,
  validateRequest(VerifyEmailSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: "No account found with this email." });
      }

      if (user.isVerified) {
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        return res.json({
          message: "Account is already verified.",
          token,
          refreshToken,
          user: user.toJSON()
        });
      }

      if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
        logSecurityEvent({
          eventType: "AUTH_FAILED",
          ip: req.ip,
          email: normalizedEmail,
          details: "Invalid email verification OTP attempt"
        });
        return res.status(400).json({ error: "Invalid verification code. Please check your email." });
      }

      if (user.verificationOtpExpiry && user.verificationOtpExpiry < new Date()) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }

      user.isVerified = true;
      user.verificationOtp = undefined;
      user.verificationOtpExpiry = undefined;
      await user.save();

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logSecurityEvent({
        eventType: "AUTH_SUCCESS",
        ip: req.ip,
        userId: user._id.toString(),
        email: normalizedEmail,
        details: "Email successfully verified"
      });

      return res.json({
        message: "🎉 Email verified successfully! Your account is now active.",
        token,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error: any) {
      console.error("Verify Email Error:", error);
      return res.status(500).json({ error: "Failed to verify email." });
    }
  }
);

// 3. Resend Email Verification OTP
router.post(
  "/resend-verification",
  otpRateLimiter,
  validateRequest(ForgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.isVerified) {
        return res.json({ message: "This email is already verified. You can log in directly." });
      }

      const otp = generateOtp();
      user.verificationOtp = otp;
      user.verificationOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      sendVerificationEmail(normalizedEmail, user.name, otp).catch(() => {});

      return res.json({
        message: `A fresh 6-digit verification code has been sent to ${normalizedEmail}.`
      });
    } catch (error: any) {
      console.error("Resend Verification Error:", error);
      return res.status(500).json({ error: "Failed to resend verification code." });
    }
  }
);

// 4. Login (Rate limited, Zod validated, bcrypt password check)
router.post(
  "/login",
  loginRateLimiter,
  validateRequest(LoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });

      if (!user || !user.password) {
        logSecurityEvent({
          eventType: "AUTH_FAILED",
          ip: req.ip,
          email: normalizedEmail,
          details: "Login attempt with non-existent user"
        });
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logSecurityEvent({
          eventType: "AUTH_FAILED",
          ip: req.ip,
          userId: user._id.toString(),
          email: normalizedEmail,
          details: "Invalid password attempt"
        });
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Optional Role check
      if (role && user.role !== role) {
        logSecurityEvent({
          eventType: "PRIVILEGE_ESCALATION_BLOCKED",
          ip: req.ip,
          userId: user._id.toString(),
          email: normalizedEmail,
          details: `Role mismatch: User role '${user.role}' tried logging in as '${role}'`
        });
        return res.status(403).json({
          error: `Account is registered as '${user.role}', not '${role}'. Please use the correct portal.`
        });
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logSecurityEvent({
        eventType: "AUTH_SUCCESS",
        ip: req.ip,
        userId: user._id.toString(),
        email: normalizedEmail,
        details: `Successful login as '${user.role}'`
      });

      return res.json({
        message: "Login successful!",
        token,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      return res.status(500).json({ error: "Failed to log in." });
    }
  }
);

// 5. 1-Click Demo Login
router.post("/demo-login", loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { role = "citizen" } = req.body;

    let email = "aarav@pawconnect.in";
    if (role === "ngo_admin") {
      email = "admin@voiceforstrays.org";
    } else if (role === "volunteer") {
      email = "rahul.rescuer@gmail.com";
    }

    let demoUser = await UserModel.findOne({ email });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(ENV.BCRYPT_SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash("password123", salt);
      demoUser = await UserModel.create({
        name: role === "ngo_admin" ? "Dr. Ananya Iyer" : "Aarav Mehta",
        email,
        phone: "+91 98200 44556",
        password: hashedPassword,
        role: (role as UserRole) || "citizen",
        isVerified: true,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`
      });
    }

    const token = generateToken(demoUser);
    const refreshToken = generateRefreshToken(demoUser);

    return res.json({
      message: `Logged in as Demo ${demoUser.role}!`,
      token,
      refreshToken,
      user: demoUser.toJSON()
    });
  } catch (error: any) {
    console.error("Demo Login Error:", error);
    return res.status(500).json({ error: "Failed to perform demo login." });
  }
});

// 6. Forgot Password (Rate limited, Sends 6-Digit Password Reset OTP via Nodemailer)
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validateRequest(ForgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });

      logSecurityEvent({
        eventType: "PASSWORD_RESET_REQUEST",
        ip: req.ip,
        email: normalizedEmail,
        details: "Password reset request initiated"
      });

      if (!user) {
        // Return generic message for security (prevents user enumeration)
        return res.json({
          message: "If an account exists with this email, a 6-digit password reset code has been sent."
        });
      }

      const resetOtp = generateOtp();
      user.resetPasswordOtp = resetOtp;
      user.resetPasswordOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await user.save();

      sendPasswordResetEmail(normalizedEmail, user.name, resetOtp).catch((err) => {
        console.warn("Could not send password reset email:", err.message);
      });

      return res.json({
        message: `A 6-digit password reset code has been sent to ${normalizedEmail}.`
      });
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      return res.status(500).json({ error: "Failed to process forgot password request." });
    }
  }
);

// 7. Reset Password (Rate limited, Zod validated, 12 salt rounds)
router.post(
  "/reset-password",
  passwordResetRateLimiter,
  validateRequest(ResetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: "No account found with this email." });
      }

      if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
        logSecurityEvent({
          eventType: "AUTH_FAILED",
          ip: req.ip,
          userId: user._id.toString(),
          email: normalizedEmail,
          details: "Invalid password reset OTP provided"
        });
        return res.status(400).json({ error: "Invalid password reset code. Please check your email." });
      }

      if (user.resetPasswordOtpExpiry && user.resetPasswordOtpExpiry < new Date()) {
        return res.status(400).json({ error: "Password reset code has expired. Please request a new one." });
      }

      const salt = await bcrypt.genSalt(ENV.BCRYPT_SALT_ROUNDS);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpiry = undefined;
      user.isVerified = true;
      await user.save();

      logSecurityEvent({
        eventType: "PASSWORD_RESET_SUCCESS",
        ip: req.ip,
        userId: user._id.toString(),
        email: normalizedEmail,
        details: "Password successfully reset"
      });

      return res.json({
        message: "🔐 Password reset successfully! You can now log in with your new password."
      });
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      return res.status(500).json({ error: "Failed to reset password." });
    }
  }
);

// 8. Current User Profile
router.get("/me", authenticateJWT, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: req.user.toJSON() });
});

// 9. Update Profile & Avatar (Authenticated, Sanitized)
router.put("/profile", authenticateJWT, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { name, phone, avatarUrl } = req.body;
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name && typeof name === "string") user.name = name.trim().slice(0, 100);
    if (phone && typeof phone === "string") user.phone = phone.trim().slice(0, 20);
    if (avatarUrl && typeof avatarUrl === "string") user.avatarUrl = avatarUrl.trim().slice(0, 500);

    await user.save();

    return res.json({
      message: "Profile updated successfully!",
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

export default router;
