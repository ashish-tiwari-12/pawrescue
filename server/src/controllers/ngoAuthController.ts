import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";
import { NGOModel } from "../models/NGO.js";
import { ComplaintModel } from "../models/Complaint.js";
import { NGOAuthRequest } from "../middleware/ngoAuthMiddleware.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "pawconnect_secret_jwt_key_2026";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ngoId: user.ngoId
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * 1. NGO Login (Admin or Volunteer)
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "No NGO account registered with this email." });
    }

    if (user.role !== "ngo_admin" && user.role !== "volunteer") {
      return res.status(403).json({ error: "Access denied. Account does not have NGO triage privileges." });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Invalid credentials or password not set." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }

    const token = generateToken(user);
    const userObj = user.toJSON();

    let ngo = null;
    if (user.ngoId) {
      ngo = await NGOModel.findById(user.ngoId);
    }
    if (!ngo) {
      ngo = await NGOModel.findOne();
    }

    return res.json({
      message: "NGO Authentication successful!",
      token,
      user: userObj,
      ngo
    });
  } catch (error: any) {
    console.error("NGO Login Controller Error:", error);
    return res.status(500).json({ error: "NGO login failed: " + error.message });
  }
};

/**
 * 2. NGO Registration (Creates both NGO entity and Admin User)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      name, // Admin Name
      email,
      phone,
      password,
      ngoName, // Shelter Name
      registrationNumber, // AWBI Registration Number
      city = "Delhi NCR",
      state = "Delhi",
      address,
      coverageRadiusKm = 15,
      servicesOffered = ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"]
    } = req.body;

    if (!name || !email || !phone || !password || !ngoName) {
      return res.status(400).json({ error: "Please fill in all mandatory NGO details." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    // 1. Create or Find NGO Entity
    const regNum = registrationNumber?.trim() || `AWBI-${Date.now().toString().slice(-6)}`;
    let ngo = await NGOModel.findOne({ registrationNumber: regNum });

    if (!ngo) {
      ngo = await NGOModel.create({
        name: ngoName.trim(),
        registrationNumber: regNum,
        email: normalizedEmail,
        phone: phone.trim(),
        address: address?.trim() || `${ngoName} Headquarters, ${city}`,
        city: city.trim(),
        state: state.trim(),
        pincodesCovered: ["110001", "201301", "122001"],
        location: {
          type: "Point",
          coordinates: [77.3426, 28.5482]
        },
        coverageRadiusKm: Number(coverageRadiusKm) || 15,
        servicesOffered,
        emergency24x7: true,
        activeVolunteersCount: 1,
        totalRescued: 0,
        verified: true
      });
    }

    // 2. Hash Password & Create NGO Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "ngo_admin",
      ngoId: ngo.id || ngo._id.toString(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry
    });

    // Send verification email
    sendVerificationEmail(normalizedEmail, name, otp).catch((err) => {
      console.warn("Could not send NGO verification email:", err);
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "NGO Organization and Admin Account registered successfully!",
      token,
      requiresVerification: true,
      email: normalizedEmail,
      user: newUser.toJSON(),
      ngo
    });
  } catch (error: any) {
    console.error("NGO Register Controller Error:", error);
    return res.status(500).json({ error: "NGO registration failed: " + error.message });
  }
};

/**
 * 3. Verify NGO Email OTP
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: "No NGO account found with this email." });
    }

    if (user.isVerified) {
      const token = generateToken(user);
      return res.json({ message: "Account is already verified.", token, user: user.toJSON() });
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
      message: "NGO Account verified successfully!",
      token,
      user: user.toJSON()
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to verify email: " + error.message });
  }
};

/**
 * 4. Forgot Password (Generates Reset OTP)
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "No NGO account registered with this email address." });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    sendPasswordResetEmail(normalizedEmail, user.name, otp).catch((err) => {
      console.warn("Could not send password reset email:", err);
    });

    return res.json({
      message: "Password reset OTP has been sent to your registered email address.",
      email: normalizedEmail
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Forgot password request failed: " + error.message });
  }
};

/**
 * 5. Reset Password (with OTP)
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid password reset code." });
    }

    if (user.resetPasswordOtpExpiry && user.resetPasswordOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Password reset code has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    const token = generateToken(user);
    return res.json({
      message: "Password has been successfully updated! You may now sign in.",
      token,
      user: user.toJSON()
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Password reset failed: " + error.message });
  }
};

/**
 * 6. Get NGO Profile & Metrics
 */
export const getProfile = async (req: NGOAuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    let ngo = req.ngo;
    if (!ngo && user.ngoId) {
      ngo = await NGOModel.findById(user.ngoId) || undefined;
    }
    if (!ngo) {
      ngo = await NGOModel.findOne() || undefined;
    }

    const ngoDocId = ngo ? (ngo as any)._id?.toString() || (ngo as any).id : undefined;

    const activeCasesCount = await ComplaintModel.countDocuments({
      status: { $in: ["Accepted", "In Progress"] },
      assignedNgoId: ngoDocId
    });

    return res.json({
      user: user.toJSON(),
      ngo,
      stats: {
        totalRescues: ngo?.totalRescued || 128,
        activeCases: activeCasesCount,
        activeVolunteers: ngo?.activeVolunteersCount || 8,
        operationalRadiusKm: ngo?.coverageRadiusKm || 15
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch NGO profile: " + error.message });
  }
};

/**
 * 7. Update NGO Profile & Operational Settings
 */
export const updateProfile = async (req: NGOAuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const {
      name, // Organization Name
      phone,
      email,
      address,
      city,
      state,
      pincodesCovered,
      coverageRadiusKm,
      servicesOffered,
      workingHours,
      emergency24x7
    } = req.body;

    let ngoId = user.ngoId || (req.ngo as any)?._id?.toString() || (req.ngo as any)?.id;
    let ngo = null;

    if (ngoId) {
      ngo = await NGOModel.findById(ngoId);
    }
    if (!ngo) {
      ngo = await NGOModel.findOne();
    }

    if (!ngo) {
      return res.status(404).json({ error: "NGO record not found to update." });
    }

    if (name) ngo.name = name.trim();
    if (phone) ngo.phone = phone.trim();
    if (email) ngo.email = email.trim();
    if (address) ngo.address = address.trim();
    if (city) ngo.city = city.trim();
    if (state) ngo.state = state.trim();
    if (pincodesCovered) ngo.pincodesCovered = pincodesCovered;
    if (coverageRadiusKm !== undefined) ngo.coverageRadiusKm = Number(coverageRadiusKm);
    if (servicesOffered) ngo.servicesOffered = servicesOffered;
    if (workingHours) ngo.workingHours = workingHours;
    if (emergency24x7 !== undefined) ngo.emergency24x7 = Boolean(emergency24x7);

    await ngo.save();

    return res.json({
      message: "NGO Profile & Operations updated successfully!",
      ngo
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update NGO profile: " + error.message });
  }
};

/**
 * 8. Quick 1-Click NGO Demo Login
 */
export const demoLogin = async (req: Request, res: Response) => {
  try {
    const { ngoId } = req.body;
    let ngo = null;

    if (ngoId) {
      ngo = await NGOModel.findById(ngoId);
    }
    if (!ngo) {
      ngo = await NGOModel.findOne();
    }

    if (!ngo) {
      ngo = await NGOModel.create({
        name: "Voice for Stray Animals (VSA)",
        registrationNumber: "DL-AWBI-2018-9482",
        email: "vsa.rescue@pawconnect.in",
        phone: "+91 98112 34567",
        address: "Plot 14, Institutional Area, Sector 32, Gurugram",
        city: "Gurugram",
        state: "Haryana",
        pincodesCovered: ["122001", "122002", "122003"],
        location: {
          type: "Point",
          coordinates: [77.0422, 28.4595]
        },
        coverageRadiusKm: 20,
        servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"],
        emergency24x7: true,
        activeVolunteersCount: 14,
        totalRescued: 342,
        verified: true
      });
    }

    const currentNgoId = (ngo as any)._id?.toString() || (ngo as any).id;
    let demoUser = await UserModel.findOne({ ngoId: currentNgoId });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("demo123", salt);
      demoUser = await UserModel.create({
        name: `Triage Officer (${ngo.name.split(" ")[0]})`,
        email: ngo.email,
        phone: ngo.phone,
        password: hashedPassword,
        role: "ngo_admin",
        ngoId: currentNgoId,
        isVerified: true
      });
    }

    const token = generateToken(demoUser);

    return res.json({
      message: `Logged in as Demo Admin for ${ngo.name}`,
      token,
      user: demoUser.toJSON(),
      ngo
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Demo login failed: " + error.message });
  }
};
