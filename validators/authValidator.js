const { body } = require("express-validator");

// helpers
const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9._]*$/;

// Standard email validation chain for consistency across all auth endpoints
const standardEmailValidation = () => [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email address is required")
    .bail()
    .custom(notArray)
    .withMessage("Email must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address (e.g., user@example.com)")
    .bail()
    .normalizeEmail()
];

const registerValidation = [
  body("username")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a username")
    .bail()
    .custom(notArray)
    .withMessage("Username cannot be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Username must be a text value")
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .bail(),

  ...standardEmailValidation(),

  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a password")
    .bail()
    .custom(notArray)
    .withMessage("Password cannot be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Password must be a text value")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be at least 6 characters long"),

  body("profilePicture")
    .optional()
    .custom(notArray)
    .withMessage("Profile picture path must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Profile picture path must be a string")
    .bail()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith("/uploads/profile_pics/")) {
        throw new Error("Invalid profile picture path");
      }
      return true;
    }),
];

const loginValidation = [
  ...standardEmailValidation(),

  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Please enter your password")
    .bail()
    .custom(notArray)
    .withMessage("Password cannot be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Password must be a text value"),
];

const forgotPasswordValidation = [
  ...standardEmailValidation(),
];

// NEW: for POST /verify-reset-otp
const verifyOtpValidation = [
  ...standardEmailValidation(),

  body("otp")
    .exists({ checkFalsy: true })
    .withMessage("OTP is required")
    .bail()
    .custom(notArray)
    .withMessage("OTP must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("OTP must be a string")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("OTP must be exactly 6 digits"),
];

// UPDATED: for POST /reset-password (email and newPassword required - OTP already verified)
const resetPasswordValidation = [
  ...standardEmailValidation(),

  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .bail()
    .custom(notArray)
    .withMessage("New password must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("New password must be a string")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be at least 6 characters long"),
];

// UPDATE PROFILE VALIDATION
const updateProfileValidation = [
  body("username")
    .optional()
    .custom(notArray)
    .withMessage("Username must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Username must be a string")
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters long")
    .bail()
    .matches(USERNAME_RE)
    .withMessage(
      "Username must start with a letter and may contain letters, numbers, underscores, or dots"
    ),

  body("profilePicture")
    .optional({ nullable: true })
    .custom(notArray)
    .withMessage("Profile picture path must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Profile picture path must be a string")
    .bail()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith("/uploads/profile_pics/")) {
        throw new Error("Invalid profile picture path");
      }
      return true;
    }),

  body("voice_id")
    .optional({ nullable: true })
    .custom(notArray)
    .withMessage("Voice ID must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Voice ID must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Voice ID must be between 1 and 100 characters"),

  body("model_id")
    .optional({ nullable: true })
    .custom(notArray)
    .withMessage("Model ID must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Model ID must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Model ID must be between 1 and 100 characters"),
];

// CHANGE PASSWORD VALIDATION
const changePasswordValidation = [
  body("oldPassword")
    .exists({ checkFalsy: true })
    .withMessage("Current password is required")
    .bail()
    .custom(notArray)
    .withMessage("Current password must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Current password must be a string"),

  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .bail()
    .custom(notArray)
    .withMessage("New password must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("New password must be a string")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be at least 6 characters long"),
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation, // ← export new validator
  resetPasswordValidation, // ← updated to new fields
  updateProfileValidation,
  changePasswordValidation,
};
