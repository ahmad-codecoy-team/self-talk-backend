const { body, param } = require("express-validator");

// helpers
const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);

// Validation for creating a subscription plan
const createPlanValidation = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Plan name is required")
    .bail()
    .custom(notArray)
    .withMessage("Plan name must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Plan name must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Plan name cannot be empty"),
  body("status")
    .optional()
    .custom(notArray)
    .withMessage("Status must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Status must be a string")
    .bail()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("price")
    .exists({ checkFalsy: false })
    .withMessage("Price is required")
    .bail()
    .custom(notArray)
    .withMessage("Price must not be an array")
    .bail()
    .isNumeric()
    .withMessage("Price must be a number")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Price must be >= 0"),
  body("billing_period")
    .exists({ checkFalsy: true })
    .withMessage("Billing period is required")
    .bail()
    .custom(notArray)
    .withMessage("Billing period must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Billing period must be a string")
    .bail()
    .isIn(["yearly", "monthly"])
    .withMessage("Billing period must be yearly or monthly"),
  body("voice_minutes")
    .exists({ checkFalsy: false })
    .withMessage("Voice minutes is required")
    .bail()
    .custom(notArray)
    .withMessage("Voice minutes must not be an array")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Voice minutes must be a non-negative integer"),
  body("features")
    .exists({ checkFalsy: true })
    .withMessage("Features are required")
    .bail()
    .isArray({ min: 1 })
    .withMessage("Features must be a non-empty array"),
  body("features.*")
    .custom(isPlainString)
    .withMessage("Each feature must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Each feature must be a non-empty string"),
  body("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required")
    .bail()
    .custom(notArray)
    .withMessage("Description must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description cannot be empty"),
  body("is_popular")
    .optional()
    .custom(notArray)
    .withMessage("is_popular must not be an array")
    .bail()
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
    .custom(notArray)
    .withMessage("Plan name must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Plan name must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Plan name cannot be empty"),
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


module.exports = {
  createPlanValidation,
  updatePlanValidation,
  subscribeValidation,
  addMinutesValidation,
};