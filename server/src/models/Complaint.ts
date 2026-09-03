import mongoose, { Schema, Document } from "mongoose";
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  TimelineEvent,
  ComplaintNote
} from "../types.js";

export interface IComplaintDocument extends Document {
  trackingId: string;
  title: string;
  category: ComplaintCategory;
  dogCondition: string[];
  description: string;
  images: string[];
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  contactNumber: string;
  isEmergency: boolean;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  userId: string;
  citizenName: string;
  citizenPhone: string;
  ngoId?: string;
  ngoName?: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  timeline: TimelineEvent[];
  notes: ComplaintNote[];
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<TimelineEvent>(
  {
    id: { type: String, required: true },
    status: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: String, required: true },
    updatedBy: { type: String, required: true },
    role: { type: String, required: true },
    notes: { type: String }
  },
  { _id: false }
);

const ComplaintNoteSchema = new Schema<ComplaintNote>(
  {
    id: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: String, required: true },
    isInternal: { type: Boolean, default: false }
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaintDocument>(
  {
    trackingId: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Injured Dog",
        "Sick Dog",
        "Aggressive Dog",
        "Abandoned Puppy",
        "Emergency Rescue",
        "Sterilization Request",
        "Vaccination Request"
      ],
      required: true,
      index: true
    },
    dogCondition: [{ type: String }],
    description: { type: String, required: true },
    images: [{ type: String }],
    address: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, default: "Mumbai" },
    pincode: { type: String, required: true, index: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    contactNumber: { type: String, required: true, index: true },
    isEmergency: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true
    },
    status: {
      type: String,
      enum: ["Reported", "Accepted", "In Progress", "Resolved", "Closed"],
      default: "Reported",
      index: true
    },
    userId: { type: String, required: true, index: true },
    citizenName: { type: String, required: true },
    citizenPhone: { type: String, required: true },
    ngoId: { type: String, index: true },
    ngoName: { type: String },
    volunteerId: { type: String, index: true },
    volunteerName: { type: String },
    volunteerPhone: { type: String },
    timeline: [TimelineEventSchema],
    notes: [ComplaintNoteSchema],
    resolutionNotes: { type: String },
    resolvedAt: { type: Date }
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

export const ComplaintModel = mongoose.model<IComplaintDocument>("Complaint", ComplaintSchema);
