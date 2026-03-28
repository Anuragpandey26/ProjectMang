import multer from "multer";

/**
 * Configure Multer with memory storage
 * Files are kept as buffers before streaming to Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * File Filter
 * Adjust this to restrict or allow specific file types
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Images, PDFs, and Word documents are allowed."), false);
  }
};

/**
 * Upload Middleware
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit per file
  },
});

export default upload;
