const express = require("express");
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getAllUsers,
  toggleUserSuspension,
} = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  createPlanValidation,
  updatePlanValidation,
} = require("../validators/subscriptionValidator");

const router = express.Router();

// =================== ADMIN SUBSCRIPTION PLAN MANAGEMENT ===================

// Create a new subscription plan (Admin only)
router.post("/plans", requireAuth, requireAdmin, createPlanValidation, validate, createPlan);

// Get all subscription plans (Admin only)
router.get("/plans", requireAuth, requireAdmin, getAllPlans);

// Get single subscription plan by ID (Admin only)
router.get("/plans/:id", requireAuth, requireAdmin, getPlanById);

// Update subscription plan (Admin only)
router.put("/plans/:id", requireAuth, requireAdmin, updatePlanValidation, validate, updatePlan);

// Delete subscription plan (Admin only)
router.delete("/plans/:id", requireAuth, requireAdmin, deletePlan);

// =================== ADMIN USER MANAGEMENT ===================

// Get all users with pagination (Admin only)
router.get("/users", requireAuth, requireAdmin, getAllUsers);

// Toggle user suspension (Admin only)
router.put("/users/suspension/:id", requireAuth, requireAdmin, toggleUserSuspension);

module.exports = router;