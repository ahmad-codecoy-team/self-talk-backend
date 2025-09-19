const { body } = require("express-validator");

// Validation for updating a document
exports.updateDocumentValidation = [
  body("title")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters")
    .trim(),

  body("content")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];