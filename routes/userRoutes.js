const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getDocumentBySlug,
  getPublishedDocuments,
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

// =========================
// Public Document Routes
// =========================

// Get all published documents (Public access - no auth required)
router.get("/documents", getPublishedDocuments);

// Get single published document by slug (Public access - no auth required)
router.get("/documents/:slug", getDocumentBySlug);

module.exports = router;