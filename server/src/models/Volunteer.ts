import mongoose, { Schema, Document } from "mongoose";

export interface IVolunteerDocument extends Document {
  name: string;
  email: string;
  phone: string;
  ngoId: string;
  ngoName: string;
  skills: string[];
  availability: "Available" | "On Mission" | "Off Duty";
  assignedComplaintsCount: number;
  completedRescuesCount: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerSchema = new Schema<IVolunteerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    ngoId: { type: String, required: true, index: true },
    ngoName: { type: String, required: true },
    skills: [{ type: String }],
    availability: {
      type: String,
      enum: ["Available", "On Mission", "Off Duty"],
      default: "Available",
      index: true
    },
    assignedComplaintsCount: { type: Number, default: 0 },
    completedRescuesCount: { type: Number, default: 0 },
    avatarUrl: { type: String }
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

export const VolunteerModel = mongoose.model<IVolunteerDocument>("Volunteer", VolunteerSchema);
