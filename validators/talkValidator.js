// validators/talkValidator.js
const { body, param, query } = require("express-validator");

// helpers
const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);

const createConversationValidation = [
  body("messages")
    .exists({ checkFalsy: true })
    .withMessage("Messages are required")
    .bail()
    .isArray({ min: 1 })
    .withMessage("Messages must be a non-empty array"),
  body("messages.*.role")
    .exists({ checkFalsy: true })
    .withMessage("Message role is required")
    .bail()
    .custom(isPlainString)
    .withMessage("Message role must be a string")
    .bail()
    .isIn(["user", "ai"])
    .withMessage('Message role must be "user" or "ai"'),
  body("messages.*.text")
    .exists({ checkFalsy: true })
    .withMessage("Message text is required")
    .bail()
    .custom(isPlainString)
    .withMessage("Message text must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage("Message text must be between 1 and 4000 characters"),
  body("mood")
    .optional({ nullable: true })
    .custom(notArray)
    .withMessage("Mood must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Mood must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Mood must be between 1 and 50 characters"),
  body("startedAt")
    .optional()
    .custom(notArray)
    .withMessage("StartedAt must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("StartedAt must be a string")
    .bail()
    .isISO8601()
    .withMessage("StartedAt must be a valid ISO 8601 date"),
  body("endedAt")
    .optional()
    .custom(notArray)
    .withMessage("EndedAt must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("EndedAt must be a string")
    .bail()
    .isISO8601()
    .withMessage("EndedAt must be a valid ISO 8601 date"),
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
