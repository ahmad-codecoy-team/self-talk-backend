const { body } = require("express-validator");

// Create custom support request validation
exports.createCustomSupportValidation = [
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters")
    .trim()
    .escape(),
];