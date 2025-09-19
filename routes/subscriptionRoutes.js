const express = require("express");
const {
  getUserSubscription,
  subscribeToPlan,
  addMinutes,
  getActivePlans,
} = require("../controllers/subscriptionController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  subscribeValidation,
  addMinutesValidation,
} = require("../validators/subscriptionValidator");

const router = express.Router();

// =================== USER ROUTES ===================
// User subscription management

// Get user's current subscription details
router.get("/my-subscription", requireAuth, getUserSubscription);


// Subscribe to a plan
router.post("/subscribe", requireAuth, subscribeValidation, validate, subscribeToPlan);

// Add minutes to user account
router.post("/add-minutes", requireAuth, addMinutesValidation, validate, addMinutes);

// Get all active plans (for users to see available options)
router.get("/plans", getActivePlans);

module.exports = router;