import cloudinaryAdapter from "../adapters/storage/cloudinary.adapter.js";

/**
 * Storage Service
 * Centralized service to handle all file storage operations.
 * This pattern allows us to switch from Cloudinary to S3/GCP 
 * by simply swapping the internal adapter.
 */
class StorageService {
  /**
   * Upload a file
   * @param {Buffer} fileBuffer 
   * @param {string} originalName 
   * @param {string} folder 
   */
  async upload(fileBuffer, originalName, folder) {
    // Current default is Cloudinary
    return await cloudinaryAdapter.uploadFile(fileBuffer, originalName, folder);
  }

  /**
   * Delete a file
   * @param {string} publicId 
   */
  async delete(publicId) {
    return await cloudinaryAdapter.deleteFile(publicId);
  }
}

export default new StorageService();
