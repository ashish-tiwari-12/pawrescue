import mongoose, { Schema, Document } from "mongoose";

export interface INGODocument extends Document {
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincodesCovered: string[];
  activeVolunteersCount: number;
  totalRescued: number;
  avatarUrl?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NGOSchema = new Schema<INGODocument>(
  {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincodesCovered: [{ type: String }],
    activeVolunteersCount: { type: Number, default: 0 },
    totalRescued: { type: Number, default: 0 },
    avatarUrl: { type: String },
    verified: { type: Boolean, default: true }
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

export const NGOModel = mongoose.model<INGODocument>("NGO", NGOSchema);
