import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sanitizeText } from "./security.js";

// Custom validators
const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$|^[0-9+\-\s()]{7,20}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

/**
 * 1. Auth Schemas
 */
export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name cannot exceed 100 characters.")
    .transform(sanitizeText),
  email: z
    .string()
    .email("Please provide a valid email address.")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .min(7, "Invalid phone number length.")
    .max(20, "Phone number too long.")
    .regex(phoneRegex, "Please provide a valid contact phone number."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .max(128, "Password cannot exceed 128 characters."),
  role: z.enum(["citizen", "ngo_admin", "volunteer"]).optional().default("citizen"),
  ngoId: z.string().max(100).optional(),
  avatarUrl: z.string().url("Invalid avatar URL format").max(500).optional()
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address.")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required."),
  role: z.enum(["citizen", "ngo_admin", "volunteer"]).optional()
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address.")
    .toLowerCase()
    .trim()
});

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address.")
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .trim()
    .min(4, "Invalid OTP code.")
    .max(10, "Invalid OTP code."),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters long.")
    .max(128, "Password cannot exceed 128 characters.")
});

export const VerifyEmailSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address.")
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .trim()
    .min(4, "Invalid OTP code.")
    .max(10, "Invalid OTP code.")
});

/**
 * 2. Complaint Schemas
 */
export const CreateComplaintSchema = z.object({
  title: z.string().max(200).optional().transform((v) => (v ? sanitizeText(v) : undefined)),
  category: z.enum([
    "Injured Dog",
    "Sick Dog",
    "Aggressive Dog",
    "Abandoned Puppy",
    "Emergency Rescue",
    "Sterilization Request",
    "Vaccination Request",
    "Lost Dog",
    "Dog Bite"
  ]),
  dogCondition: z.union([z.array(z.string()), z.string()]).optional(),
  description: z
    .string()
    .min(5, "Please provide more details in description (minimum 5 characters).")
    .max(2000, "Description cannot exceed 2000 characters.")
    .transform(sanitizeText),
  address: z
    .string()
    .min(3, "Address is required.")
    .max(300, "Address cannot exceed 300 characters.")
    .transform(sanitizeText),
  landmark: z.string().max(200).optional().transform((v) => (v ? sanitizeText(v) : "")),
  city: z.string().max(100).optional().default("Noida").transform(sanitizeText),
  pincode: z
    .string()
    .optional()
    .default("201301")
    .refine((val) => !val || pincodeRegex.test(val.trim()), {
      message: "Please provide a valid 6-digit Indian pincode."
    }),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  contactNumber: z
    .string()
    .min(7, "Invalid phone number length.")
    .max(20, "Phone number too long.")
    .regex(phoneRegex, "Please provide a valid contact number."),
  isEmergency: z.union([z.boolean(), z.string()]).optional(),
  citizenName: z.string().max(100).optional().transform((v) => (v ? sanitizeText(v) : undefined)),
  ngoId: z.string().max(100).optional(),
  imageUrls: z.union([z.array(z.string()), z.string()]).optional()
});

export const UpdateComplaintStatusSchema = z.object({
  status: z.enum(["Reported", "Accepted", "In Progress", "Resolved", "Closed"]),
  note: z.string().max(1000).optional().transform((v) => (v ? sanitizeText(v) : undefined)),
  resolutionNotes: z.string().max(2000).optional().transform((v) => (v ? sanitizeText(v) : undefined)),
  forceNewDog: z.union([z.boolean(), z.string()]).optional(),
  createNewDog: z.union([z.boolean(), z.string()]).optional(),
  asNewDog: z.union([z.boolean(), z.string()]).optional()
});

export const AddComplaintNoteSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message cannot exceed 2000 characters.")
    .transform(sanitizeText),
  isInternal: z.boolean().optional().default(false)
});

/**
 * 3. Dog Registry Schemas
 */
export const CreateDogProfileSchema = z.object({
  name: z.string().max(100).optional().transform((v) => (v ? sanitizeText(v) : undefined)),
  breed: z.string().max(100).optional().default("Indian Pariah / Indie").transform(sanitizeText),
  gender: z.enum(["Male", "Female", "Unknown"]).optional().default("Unknown"),
  estimatedAge: z.string().max(50).optional().default("2 Years").transform(sanitizeText),
  colorPattern: z
    .string()
    .min(2, "Color pattern is required.")
    .max(100, "Color pattern too long.")
    .transform(sanitizeText),
  vaccinationStatus: z
    .enum(["Fully Vaccinated", "Partially Vaccinated", "Not Vaccinated", "Unknown"])
    .optional()
    .default("Not Vaccinated"),
  sterilizationStatus: z
    .enum(["Sterilized (Ear Notched)", "Unsterilized", "Unknown"])
    .optional()
    .default("Unsterilized"),
  adoptionStatus: z
    .enum(["Community Dog (Free Roaming)", "Available for Adoption", "Adopted", "In Shelter"])
    .optional()
    .default("Community Dog (Free Roaming)"),
  currentArea: z
    .string()
    .min(2, "Sighting area is required.")
    .max(200, "Area name too long.")
    .transform(sanitizeText),
  city: z.string().max(100).optional().default("Noida").transform(sanitizeText),
  pincode: z.string().max(10).optional().default("201301"),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  microchipNumber: z.string().max(50).optional().transform((v) => (v ? sanitizeText(v) : "")),
  registeredByNgoName: z.string().max(150).optional().transform((v) => (v ? sanitizeText(v) : undefined))
});

export const MedicalRecordSchema = z.object({
  diagnosis: z
    .string()
    .min(2, "Diagnosis is required.")
    .max(500)
    .transform(sanitizeText),
  treatments: z.union([z.array(z.string()), z.string()]).optional(),
  medications: z.union([z.array(z.string()), z.string()]).optional(),
  attendingVet: z
    .string()
    .min(2, "Vet name is required.")
    .max(100)
    .transform(sanitizeText),
  vetNotes: z.string().max(1500).optional().transform((v) => (v ? sanitizeText(v) : "")),
  recoveryStatus: z.string().max(100).optional().default("Under Treatment").transform(sanitizeText)
});

export const VaccinationRecordSchema = z.object({
  vaccineType: z
    .string()
    .min(2)
    .max(100)
    .transform(sanitizeText),
  administeredBy: z
    .string()
    .min(2)
    .max(100)
    .transform(sanitizeText),
  nextDueDate: z.string().max(50).optional(),
  batchNumber: z.string().max(50).optional().transform((v) => (v ? sanitizeText(v) : undefined))
});

/**
 * Express Middleware factory to validate requests against a Zod schema
 */
export const validateRequest = (
  schema: z.ZodSchema<any>,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error: any) {
      if (error && (error.issues || error.errors)) {
        const issuesList = error.issues || error.errors || [];
        const formatted = issuesList.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join(".") : String(err.path),
          message: err.message
        }));
        return res.status(400).json({
          error: formatted[0]?.message || "Validation error in request payload.",
          validationErrors: formatted
        });
      }
      return res.status(400).json({ error: "Invalid request payload format." });
    }
  };
};
