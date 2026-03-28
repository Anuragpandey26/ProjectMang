import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryAdapter {
  constructor() {
    this.name = "Cloudinary";
  }

  /**
   * Upload a file to Cloudinary
   * @param {Buffer} fileBuffer - The file data
   * @param {string} originalName - Original filename
   * @param {string} folder - Destination folder (e.g., 'tasks', 'projects')
   * @returns {Promise<{url: string, publicId: string, size: number, type: string}>}
   */
  async uploadFile(fileBuffer, originalName, folder = "catalyst") {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `catalyst/${folder}`,
          resource_type: "auto", // Automatically detect if it's image, pdf, raw, etc.
          public_id: originalName.split(".")[0] + "_" + Date.now(),
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(new Error("Failed to upload file to Cloudinary"));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            size: result.bytes,
            type: result.format || result.resource_type,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - The unique Cloudinary ID
   * @returns {Promise<boolean>}
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      return false;
    }
  }
}

export default new CloudinaryAdapter();
