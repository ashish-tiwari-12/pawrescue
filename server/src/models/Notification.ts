import mongoose, { Schema, Document } from "mongoose";

export interface INotificationDocument extends Document {
  userId: string;
  title: string;
  message: string;
  type: "status_update" | "assignment" | "new_complaint" | "urgent_alert" | "system";
  complaintId?: string;
  trackingId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["status_update", "assignment", "new_complaint", "urgent_alert", "system"],
      default: "system"
    },
    complaintId: { type: String },
    trackingId: { type: String },
    read: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const NotificationModel = mongoose.model<INotificationDocument>(
  "Notification",
  NotificationSchema
);
