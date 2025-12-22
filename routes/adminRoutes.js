const express = require("express");
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getAllUsers,
  toggleUserSuspension,
  deleteUserElevenLabsData,
  bulkUserActions,
  adminBuySubscriptionForUser,
  createFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
  getAllDocuments,
  getDocumentById,
  getDocumentBySlug,
  updateDocument,
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  createPrompt,
  getAdminPrompt,
  updatePrompt,
  getAllCustomSupportRequests,
  createLanguage,
  getAllLanguages,
  updateLanguage,
  deleteLanguage,
  createAccent,
  getAllAccents,
  updateAccent,
  deleteAccent,
} = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  createPlanValidation,
  updatePlanValidation,
} = require("../validators/subscriptionValidator");

const {
  createFAQValidation,
  updateFAQValidation,
} = require("../validators/faqValidator");

const { updateDocumentValidation } = require("../validators/documentValidator");

const {
  createNotificationValidation,
  updateNotificationValidation,
} = require("../validators/notificationValidator");

const {
  createPromptValidation,
  updatePromptValidation,
} = require("../validators/promptValidator");

const {
  createLanguageValidation,
  updateLanguageValidation,
  createAccentValidation,
  updateAccentValidation,
} = require("../validators/languageValidator");

const router = express.Router();

// =================== ADMIN SUBSCRIPTION PLAN MANAGEMENT ===================

// Create a new subscription plan (Admin only)
// router.post("/plans", requireAuth, requireAdmin, createPlanValidation, validate, createPlan);

// Get all subscription plans (Admin only)
// router.get("/plans", requireAuth, requireAdmin, getAllPlans);

// Get single subscription plan by ID (Admin only)
// router.get("/plans/:id", requireAuth, requireAdmin, getPlanById);

// Update subscription plan (Admin only)
// router.put("/plans/:id", requireAuth, requireAdmin, updatePlanValidation, validate, updatePlan);

// Delete subscription plan (Admin only)
// router.delete("/plans/:id", requireAuth, requireAdmin, deletePlan);

// =================== ADMIN USER MANAGEMENT ===================

// Get all users with pagination (Admin only)
router.get("/users", requireAuth, requireAdmin, getAllUsers);

// Toggle user suspension (Admin only)
router.put(
  "/users/suspension/:id",
  requireAuth,
  requireAdmin,
  toggleUserSuspension
);

// Delete user's ElevenLabs data only (Admin only)
router.delete(
  "/users/:id/elevenlabs",
  requireAuth,
  requireAdmin,
  deleteUserElevenLabsData
);

// Bulk actions for users (Admin only)
router.post(
  "/users/bulk-actions",
  requireAuth,
  requireAdmin,
  bulkUserActions
);

// Admin purchase subscription for user (Admin only)
router.post(
  "/users/buy-subscription",
  requireAuth,
  requireAdmin,
  adminBuySubscriptionForUser
);

// =================== ADMIN FAQ MANAGEMENT ===================

// Create a new FAQ (Admin only)
router.post(
  "/faq",
  requireAuth,
  requireAdmin,
  createFAQValidation,
  validate,
  createFAQ
);

// Get all FAQs (Admin only)
router.get("/faq", requireAuth, requireAdmin, getAllFAQs);

// Get single FAQ by ID (Admin only)
router.get("/faq/:id", requireAuth, requireAdmin, getFAQById);

// Update FAQ (Admin only)
router.put(
  "/faq/:id",
  requireAuth,
  requireAdmin,
  updateFAQValidation,
  validate,
  updateFAQ
);

// Delete FAQ (Admin only)
router.delete("/faq/:id", requireAuth, requireAdmin, deleteFAQ);

// =================== ADMIN DOCUMENT MANAGEMENT ===================

// Get all documents (Admin only)
router.get("/documents", requireAuth, requireAdmin, getAllDocuments);

// Get single document by ID (Admin only)
router.get("/documents/:id", requireAuth, requireAdmin, getDocumentById);

// Get single document by slug (Admin only)
router.get(
  "/documents/slug/:slug",
  requireAuth,
  requireAdmin,
  getDocumentBySlug
);

// Update document (Admin only)
router.put(
  "/documents/:id",
  requireAuth,
  requireAdmin,
  updateDocumentValidation,
  validate,
  updateDocument
);

// =================== ADMIN NOTIFICATION MANAGEMENT ===================

// Create a new notification (Admin only)
router.post(
  "/notifications",
  requireAuth,
  requireAdmin,
  createNotificationValidation,
  validate,
  createNotification
);

// Get all notifications with pagination (Admin only)
router.get("/notifications", requireAuth, requireAdmin, getAllNotifications);

// Get single notification by ID (Admin only)
router.get(
  "/notifications/:id",
  requireAuth,
  requireAdmin,
  getNotificationById
);

// Update notification (Admin only)
router.put(
  "/notifications/:id",
  requireAuth,
  requireAdmin,
  updateNotificationValidation,
  validate,
  updateNotification
);

// Delete notification (Admin only)
router.delete(
  "/notifications/:id",
  requireAuth,
  requireAdmin,
  deleteNotification
);

// =================== ADMIN PROMPT MANAGEMENT ===================

// Create a new prompt (Admin only)
router.post(
  "/prompt",
  requireAuth,
  requireAdmin,
  createPromptValidation,
  validate,
  createPrompt
);

// Get the global prompt (Admin only)
router.get("/prompt", requireAuth, requireAdmin, getAdminPrompt);

// Update the global prompt (Admin only)
router.put(
  "/prompt",
  requireAuth,
  requireAdmin,
  updatePromptValidation,
  validate,
  updatePrompt
);

// =================== ADMIN LANGUAGE MANAGEMENT ===================

// Create a new language (Admin only)
router.post(
  "/languages",
  requireAuth,
  requireAdmin,
  createLanguageValidation,
  validate,
  createLanguage
);

// Get all languages (Admin only)
router.get("/languages", requireAuth, requireAdmin, getAllLanguages);

// Update language (Admin only)
router.put(
  "/languages/:id",
  requireAuth,
  requireAdmin,
  updateLanguageValidation,
  validate,
  updateLanguage
);

// Delete language (Admin only)
router.delete("/languages/:id", requireAuth, requireAdmin, deleteLanguage);

// =================== ADMIN ACCENT MANAGEMENT ===================

// Create a new accent (Admin only)
router.post(
  "/accents",
  requireAuth,
  requireAdmin,
  createAccentValidation,
  validate,
  createAccent
);

// Get all accents (Admin only)
router.get("/accents", requireAuth, requireAdmin, getAllAccents);

// Update accent (Admin only)
router.put(
  "/accents/:id",
  requireAuth,
  requireAdmin,
  updateAccentValidation,
  validate,
  updateAccent
);

// Delete accent (Admin only)
router.delete("/accents/:id", requireAuth, requireAdmin, deleteAccent);

// =================== ADMIN CUSTOM SUPPORT MANAGEMENT ===================

// Get all custom support requests (Admin only)
router.get("/support", requireAuth, requireAdmin, getAllCustomSupportRequests);

module.exports = router;
