import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";

const uuidv4 = () => crypto.randomUUID();

// In serverless environments (e.g. Vercel/AWS Lambda), use /tmp directory
export const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.resolve("uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn("Upload directory creation notice:", e);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (err) {
      // Ignore in read-only setups
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `paw-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5
  }
});
