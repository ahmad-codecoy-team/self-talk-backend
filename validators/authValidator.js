const { body } = require("express-validator");

// helpers
const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9._]*$/;

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
    .bail()
    .matches(USERNAME_RE)
    .withMessage(
      "Username must start with a letter and can only contain letters, numbers, periods, or underscores"
    ),

  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Please provide an email address")
    .bail()
    .custom(notArray)
    .withMessage("Email cannot be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Email must be a text value")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address (e.g., user@example.com)")
    .bail()
    .normalizeEmail(),

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
    .withMessage("Password must be at least 6 characters long")
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
];

const loginValidation = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Please enter your email address")
    .bail()
    .custom(notArray)
    .withMessage("Email cannot be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Email must be a text value")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .bail()
    .normalizeEmail(),

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
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .custom(notArray)
    .withMessage("Email must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .bail()
    .normalizeEmail(),
];

// NEW: for POST /verify-reset-otp
const verifyOtpValidation = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .custom(notArray)
    .withMessage("Email must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .bail()
    .normalizeEmail(),

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

// UPDATED: for POST /reset-password (now uses resetToken and confirmNewPassword)
const resetPasswordValidation = [
  body("resetToken")
    .exists({ checkFalsy: true })
    .withMessage("Reset token is required")
    .bail()
    .custom(notArray)
    .withMessage("Reset token must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Reset token must be a string"),

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
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("confirmNewPassword")
    .exists({ checkFalsy: true })
    .withMessage("Confirm password is required")
    .bail()
    .custom(notArray)
    .withMessage("Confirm password must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Confirm password must be a string")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
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
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),

  body("confirmNewPassword")
    .exists({ checkFalsy: true })
    .withMessage("Confirm new password is required")
    .bail()
    .custom(notArray)
    .withMessage("Confirm new password must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Confirm new password must be a string")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    }),
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
