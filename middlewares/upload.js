const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profile_pics/";

    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    const filename = Date.now() + ext; // Add timestamp for unique file name
    cb(null, filename); // Save the file with this name
  },
});

// Filter for file types (only images allowed)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Only image files are allowed!");
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // Limit size to 30MB
  fileFilter: fileFilter,
});

module.exports = upload;
