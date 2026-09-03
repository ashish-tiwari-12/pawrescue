import { Router, Response } from "express";
import { NotificationModel } from "../models/Notification.js";
import { authenticateJWT, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get user's notifications from MongoDB
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const notifications = await NotificationModel.find({
      $or: [{ userId }, { userId: "all" }]
    }).sort({ createdAt: -1 });

    return res.json({ notifications: notifications.map((n) => n.toJSON()) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get notifications." });
  }
});

// Mark single notification as read
router.patch("/:id/read", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notif = await NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notif) {
      return res.status(404).json({ error: "Notification not found." });
    }
    return res.json({ message: "Notification marked as read.", notification: notif.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

// Mark all as read
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
