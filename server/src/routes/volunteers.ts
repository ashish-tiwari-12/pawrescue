import { Router, Request, Response } from "express";
import { VolunteerModel } from "../models/Volunteer.js";
import { NGOModel } from "../models/NGO.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get volunteers list from MongoDB
router.get("/", async (req: Request, res: Response) => {
  try {
    const { ngoId } = req.query;
    const query: any = {};
    if (ngoId) query.ngoId = ngoId;

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
    const volunteer = await VolunteerModel.findById(id);
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found." });
    }
    return res.json({ volunteer: volunteer.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get volunteer." });
  }
});

// Create new volunteer (Saved to MongoDB)
router.post("/", authenticateJWT, requireRole(["ngo_admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, ngoId, skills = [], availability = "Available" } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required." });
    }

    let ngo = null;
    if (ngoId) {
      ngo = await NGOModel.findById(ngoId);
    }
    if (!ngo) {
      ngo = await NGOModel.findOne();
    }

    const newVolunteer = await VolunteerModel.create({
      name,
      email,
      phone,
      ngoId: ngo ? ngo._id.toString() : "ngo-1",
      ngoName: ngo ? ngo.name : "Voice for Stray Animals (VSA)",
      skills: Array.isArray(skills) ? skills : [skills],
      availability,
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
});

// Update volunteer availability / details
router.put("/:id", authenticateJWT, requireRole(["ngo_admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

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
});

export default router;
