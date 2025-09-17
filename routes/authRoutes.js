const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  profile,
  changePassword,
  uploadProfilePicture,
  deleteUser,
} = require("../controllers/authController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { error, success } = require("../utils/response");
const upload = require("../middlewares/upload"); // Multer upload middleware

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyOtpValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require("../validators/authValidator");

const router = express.Router();

// =========================
// Auth Routes
// =========================

router.post("/register", registerValidation, validate, register);
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);
router.post("/login", loginValidation, validate, login);

router.get("/profile", requireAuth, profile);
router.put(
  "/profile",
  requireAuth,
  updateProfileValidation,
  validate,
  profile
);
router.put(
  "/change-password",
  requireAuth,
  changePasswordValidation,
  validate,
  changePassword
);
router.delete("/delete-account", requireAuth, deleteUser);
router.post("/logout", requireAuth, logout);

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword
);

router.post("/verify-reset-otp", verifyOtpValidation, validate, verifyResetOtp);

router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPassword
);

module.exports = router;
