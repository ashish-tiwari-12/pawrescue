import multer from "multer";
import path from "path";
import os from "os";
import crypto from "crypto";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "../services/cloudinaryService.js";
import { logSecurityEvent } from "../services/securityLogger.js";

export const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.resolve("uploads");

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Magic bytes signature verification helper
export const isValidImageBuffer = (buffer: Buffer): { valid: boolean; detectedFormat?: string } => {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedFormat: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedFormat: "image/png" };
  }

  // WebP: RIFF ... WEBP (Bytes 0-3: 52 49 46 46, Bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedFormat: "image/webp" };
  }

  return { valid: false };
};

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Strict Extension Check
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    logSecurityEvent({
      eventType: "INVALID_FILE_UPLOAD",
      ip: req.ip,
      resource: req.originalUrl,
      details: `Rejected file '${file.originalname}' due to unapproved extension: '${ext}'`
    });
    return cb(
      new Error(`Unsupported file extension '${ext}'. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`)
    );
  }

  // 2. Strict MIME Type Check
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    logSecurityEvent({
      eventType: "INVALID_FILE_UPLOAD",
      ip: req.ip,
      resource: req.originalUrl,
      details: `Rejected file '${file.originalname}' due to disallowed MIME type: '${file.mimetype}'`
    });
    return cb(
      new Error(`Invalid image MIME type '${file.mimetype}'. Only JPG, PNG, and WebP are supported.`)
    );
  }

  cb(null, true);
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Strict 10MB limit per image
    files: 5
  }
});

/**
 * Helper to validate magic byte signatures & upload images to Cloudinary
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
    // Magic Byte Signature Verification
    if (file.buffer) {
      const { valid, detectedFormat } = isValidImageBuffer(file.buffer);
      if (!valid) {
        logSecurityEvent({
          eventType: "INVALID_FILE_UPLOAD",
          details: `Magic byte header check failed for '${file.originalname}'. Rejected non-image binary payload.`
        });
        throw new Error(
          `Corrupted or invalid image file '${file.originalname}'. Header signature does not match a valid JPG, PNG, or WebP file.`
        );
      }
    }

    try {
      if (isCloudinaryConfigured() && file.buffer) {
        const uniqueId = `paw_${crypto.randomUUID().slice(0, 8)}_${Date.now()}`;
        const res = await uploadBufferToCloudinary(file.buffer, folder, uniqueId);
        return res.secure_url;
      }
    } catch (err) {
      console.warn("⚠️ Cloudinary upload notice, using buffer fallback:", err);
    }

    // Resilient fallback to Data URI
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
  });

  return Promise.all(uploadPromises);
};
