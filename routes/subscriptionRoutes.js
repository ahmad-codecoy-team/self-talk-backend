const express = require("express");
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getUserSubscription,
  updateUserVoiceModel,
  subscribeToPlan,
  addMinutes,
  getActivePlans,
} = require("../controllers/subscriptionController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  createPlanValidation,
  updatePlanValidation,
  subscribeValidation,
  addMinutesValidation,
  updateVoiceModelValidation,
} = require("../validators/subscriptionValidator");

const router = express.Router();

// =================== ADMIN ROUTES ===================
// Admin CRUD operations for subscription plans

// Create a new subscription plan (Admin only)
router.post("/admin/plans", requireAuth, requireAdmin, createPlanValidation, validate, createPlan);

// Get all subscription plans (Admin only)
router.get("/admin/plans", requireAuth, requireAdmin, getAllPlans);

// Get single subscription plan by ID (Admin only)
router.get("/admin/plans/:id", requireAuth, requireAdmin, getPlanById);

// Update subscription plan (Admin only)
router.put("/admin/plans/:id", requireAuth, requireAdmin, updatePlanValidation, validate, updatePlan);

// Delete subscription plan (Admin only)
router.delete("/admin/plans/:id", requireAuth, requireAdmin, deletePlan);

// =================== USER ROUTES ===================
// User subscription management

// Get user's current subscription details
router.get("/my-subscription", requireAuth, getUserSubscription);

// Update user's voice_id and model_id
router.put("/voice-model", requireAuth, updateVoiceModelValidation, validate, updateUserVoiceModel);

// Subscribe to a plan
router.post("/subscribe", requireAuth, subscribeValidation, validate, subscribeToPlan);

// Add minutes to user account
router.post("/add-minutes", requireAuth, addMinutesValidation, validate, addMinutes);

// Get all active plans (for users to see available options)
router.get("/plans", getActivePlans);

module.exports = router;