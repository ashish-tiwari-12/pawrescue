import { Router, Request, Response } from "express";
import { NGOModel } from "../models/NGO.js";
import { ComplaintModel } from "../models/Complaint.js";
import { VolunteerModel } from "../models/Volunteer.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.js";
import { calculateDistanceKm } from "../services/routingEngine.js";

const router = Router();

// 1. List all NGOs from MongoDB with distance if user location provided
router.get("/", async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const ngos = await NGOModel.find().sort({ verified: -1, totalRescued: -1 });

    const ngoList = ngos.map((ngo) => {
      const obj: any = ngo.toJSON();
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        const ngoLng = ngo.location.coordinates[0];
        const ngoLat = ngo.location.coordinates[1];
        obj.distanceKm = calculateDistanceKm(userLat, userLng, ngoLat, ngoLng);
      }
      return obj;
    });

    return res.json({ ngos: ngoList });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get NGOs." });
  }
});

// 2. Get NGO details by ID + live stats from MongoDB
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

// 3. FEATURE 5: Update NGO Settings (Services, Working Hours, Coverage Radius, Emergency 24x7)
router.put(
  "/:id/settings",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        servicesOffered,
        coverageRadiusKm,
        workingHours,
        emergency24x7,
        address,
        latitude,
        longitude
      } = req.body;

      const ngo = await NGOModel.findById(id);
      if (!ngo) {
        return res.status(404).json({ error: "NGO shelter not found." });
      }

      if (servicesOffered && Array.isArray(servicesOffered)) {
        ngo.servicesOffered = servicesOffered;
      }
      if (coverageRadiusKm) {
        ngo.coverageRadiusKm = parseInt(coverageRadiusKm, 10);
      }
      if (workingHours) {
        ngo.workingHours = workingHours;
      }
      if (typeof emergency24x7 === "boolean") {
        ngo.emergency24x7 = emergency24x7;
      }
      if (address) {
        ngo.address = address;
      }
      if (latitude && longitude) {
        ngo.location = {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
      }

      await ngo.save();

      return res.json({
        message: "NGO settings and coverage zone updated successfully!",
        ngo: ngo.toJSON()
      });
    } catch (error: any) {
      console.error("Update NGO settings error:", error);
      return res.status(500).json({ error: "Failed to update NGO settings." });
    }
  }
);

export default router;
