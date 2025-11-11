const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getDocumentBySlug,
  getPublishedDocuments,
  getMyNotifications,
  getPublicFAQs,
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

// Get user notifications (Protected)
router.get("/notifications", requireAuth, getMyNotifications);

// Get all FAQs (Public access)
router.get("/faqs", getPublicFAQs);

// =========================
// Public Document Routes
// =========================

// Get all published documents (Public access - no auth required)
router.get("/documents", getPublishedDocuments);

// Get single published document by slug (Public access - no auth required)
router.get("/documents/:slug", getDocumentBySlug);

module.exports = router;
