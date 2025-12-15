const { body } = require("express-validator");

// Create prompt validation
exports.createPromptValidation = [
  body("prompt")
    .notEmpty()
    .withMessage("Prompt is required")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Prompt must be between 5 and 5000 characters")
    .trim()
    .escape(),
  body("llmModal")
    .optional()
    .isString()
    .withMessage("LLM Modal must be a string")
    .trim()
    .escape(),
];

// Update prompt validation
exports.updatePromptValidation = [
  body("prompt")
    .notEmpty()
    .withMessage("Prompt is required")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Prompt must be between 5 and 5000 characters")
    .trim()
    .escape(),
  body("llmModal")
    .optional()
    .isString()
    .withMessage("LLM Modal must be a string")
    .trim()
    .escape(),
];