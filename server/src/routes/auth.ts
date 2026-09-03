import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import { generateToken, authenticateJWT, AuthRequest } from "../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { UserRole } from "../types.js";

const router = Router();

// Helper to generate 6-digit numeric OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Register new user (Sends Email Verification OTP via Nodemailer)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role = "citizen", ngoId, avatarUrl } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
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
      console.error("Failed to send verification email:", err);
    });

    return res.status(201).json({
      message: "Registration initiated! A 6-digit verification code has been sent to your email.",
      requiresVerification: true,
      email: normalizedEmail,
      user: newUser.toJSON()
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: "Failed to register user. " + error.message });
  }
});

// 2. Verify Email with 6-digit OTP
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and verification OTP are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    if (user.isVerified) {
      const token = generateToken(user);
      return res.json({
        message: "Account is already verified.",
        token,
        user: user.toJSON()
      });
    }

    if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
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

    return res.json({
      message: "🎉 Email verified successfully! Your account is now active.",
      token,
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error("Verify Email Error:", error);
    return res.status(500).json({ error: "Failed to verify email." });
  }
});

// 3. Resend Email Verification OTP
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please provide your email." });
    }

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

    await sendVerificationEmail(normalizedEmail, user.name, otp);

    return res.json({
      message: `A fresh 6-digit verification code has been sent to ${normalizedEmail}.`
    });
  } catch (error: any) {
    console.error("Resend Verification Error:", error);
    return res.status(500).json({ error: "Failed to resend verification code." });
  }
});

// 4. Login (Checks password & credentials)
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Optional Role check
    if (role && user.role !== role) {
      return res.status(403).json({
        error: `Account is registered as '${user.role}', not '${role}'. Please use the correct portal.`
      });
    }

    const token = generateToken(user);

    return res.json({
      message: "Login successful!",
      token,
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Failed to log in." });
  }
});

// 5. 1-Click Demo Login
router.post("/demo-login", async (req: Request, res: Response) => {
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
      const salt = await bcrypt.genSalt(10);
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

    return res.json({
      message: `Logged in as Demo ${demoUser.role}!`,
      token,
      user: demoUser.toJSON()
    });
  } catch (error: any) {
    console.error("Demo Login Error:", error);
    return res.status(500).json({ error: "Failed to perform demo login." });
  }
});

// 6. Forgot Password (Sends 6-Digit Password Reset OTP via Nodemailer)
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Please enter your email address." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      // Return general message for security
      return res.json({
        message: "If an account exists with this email, a 6-digit password reset code has been sent."
      });
    }

    const resetOtp = generateOtp();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await sendPasswordResetEmail(normalizedEmail, user.name, resetOtp);

    return res.json({
      message: `A 6-digit password reset code has been sent to ${normalizedEmail}.`
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: "Failed to process forgot password request." });
  }
});

// 7. Reset Password (Verifies OTP & updates password with bcrypt)
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid password reset code. Please check your email." });
    }

    if (user.resetPasswordOtpExpiry && user.resetPasswordOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Password reset code has expired. Please request a new one." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    user.isVerified = true; // Auto-verify if they successfully proved email ownership
    await user.save();

    return res.json({
      message: "🔐 Password reset successfully! You can now log in with your new password."
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Failed to reset password." });
  }
});

// 8. Current User Profile
router.get("/me", authenticateJWT, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: req.user.toJSON() });
});

// 9. Update Profile & Avatar
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

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;

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
