const { error } = require("../utils/response");
const multer = require("multer");

const errorHandler = (err, req, res, _next) => {
  console.error("❌ ERROR:", err.stack);

  // If response already sent by controller, skip
  if (res.headersSent) {
    return _next(err);
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = {};
    Object.keys(err.errors).forEach((field) => {
      validationErrors[field] = err.errors[field].message;
    });
    return error(res, 400, "Validation failed", validationErrors);
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    if (field === 'email') {
      return error(res, 409, "Registration failed", {
        email: "An account with this email already exists"
      });
    } else if (field === 'username') {
      return error(res, 409, "Registration failed", {
        username: "This username is already taken"
      });
    }
    return error(res, 409, `${field} already exists`);
  }

  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return error(res, 400, "Invalid data format provided");
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 401, "Authentication failed", {
      auth: "Invalid or malformed token"
    });
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 401, "Authentication failed", {
      auth: "Token has expired, please log in again"
    });
  }

  // Handle multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 413, "File upload failed", {
        profilePicture: "File size too large. Maximum allowed size is 10MB"
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return error(res, 400, "File upload failed", {
        profilePicture: "Unexpected file field or too many files"
      });
    }
    return error(res, 400, "File upload failed", {
      profilePicture: err.message
    });
  }

  // Handle file filter errors from multer
  if (typeof err === 'string' && err.includes('Only image files are allowed')) {
    return error(res, 400, "File upload failed", {
      profilePicture: "Only image files (JPEG, JPG, PNG, GIF) are allowed"
    });
  }

  // Generic server errors (don't expose internal error messages in production)
  const message = process.env.NODE_ENV === 'production'
    ? "An unexpected error occurred. Please try again later."
    : err.message || "Server error";

  return error(res, 500, message);
};

module.exports = { errorHandler };
