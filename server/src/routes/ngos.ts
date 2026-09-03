import { Router, Request, Response } from "express";
import { NGOModel } from "../models/NGO.js";
import { ComplaintModel } from "../models/Complaint.js";
import { VolunteerModel } from "../models/Volunteer.js";

const router = Router();

// List all NGOs from MongoDB
router.get("/", async (req: Request, res: Response) => {
  try {
    const ngos = await NGOModel.find().sort({ verified: -1, totalRescued: -1 });
    return res.json({ ngos: ngos.map((n) => n.toJSON()) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get NGOs." });
  }
});

// Get NGO details by ID + live stats from MongoDB
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ngo = await NGOModel.findById(id);
    if (!ngo) {
      return res.status(404).json({ error: "NGO not found." });
    }

    const [totalAssigned, pending, inProgress, resolved, volunteersCount] = await Promise.all([
      ComplaintModel.countDocuments({ ngoId: id }),
      ComplaintModel.countDocuments({ ngoId: id, status: { $in: ["Reported", "Accepted"] } }),
      ComplaintModel.countDocuments({ ngoId: id, status: "In Progress" }),
      ComplaintModel.countDocuments({ ngoId: id, status: "Resolved" }),
      VolunteerModel.countDocuments({ ngoId: id })
    ]);

    return res.json({
      ngo: ngo.toJSON(),
      stats: {
        totalAssigned,
        pending,
        inProgress,
        resolved,
        volunteersCount
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get NGO details." });
  }
});

export default router;
