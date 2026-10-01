import { Router, Response } from "express";
import { NotificationModel } from "../models/Notification.js";
import { authenticateJWT, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get user's notifications from MongoDB (Strict ownership check)
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const notifications = await NotificationModel.find({
      $or: [{ userId }, { userId: "all" }]
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ notifications: notifications.map((n) => n.toJSON()) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get notifications." });
  }
});

// Mark single notification as read (Strict ownership verification)
router.patch("/:id/read", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid notification ID format." });
    }

    const userId = req.user!._id.toString();
    const notif = await NotificationModel.findOneAndUpdate(
      { _id: id, $or: [{ userId }, { userId: "all" }] },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ error: "Notification not found or access denied." });
    }

    return res.json({ message: "Notification marked as read.", notification: notif.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

// Mark all user notifications as read
router.patch("/read-all", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    await NotificationModel.updateMany(
      { $or: [{ userId }, { userId: "all" }], read: false },
      { $set: { read: true } }
    );
    return res.json({ message: "All notifications marked as read." });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to mark all as read." });
  }
});

export default router;
