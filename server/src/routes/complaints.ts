import { Router, Request, Response } from "express";
import crypto from "crypto";

const uuidv4 = () => crypto.randomUUID();
import { ComplaintModel } from "../models/Complaint.js";
import { NotificationModel } from "../models/Notification.js";
import { NGOModel } from "../models/NGO.js";
import { VolunteerModel } from "../models/Volunteer.js";
import { UserModel } from "../models/User.js";
import { sendRescueNotificationEmail } from "../services/emailService.js";
import { findNearestEligibleNGO, calculateDistanceKm } from "../services/routingEngine.js";
import { authenticateJWT, optionalAuth, requireRole, AuthRequest } from "../middleware/auth.js";
import { uploadImages, processUploadedImages } from "../middleware/upload.js";
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  TimelineEvent
} from "../types.js";
import { broadcastEvent } from "../sockets/index.js";
import { processResolvedComplaintForDogProfile } from "../services/aiDogProfilingService.js";

const router = Router();

// Generate human-friendly tracking ID (e.g. PC-2026-8912)
function generateTrackingId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PC-2026-${randomNum}`;
}

// 1. Create Complaint (Multer upload supported + Saved to MongoDB + Auto Geospatial NGO Assignment)
router.post(
  "/",
  optionalAuth,
  uploadImages.array("images", 5),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        title,
        category,
        dogCondition,
        description,
        address,
        landmark,
        city = "Noida",
        pincode = "201301",
        latitude,
        longitude,
        contactNumber,
        isEmergency,
        citizenName,
        ngoId
      } = req.body;

      if (!category || !description || !address || !contactNumber) {
        return res.status(400).json({
          error: "Category, description, address, and contact number are required."
        });
      }

      // Collect image URLs (Uploaded directly to Cloudinary collection: pawrescue/complaints)
      const uploadedCloudinaryUrls = await processUploadedImages(req.files as any, "pawrescue/complaints");
      const imageUrls: string[] = [...uploadedCloudinaryUrls];
      if (req.body.imageUrls) {
        try {
          const parsed =
            typeof req.body.imageUrls === "string"
              ? JSON.parse(req.body.imageUrls)
              : req.body.imageUrls;
          if (Array.isArray(parsed)) {
            imageUrls.push(...parsed);
          }
        } catch {
          if (typeof req.body.imageUrls === "string") {
            imageUrls.push(req.body.imageUrls);
          }
        }
      }

      if (imageUrls.length === 0) {
        imageUrls.push(
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
        );
      }

      // Parse dogCondition
      let parsedConditions: string[] = [];
      if (dogCondition) {
        if (Array.isArray(dogCondition)) {
          parsedConditions = dogCondition;
        } else {
          try {
            parsedConditions = JSON.parse(dogCondition);
          } catch {
            parsedConditions = [dogCondition];
          }
        }
      }

      const isEmerg =
        isEmergency === "true" ||
        isEmergency === true ||
        category === "Emergency Rescue" ||
        category === "Injured Dog" ||
        category === "Dog Bite";

      let priority: ComplaintPriority = "Medium";
      if (isEmerg) priority = "Critical";
      else if (category === "Sick Dog" || category === "Aggressive Dog") priority = "High";
      else if (category === "Sterilization Request" || category === "Vaccination Request")
        priority = "Low";

      let trackingId = generateTrackingId();
      while (await ComplaintModel.findOne({ trackingId })) {
        trackingId = generateTrackingId();
      }

      const now = new Date().toISOString();
      const user = req.user;
      const cName = citizenName || user?.name || "Concerned Citizen";
      const uId = user ? user._id.toString() : `anon-${uuidv4().slice(0, 6)}`;

      const parsedLat = latitude ? parseFloat(latitude) : 28.5482;
      const parsedLng = longitude ? parseFloat(longitude) : 77.3426;

      // FEATURE 2 & 7: Automatic Geospatial Assignment Engine
      let assignedNgo = null;
      let distanceKm = 0;
      let requiredService: any = "Rescue";
      let withinCoverage = true;

      if (ngoId) {
        assignedNgo = await NGOModel.findById(ngoId);
        if (assignedNgo) {
          distanceKm = calculateDistanceKm(
            parsedLat,
            parsedLng,
            assignedNgo.location.coordinates[1],
            assignedNgo.location.coordinates[0]
          );
        }
      } else {
        const assignmentResult = await findNearestEligibleNGO(
          parsedLat,
          parsedLng,
          category,
          isEmerg
        );
        assignedNgo = assignmentResult.assignedNgo;
        distanceKm = assignmentResult.distanceKm;
        requiredService = assignmentResult.requiredService;
        withinCoverage = assignmentResult.withinCoverage;
      }

      // Initial Timeline
      const initialTimeline: TimelineEvent = {
        id: `tl-${uuidv4().slice(0, 6)}`,
        status: "Reported",
        title: "Complaint Registered & Auto-Routed",
        description: assignedNgo
          ? `Automatically assigned to ${assignedNgo.name} (${distanceKm} KM away) covering ${requiredService} service zone.`
          : isEmerg
          ? "CRITICAL EMERGENCY complaint registered with priority ambulance dispatch."
          : "Complaint registered and queued for NGO triage.",
        timestamp: now,
        updatedBy: cName,
        role: user?.role || "citizen"
      };

      const newComplaint = await ComplaintModel.create({
        trackingId,
        title: title || `${category} reported at ${address}`,
        category: category as ComplaintCategory,
        requiredService,
        dogCondition: parsedConditions,
        description,
        images: imageUrls,
        address,
        landmark: landmark || "",
        city,
        pincode,
        location: {
          latitude: parsedLat,
          longitude: parsedLng
        },
        geoPoint: {
          type: "Point",
          coordinates: [parsedLng, parsedLat]
        },
        contactNumber,
        isEmergency: isEmerg,
        priority,
        status: "Reported",
        userId: uId,
        citizenName: cName,
        citizenPhone: contactNumber,
        ngoId: assignedNgo ? assignedNgo._id.toString() : undefined,
        ngoName: assignedNgo ? assignedNgo.name : "Noida Animal Shelter",
        distanceKm,
        autoAssigned: true,
        timeline: [initialTimeline],
        notes: []
      });

      // Notification
      const notif = await NotificationModel.create({
        userId: "usr-ngo-admin-1",
        title: isEmerg ? `🚨 CRITICAL: ${category} Reported!` : `New Complaint #${trackingId}`,
        message: `${category} reported at ${address} (${pincode}). Immediate review required.`,
        type: isEmerg ? "urgent_alert" : "new_complaint",
        complaintId: newComplaint._id.toString(),
        trackingId: newComplaint.trackingId,
        read: false
      });

      const complaintObj = newComplaint.toJSON();

      broadcastEvent("complaint:created", { complaint: complaintObj });
      broadcastEvent("notification:new", { notification: notif.toJSON() });

      return res.status(201).json({
        message: "Complaint registered successfully in MongoDB!",
        complaint: complaintObj
      });
    } catch (error: any) {
      console.error("Create Complaint Error:", error);
      return res.status(500).json({ error: "Failed to submit complaint. " + error.message });
    }
  }
);

// 2. Get All Complaints (Filterable, Searchable, Paginated from MongoDB)
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      category,
      priority,
      pincode,
      search,
      userId,
      ngoId,
      isEmergency,
      page = "1",
      limit = "50",
      sortBy = "createdAt",
      order = "desc"
    } = req.query;

    const query: any = {};

    if (userId) {
      query.userId = userId;
    }
    if (ngoId) {
      query.ngoId = ngoId;
    }
    if (pincode) {
      query.pincode = pincode;
    }
    if (status && status !== "All") {
      query.status = new RegExp(`^${status}$`, "i");
    }
    if (category && category !== "All") {
      query.category = category;
    }
    if (priority && priority !== "All") {
      query.priority = priority;
    }
    if (isEmergency === "true") {
      query.isEmergency = true;
    }

    if (search) {
      const regex = new RegExp(search as string, "i");
      query.$or = [
        { trackingId: regex },
        { title: regex },
        { description: regex },
        { citizenName: regex },
        { address: regex },
        { landmark: regex },
        { contactNumber: regex }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === "asc" ? 1 : -1;

    const [total, complaints] = await Promise.all([
      ComplaintModel.countDocuments(query),
      ComplaintModel.find(query)
        .sort({ [sortBy as string]: sortOrder })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      complaints: complaints.map((c) => c.toJSON())
    });
  } catch (error: any) {
    console.error("Get Complaints Error:", error);
    return res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// 3. Track Complaint by Tracking ID / Phone (Public endpoint)
router.get("/track/:trackingId", async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const clean = trackingId.trim();

    const complaint = await ComplaintModel.findOne({
      $or: [
        { trackingId: new RegExp(`^${clean}$`, "i") },
        { contactNumber: clean },
        { _id: clean.match(/^[0-9a-fA-F]{24}$/) ? clean : undefined }
      ].filter(Boolean)
    });

    if (!complaint) {
      return res.status(404).json({
        error: `No complaint found with Tracking ID or phone number '${trackingId}'.`
      });
    }

    return res.json({ complaint: complaint.toJSON() });
  } catch (error: any) {
    console.error("Track Error:", error);
    return res.status(500).json({ error: "Tracking query failed." });
  }
});

// 4. Get Single Complaint by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintModel.findById(id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    return res.json({ complaint: complaint.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get complaint." });
  }
});

// 5. Update Complaint Status (NGO Admin / Volunteer)
router.patch("/:id/status", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, resolutionNotes } = req.body;

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const validStatuses: ComplaintStatus[] = [
      "Reported",
      "Accepted",
      "In Progress",
      "Resolved",
      "Closed"
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const now = new Date().toISOString();
    const user = req.user!;

    const statusTitles: Record<ComplaintStatus, string> = {
      Reported: "Complaint Reopened",
      Accepted: "Complaint Accepted by NGO",
      "In Progress": "Rescue / Treatment In Progress",
      Resolved: "Rescue / Treatment Completed",
      Closed: "Case Verified & Closed"
    };

    const newTimelineEvent: TimelineEvent = {
      id: `tl-${uuidv4().slice(0, 6)}`,
      status,
      title: statusTitles[status as ComplaintStatus] || `Status changed to ${status}`,
      description: note || `Complaint status updated to ${status} by ${user.name}.`,
      timestamp: now,
      updatedBy: user.name,
      role: user.role
    };

    complaint.status = status;
    complaint.timeline.push(newTimelineEvent);

    if (status === "Resolved") {
      complaint.resolvedAt = new Date();
      complaint.resolutionNotes =
        resolutionNotes || note || "Rescue and veterinary care completed.";

      // FEATURE: AI-powered Dog Profile Generation from Resolved Complaint
      processResolvedComplaintForDogProfile(complaint._id.toString())
        .then((aiResult) => {
          console.log(`🐕 [AI PROFILER] Auto-profile generated for #${complaint.trackingId}:`, aiResult.message);
        })
        .catch((err) => console.error("Auto dog profile error:", err));
    }

    await complaint.save();

    // Citizen Notification
    const citizenNotif = await NotificationModel.create({
      userId: complaint.userId,
      title: `Status Update: Complaint #${complaint.trackingId}`,
      message: `Your complaint has been marked as "${status}". ${note ? `Note: ${note}` : ""}`,
      type: "status_update",
      complaintId: complaint._id.toString(),
      trackingId: complaint.trackingId,
      read: false
    });

    const complaintObj = complaint.toJSON();

    broadcastEvent("complaint:status_updated", { complaint: complaintObj });
    broadcastEvent("notification:new", { notification: citizenNotif.toJSON() });

    // Send email alert to citizen if registered user with email
    if (complaint.userId) {
      UserModel.findById(complaint.userId)
        .then((citizen) => {
          if (citizen && citizen.email) {
            sendRescueNotificationEmail(
              citizen.email,
              citizen.name,
              complaint.trackingId,
              status,
              note
            ).catch((e) => console.error("Status email notify error:", e));
          }
        })
        .catch(() => {});
    }

    return res.json({
      message: `Status updated to ${status}`,
      complaint: complaintObj
    });
  } catch (error: any) {
    console.error("Status Update Error:", error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// 6. Assign Volunteer to Complaint
router.patch("/:id/assign", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const volunteer = await VolunteerModel.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found." });
    }

    const now = new Date().toISOString();
    const user = req.user!;

    const timelineEvent: TimelineEvent = {
      id: `tl-${uuidv4().slice(0, 6)}`,
      status: complaint.status === "Reported" ? "Accepted" : complaint.status,
      title: "Volunteer Assigned",
      description: `${volunteer.name} (${volunteer.phone}) has been assigned to lead this rescue operation.`,
      timestamp: now,
      updatedBy: user.name,
      role: user.role
    };

    complaint.volunteerId = volunteer._id.toString();
    complaint.volunteerName = volunteer.name;
    complaint.volunteerPhone = volunteer.phone;
    if (complaint.status === "Reported") {
      complaint.status = "Accepted";
    }
    complaint.timeline.push(timelineEvent);

    await complaint.save();

    volunteer.assignedComplaintsCount = (volunteer.assignedComplaintsCount || 0) + 1;
    volunteer.availability = "On Mission";
    await volunteer.save();

    const notif = await NotificationModel.create({
      userId: complaint.userId,
      title: "Volunteer Assigned to Your Complaint",
      message: `${volunteer.name} from ${complaint.ngoName || "NGO"} has been assigned to help.`,
      type: "assignment",
      complaintId: complaint._id.toString(),
      trackingId: complaint.trackingId,
      read: false
    });

    const complaintObj = complaint.toJSON();

    broadcastEvent("complaint:assigned", { complaint: complaintObj, volunteer: volunteer.toJSON() });
    broadcastEvent("notification:new", { notification: notif.toJSON() });

    return res.json({
      message: `Volunteer ${volunteer.name} assigned successfully.`,
      complaint: complaintObj
    });
  } catch (error: any) {
    console.error("Assign Volunteer Error:", error);
    return res.status(500).json({ error: "Failed to assign volunteer." });
  }
});

// 7. Add Comment / Note to Complaint
router.post("/:id/notes", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const user = req.user!;
    const newNote = {
      id: `nt-${uuidv4().slice(0, 6)}`,
      authorName: user.name,
      authorRole:
        user.role === "ngo_admin"
          ? "NGO Admin"
          : user.role === "volunteer"
          ? "Volunteer"
          : "Citizen",
      message,
      createdAt: new Date().toISOString(),
      isInternal
    };

    complaint.notes.push(newNote);
    await complaint.save();

    broadcastEvent("complaint:note_added", { complaintId: id, note: newNote });

    return res.status(201).json({
      message: "Note added successfully.",
      complaint: complaint.toJSON()
    });
  } catch (error: any) {
    console.error("Add Note Error:", error);
    return res.status(500).json({ error: "Failed to add note." });
  }
});

// 8. Bulk Status Update (NGO Admin)
router.post(
  "/bulk-status",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { complaintIds, status, note } = req.body;

      if (!Array.isArray(complaintIds) || complaintIds.length === 0 || !status) {
        return res.status(400).json({ error: "complaintIds array and status are required." });
      }

      const now = new Date().toISOString();
      const user = req.user!;

      const timelineEvent: TimelineEvent = {
        id: `tl-${uuidv4().slice(0, 6)}`,
        status,
        title: `Bulk Status Update: ${status}`,
        description: note || `Status changed to ${status} in bulk action by ${user.name}.`,
        timestamp: now,
        updatedBy: user.name,
        role: user.role
      };

      const result = await ComplaintModel.updateMany(
        { _id: { $in: complaintIds } },
        {
          $set: { status },
          $push: { timeline: timelineEvent }
        }
      );

      broadcastEvent("complaints:bulk_updated", { count: result.modifiedCount, status });

      return res.json({
        message: `Successfully updated ${result.modifiedCount} complaints to ${status}.`,
        updatedCount: result.modifiedCount
      });
    } catch (error: any) {
      console.error("Bulk Status Error:", error);
      return res.status(500).json({ error: "Failed to execute bulk update." });
    }
  }
);

export default router;
