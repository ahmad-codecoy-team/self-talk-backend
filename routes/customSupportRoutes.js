const express = require("express");
const {
  createCustomSupportRequest,
  getUserSupportRequests,
  getSupportRequestById,
} = require("../controllers/customSupportController");
const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  createCustomSupportValidation,
} = require("../validators/customSupportValidator");

const router = express.Router();

// =========================
// Custom Support Routes (Protected)
// =========================

// POST - Create a new support request
router.post(
  "/",
  requireAuth,
  createCustomSupportValidation,
  validate,
  createCustomSupportRequest
);

// GET - Get user's support requests with pagination and filtering
router.get("/", requireAuth, getUserSupportRequests);

// GET - Get single support request by ID
router.get("/:id", requireAuth, getSupportRequestById);

module.exports = router;