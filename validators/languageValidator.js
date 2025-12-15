const { body } = require("express-validator");

exports.createLanguageValidation = [
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
  body("code").notEmpty().withMessage("Code is required").trim().escape(),
];

exports.updateLanguageValidation = [
  body("name").optional().trim().escape(),
  body("code").optional().trim().escape(),
];

exports.createAccentValidation = [
  body("language_id").notEmpty().withMessage("Language ID is required").isMongoId().withMessage("Invalid Language ID"),
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
];

exports.updateAccentValidation = [
  body("language_id").optional().isMongoId().withMessage("Invalid Language ID"),
  body("name").optional().trim().escape(),
];
