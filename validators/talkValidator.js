// validators/talkValidator.js
const { body, param, query } = require("express-validator");

const createConversationValidation = [
  body("messages")
    .isArray({ min: 1 })
    .withMessage("messages must be a non-empty array"),
  body("messages.*.role")
    .isIn(["user", "ai"])
    .withMessage('each message.role must be "user" or "ai"'),
  body("messages.*.text")
    .isString()
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage("each message.text is required (1..4000)"),
  body("mood")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("mood must be a short string"),
  body("startedAt")
    .optional()
    .isISO8601()
    .withMessage("startedAt must be ISO date"),
  body("endedAt")
    .optional()
    .isISO8601()
    .withMessage("endedAt must be ISO date"),
];

const listConversationsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const conversationIdParamValidation = [
  param("id").isMongoId().withMessage("Invalid conversation id"),
];

module.exports = {
  createConversationValidation,
  listConversationsValidation,
  conversationIdParamValidation,
};
