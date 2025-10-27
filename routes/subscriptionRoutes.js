const express = require("express");
const {
  getUserSubscription,
  buySubscription,
  addMinutes,
  getActivePlans,
  checkSubscriptionExpiry,
  updateRecordings,
} = require("../controllers/subscriptionController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  buySubscriptionValidation,
  addMinutesValidation,
  updateRecordingsValidation,
} = require("../validators/subscriptionValidator");

const router = express.Router();

// =================== USER ROUTES ===================
// User subscription management

// Get user's current subscription details with full user profile
router.get("/my-subscription", requireAuth, getUserSubscription);

// Buy/Subscribe to a plan (replaces old subscription)
router.post(
  "/subscribe",
  requireAuth,
  buySubscriptionValidation,
  validate,
  buySubscription
);

// Add minutes to user account (0.99€ per minute)
router.post(
  "/add-minutes",
  requireAuth,
  addMinutesValidation,
  validate,
  addMinutes
);

// Check and handle subscription expiry (always downgrades to Free)
router.post("/check-expiry", requireAuth, checkSubscriptionExpiry);

// Update recordings in subscription (internal use)
router.post(
  "/update-recordings",
  requireAuth,
  updateRecordingsValidation,
  validate,
  updateRecordings
);

// Get all active plans (for users to see available options)
router.get("/plans", getActivePlans);

module.exports = router;
