// routes/talkRoutes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  createConversationValidation,
  listConversationsValidation,
  conversationIdParamValidation,
} = require("../validators/talkValidator");

const ctrl = require("../controllers/talkController");

router.use(requireAuth);

// Create conversation (fake data allowed, but must match schema)
router.post(
  "/conversations",
  createConversationValidation,
  validate,
  ctrl.createConversation
);

// List conversations for current user
router.get(
  "/conversations",
  listConversationsValidation,
  validate,
  ctrl.listConversations
);

// Get single conversation (transcript)
router.get(
  "/conversations/:id",
  conversationIdParamValidation,
  validate,
  ctrl.getConversation
);

// Delete conversation (enable now or later)
router.delete(
  "/conversations/:id",
  conversationIdParamValidation,
  validate,
  ctrl.deleteConversation
);

module.exports = router;
