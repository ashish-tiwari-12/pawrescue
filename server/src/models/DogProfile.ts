import mongoose, { Schema, Document } from "mongoose";
import {
  VaccinationStatus,
  SterilizationStatus,
  AdoptionStatus,
  VaccinationRecord,
  SterilizationRecord,
  MedicalRecord,
  RescueHistoryItem
} from "../types.js";

export interface IDogProfileDocument extends Document {
  dogId: string;
  name?: string;
  images: string[];
  breed: string;
  gender: "Male" | "Female" | "Unknown";
  estimatedAge: string;
  colorPattern: string;
  vaccinationStatus: VaccinationStatus;
  sterilizationStatus: SterilizationStatus;
  adoptionStatus: AdoptionStatus;
  currentArea: string;
  city: string;
  pincode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  geoPoint?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  lastSeenDate: string;
  registeredByNgoId?: string;
  registeredByNgoName?: string;
  microchipNumber?: string;
  rescueHistory: RescueHistoryItem[];
  medicalHistory: MedicalRecord[];
  vaccinations: VaccinationRecord[];
  sterilization?: SterilizationRecord;
  caretakersCount: number;
  visualEmbeddings?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const VaccinationRecordSchema = new Schema<VaccinationRecord>(
  {
    id: { type: String, required: true },
    vaccineType: {
      type: String,
      enum: ["Anti-Rabies (ARV)", "7-in-1 (DHPPIL)", "Corona", "Booster Dose"],
      required: true
    },
    administeredDate: { type: String, required: true },
    nextDueDate: { type: String, required: true },
    administeredBy: { type: String, required: true },
    batchNumber: { type: String },
    certificateUrl: { type: String }
  },
  { _id: false }
);

const SterilizationRecordSchema = new Schema<SterilizationRecord>(
  {
    id: { type: String, required: true },
    surgeryDate: { type: String, required: true },
    earNotchSide: {
      type: String,
      enum: ["Left Ear", "Right Ear", "V-Shape", "None"],
      default: "Left Ear"
    },
    earNotchPhoto: { type: String },
    operatingNgo: { type: String, required: true },
    veterinarySurgeon: { type: String, required: true },
    recoveryStatus: {
      type: String,
      enum: ["Fully Recovered", "Post-Op Care", "Complications"],
      default: "Fully Recovered"
    },
    notes: { type: String }
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema<MedicalRecord>(
  {
    id: { type: String, required: true },
    diagnosis: { type: String, required: true },
    treatmentDate: { type: String, required: true },
    treatments: [{ type: String }],
    medications: [{ type: String }],
    attendingVet: { type: String, required: true },
    vetNotes: { type: String },
    recoveryStatus: {
      type: String,
      enum: ["Under Treatment", "Recovering", "Fully Healed", "Chronic"],
      default: "Fully Healed"
    }
  },
  { _id: false }
);

const RescueHistoryItemSchema = new Schema<RescueHistoryItem>(
  {
    complaintId: { type: String, required: true },
    trackingId: { type: String, required: true },
    date: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    ngoName: { type: String, required: true }
  },
  { _id: false }
);

const DogProfileSchema = new Schema<IDogProfileDocument>(
  {
    dogId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    name: { type: String },
    images: [{ type: String }],
    breed: { type: String, required: true, default: "Indian Pariah / Indie", index: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Unknown"],
      default: "Unknown"
    },
    estimatedAge: { type: String, default: "2 Years" },
    colorPattern: { type: String, required: true },
    vaccinationStatus: {
      type: String,
      enum: ["Fully Vaccinated", "Partially Vaccinated", "Not Vaccinated", "Due Soon"],
      default: "Not Vaccinated",
      index: true
    },
    sterilizationStatus: {
      type: String,
      enum: ["Sterilized (Ear Notched)", "Unsterilized", "Scheduled"],
      default: "Unsterilized",
      index: true
    },
    adoptionStatus: {
      type: String,
      enum: [
        "Available for Adoption",
        "In Foster Care",
        "Community Dog (Free Roaming)",
        "Adopted"
      ],
      default: "Community Dog (Free Roaming)",
      index: true
    },
    currentArea: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true, default: "Noida" },
    pincode: { type: String, required: true, index: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    geoPoint: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },
    lastSeenDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
    registeredByNgoId: { type: String, index: true },
    registeredByNgoName: { type: String },
    microchipNumber: { type: String },
    rescueHistory: [RescueHistoryItemSchema],
    medicalHistory: [MedicalRecordSchema],
    vaccinations: [VaccinationRecordSchema],
    sterilization: SterilizationRecordSchema,
    caretakersCount: { type: Number, default: 1 },
    visualEmbeddings: [{ type: Number }]
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

DogProfileSchema.index({ geoPoint: "2dsphere" });

export const DogProfileModel = mongoose.model<IDogProfileDocument>(
  "DogProfile",
  DogProfileSchema
);
