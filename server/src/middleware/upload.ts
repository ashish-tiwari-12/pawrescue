import multer from "multer";
import path from "path";
import os from "os";
import crypto from "crypto";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "../services/cloudinaryService.js";

export const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.resolve("uploads");

// Memory storage keeps uploaded files in RAM buffer (file.buffer)
// Perfectly compatible with Vercel Serverless and direct Cloudinary streaming
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 5
  }
});

/**
 * Helper to upload images to Cloudinary (collections: pawrescue/complaints, pawrescue/dogs, etc.)
 * Falls back to base64 Data-URI if Cloudinary is temporarily unreachable
 */
export const processUploadedImages = async (
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
  folder: string = "pawrescue/general"
): Promise<string[]> => {
  const fileList: Express.Multer.File[] = [];

  if (Array.isArray(files)) {
    fileList.push(...files);
  } else if (files && typeof files === "object") {
    Object.values(files).forEach((arr) => {
      if (Array.isArray(arr)) fileList.push(...arr);
    });
  }

  if (fileList.length === 0) return [];

  const uploadPromises = fileList.map(async (file) => {
    try {
      if (isCloudinaryConfigured() && file.buffer) {
        const uniqueId = `paw_${crypto.randomUUID().slice(0, 8)}_${Date.now()}`;
        const res = await uploadBufferToCloudinary(file.buffer, folder, uniqueId);
        return res.secure_url;
      }
    } catch (err) {
      console.warn("⚠️ Cloudinary upload encountered notice, using buffer fallback:", err);
    }

    // Resilient fallback to Data URI
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
  });

  return Promise.all(uploadPromises);
};
