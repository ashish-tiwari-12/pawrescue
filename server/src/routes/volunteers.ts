import { Router, Request, Response } from "express";
import { VolunteerModel } from "../models/Volunteer.js";
import { NGOModel } from "../models/NGO.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.js";
import { sanitizeText } from "../middleware/security.js";

const router = Router();

// Get volunteers list from MongoDB
router.get("/", async (req: Request, res: Response) => {
  try {
    const { ngoId } = req.query;
    const query: any = {};
    if (ngoId && typeof ngoId === "string") query.ngoId = ngoId.trim();

    const volunteers = await VolunteerModel.find(query).sort({ createdAt: -1 });
    return res.json({ volunteers: volunteers.map((v) => v.toJSON()) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get volunteers." });
  }
});

// Get single volunteer
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let volunteer = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      volunteer = await VolunteerModel.findById(id);
    }
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found." });
    }
    return res.json({ volunteer: volunteer.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get volunteer." });
  }
});

// Create new volunteer (Requires NGO Admin)
router.post(
  "/",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, phone, ngoId, skills = [], availability = "Available" } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: "Name, email, and phone are required." });
      }

      let ngo = null;
      const targetNgoId = req.user?.ngoId || ngoId;
      if (targetNgoId) {
        ngo = await NGOModel.findById(targetNgoId);
      }
      if (!ngo) {
        ngo = await NGOModel.findOne();
      }

      const parsedSkills = Array.isArray(skills)
        ? skills.map((s) => sanitizeText(String(s)))
        : [sanitizeText(String(skills))];

      const newVolunteer = await VolunteerModel.create({
        name: sanitizeText(name),
        email: email.trim().toLowerCase(),
        phone: phone.trim().slice(0, 20),
        ngoId: ngo ? ngo._id.toString() : "ngo-1",
        ngoName: ngo ? ngo.name : "Voice for Stray Animals (VSA)",
        skills: parsedSkills,
        availability: ["Available", "On Mission", "Busy", "Inactive"].includes(availability)
          ? availability
          : "Available",
        assignedComplaintsCount: 0,
        completedRescuesCount: 0,
        avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}`
      });

      return res.status(201).json({
        message: "Volunteer added successfully to MongoDB!",
        volunteer: newVolunteer.toJSON()
      });
    } catch (error: any) {
      console.error("Create Volunteer Error:", error);
      return res.status(500).json({ error: "Failed to add volunteer." });
    }
  }
);

// Update volunteer availability / details (Requires NGO Admin)
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid volunteer ID format." });
      }

      const { name, phone, email, skills, availability } = req.body;
      const updates: any = {};
      if (name) updates.name = sanitizeText(name);
      if (phone) updates.phone = phone.trim().slice(0, 20);
      if (email) updates.email = email.trim().toLowerCase();
      if (skills && Array.isArray(skills)) updates.skills = skills.map((s) => sanitizeText(s));
      if (availability) updates.availability = sanitizeText(availability);

      const updated = await VolunteerModel.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) {
        return res.status(404).json({ error: "Volunteer not found." });
      }

      return res.json({
        message: "Volunteer updated successfully in MongoDB.",
        volunteer: updated.toJSON()
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to update volunteer." });
    }
  }
);

export default router;
