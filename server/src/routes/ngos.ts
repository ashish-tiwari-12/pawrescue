import { Router, Request, Response } from "express";
import { NGOModel } from "../models/NGO.js";
import { ComplaintModel } from "../models/Complaint.js";
import { VolunteerModel } from "../models/Volunteer.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.js";
import { calculateDistanceKm } from "../services/routingEngine.js";
import { sanitizeText } from "../middleware/security.js";

const router = Router();

// 1. List all NGOs from MongoDB with distance if user location provided
router.get("/", async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const ngos = await NGOModel.find().sort({ verified: -1, totalRescued: -1 });

    const ngoList = ngos.map((ngo) => {
      const obj: any = ngo.toJSON();
      if (lat && lng) {
        const userLat = Math.max(-90, Math.min(90, parseFloat(lat as string)));
        const userLng = Math.max(-180, Math.min(180, parseFloat(lng as string)));
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
    let ngo = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      ngo = await NGOModel.findById(id);
    }
    if (!ngo) {
      ngo = await NGOModel.findOne({ registrationNumber: id.trim() });
    }

    if (!ngo) {
      return res.status(404).json({ error: "NGO not found." });
    }

    const currentNgoId = ngo._id.toString();

    const [totalAssigned, pending, inProgress, resolved, volunteersCount] = await Promise.all([
      ComplaintModel.countDocuments({ ngoId: currentNgoId }),
      ComplaintModel.countDocuments({ ngoId: currentNgoId, status: { $in: ["Reported", "Accepted"] } }),
      ComplaintModel.countDocuments({ ngoId: currentNgoId, status: "In Progress" }),
      ComplaintModel.countDocuments({ ngoId: currentNgoId, status: "Resolved" }),
      VolunteerModel.countDocuments({ ngoId: currentNgoId })
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

// 3. Update NGO Settings (Requires Authenticated NGO Admin)
router.put(
  "/:id/settings",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        email,
        pincodesCovered,
        servicesOffered,
        coverageRadiusKm,
        workingHours,
        emergency24x7,
        address,
        latitude,
        longitude
      } = req.body;

      let ngo = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        ngo = await NGOModel.findById(id);
      }
      if (!ngo && req.user?.ngoId) {
        ngo = await NGOModel.findById(req.user.ngoId);
      }

      if (!ngo) {
        return res.status(404).json({ error: "NGO shelter not found." });
      }

      if (name) ngo.name = sanitizeText(name);
      if (phone) ngo.phone = phone.trim().slice(0, 20);
      if (email) ngo.email = email.trim().toLowerCase();
      if (pincodesCovered && Array.isArray(pincodesCovered)) {
        ngo.pincodesCovered = pincodesCovered.map((p) => sanitizeText(String(p)).slice(0, 10));
      }
      if (servicesOffered && Array.isArray(servicesOffered)) {
        ngo.servicesOffered = servicesOffered.map((s) => sanitizeText(String(s))) as any;
      }
      if (coverageRadiusKm) {
        ngo.coverageRadiusKm = Math.min(100, Math.max(1, parseInt(coverageRadiusKm, 10) || 15));
      }
      if (workingHours) {
        ngo.workingHours = sanitizeText(workingHours);
      }
      if (typeof emergency24x7 === "boolean") {
        ngo.emergency24x7 = emergency24x7;
      }
      if (address) {
        ngo.address = sanitizeText(address);
      }
      if (latitude && longitude) {
        const lat = Math.max(-90, Math.min(90, parseFloat(latitude)));
        const lng = Math.max(-180, Math.min(180, parseFloat(longitude)));
        ngo.location = {
          type: "Point",
          coordinates: [lng, lat]
        };
      }

      await ngo.save();

      return res.json({
        message: "NGO profile & settings updated successfully!",
        ngo: ngo.toJSON()
      });
    } catch (error: any) {
      console.error("Update NGO settings error:", error);
      return res.status(500).json({ error: "Failed to update NGO settings." });
    }
  }
);

export default router;
