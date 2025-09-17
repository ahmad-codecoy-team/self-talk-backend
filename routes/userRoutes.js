const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  updateProfileValidation,
  changePasswordValidation,
} = require("../validators/authValidator");

const router = express.Router();

// =========================
// User Routes (Protected)
// =========================

router.get("/profile", requireAuth, getProfile);
router.put(
  "/profile",
  requireAuth,
  updateProfileValidation,
  validate,
  updateProfile
);
router.put(
  "/change-password",
  requireAuth,
  changePasswordValidation,
  validate,
  changePassword
);
router.delete("/delete-account", requireAuth, deleteAccount);

module.exports = router;