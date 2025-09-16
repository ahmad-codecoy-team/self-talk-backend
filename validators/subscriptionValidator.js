const { body, param } = require("express-validator");

// Validation for creating a subscription plan
const createPlanValidation = [
  body("name")
    .isIn(["Free", "Premium", "Super"])
    .withMessage("Plan name must be Free, Premium, or Super"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price must be >= 0"),
  body("billing_period")
    .isIn(["yearly", "monthly"])
    .withMessage("Billing period must be yearly or monthly"),
  body("voice_minutes")
    .isInt({ min: 0 })
    .withMessage("Voice minutes must be a non-negative integer"),
  body("features")
    .isArray({ min: 1 })
    .withMessage("Features must be a non-empty array"),
  body("features.*")
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Each feature must be a non-empty string"),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description is required"),
  body("is_popular")
    .optional()
    .isBoolean()
    .withMessage("is_popular must be a boolean"),
];

// Validation for updating a subscription plan
const updatePlanValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid plan ID"),
  body("name")
    .optional()
    .isIn(["Free", "Premium", "Super"])
    .withMessage("Plan name must be Free, Premium, or Super"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price must be >= 0"),
  body("billing_period")
    .optional()
    .isIn(["yearly", "monthly"])
    .withMessage("Billing period must be yearly or monthly"),
  body("voice_minutes")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Voice minutes must be a non-negative integer"),
  body("features")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Features must be a non-empty array"),
  body("features.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Each feature must be a non-empty string"),
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description cannot be empty"),
  body("is_popular")
    .optional()
    .isBoolean()
    .withMessage("is_popular must be a boolean"),
];

// Validation for subscribing to a plan
const subscribeValidation = [
  body("plan_id")
    .isMongoId()
    .withMessage("Invalid plan ID"),
];

// Validation for adding minutes
const addMinutesValidation = [
  body("minutes")
    .isInt({ min: 1 })
    .withMessage("Minutes must be a positive integer"),
];

// Validation for updating voice and model
const updateVoiceModelValidation = [
  body("voice_id")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Voice ID must be a non-empty string"),
  body("model_id")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Model ID must be a non-empty string"),
];

module.exports = {
  createPlanValidation,
  updatePlanValidation,
  subscribeValidation,
  addMinutesValidation,
  updateVoiceModelValidation,
};