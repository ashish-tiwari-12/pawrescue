import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../types.js";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  ngoId?: string;
  avatarUrl?: string;
  isVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpiry?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["citizen", "ngo_admin", "volunteer"],
      default: "citizen"
    },
    ngoId: { type: String },
    avatarUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String },
    verificationOtpExpiry: { type: Date },
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpiry: { type: Date }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.verificationOtp;
        delete ret.verificationOtpExpiry;
        delete ret.resetPasswordOtp;
        delete ret.resetPasswordOtpExpiry;
        return ret;
      }
    }
  }
);

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
