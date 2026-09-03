import mongoose, { Schema, Document } from "mongoose";
import { ServiceType } from "../types.js";

export interface INGODocument extends Document {
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincodesCovered: string[];
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  coverageRadiusKm: number;
  servicesOffered: ServiceType[];
  workingHours: string;
  emergency24x7: boolean;
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
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [77.3426, 28.5482] // default Delhi-NCR center
      }
    },
    coverageRadiusKm: {
      type: Number,
      default: 15
    },
    servicesOffered: {
      type: [String],
      enum: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      default: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"]
    },
    workingHours: { type: String, default: "24/7" },
    emergency24x7: { type: Boolean, default: true },
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
        if (ret.location && ret.location.coordinates) {
          ret.longitude = ret.location.coordinates[0];
          ret.latitude = ret.location.coordinates[1];
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// 2dsphere index for MongoDB geospatial queries
NGOSchema.index({ location: "2dsphere" });

export const NGOModel = mongoose.model<INGODocument>("NGO", NGOSchema);
