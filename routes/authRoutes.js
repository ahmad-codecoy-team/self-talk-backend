const express = require("express");
const {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
} = require("../controllers/authController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { error, success } = require("../utils/response");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyOtpValidation,
} = require("../validators/authValidator");

const router = express.Router();

// =========================
// Auth Routes
// =========================
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

router.get("/me", requireAuth, me);
router.post("/logout", logout);

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

// =========================
// Temporary Test Route
// =========================
router.post("/test-get-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const User = require("../models/User");
    const user = await User.findOne({ email });

    if (!user || !user.resetOTP) {
      return error(res, 404, "No OTP found for this email");
    }

    return success(res, 200, "OTP fetched successfully", {
      otp: user.resetOTP,
      expires: user.resetOTPExp,
    });
  } catch (err) {
    return error(res, 500, "Server error", { detail: err.message });
  }
});

module.exports = router;
