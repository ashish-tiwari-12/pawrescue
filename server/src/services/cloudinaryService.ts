import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Read environment variables (supports standard & custom user spellings)
const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.CLODINARY_CLOUD_NAME ||
  "ddlnny6dg";

const api_key =
  process.env.CLOUDINARY_API_KEY ||
  process.env.CLODINARY_API_KEY ||
  "647881943231376";

const api_secret =
  process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_API_SECRET_KEY ||
  process.env.CLODINARY_API_SECRET_KEY ||
  "ijzoHY_e58MZ1FrpRkSJJjrS3vI";

// Initialize Cloudinary SDK
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true
});

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(cloud_name && api_key && api_secret);
};

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

/**
 * Upload an in-memory buffer (from Multer memoryStorage) directly to Cloudinary
 * @param buffer - File Buffer
 * @param folder - Target collection/folder in Cloudinary (e.g. "pawrescue/complaints")
 * @param filename - Optional custom public ID
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = "pawrescue/general",
  filename?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: "auto",
        transformation: [
          { quality: "auto:good", fetch_format: "auto" } // Automatic WebP/AVIF optimization
        ]
      },
      (error, result) => {
        if (error || !result) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(error || new Error("Failed to upload image to Cloudinary"));
        }
        console.log("☁️ Image uploaded to Cloudinary:", result.secure_url);
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    // Pipe the buffer stream into Cloudinary upload stream
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a Base64 data URI or image URL directly to Cloudinary
 */
export const uploadBase64ToCloudinary = async (
  base64OrUrl: string,
  folder: string = "pawrescue/general"
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(base64OrUrl, {
      folder,
      resource_type: "auto",
      transformation: [{ quality: "auto:good", fetch_format: "auto" }]
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary base64 upload failed:", error);
    throw error;
  }
};

export default cloudinary;
