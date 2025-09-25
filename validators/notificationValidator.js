const { body, param } = require("express-validator");

const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);

const createNotificationValidation = [
  body("title")
    .exists({ checkFalsy: true })
    .withMessage("Title is required")
    .bail()
    .custom(notArray)
    .withMessage("Title must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("type")
    .exists({ checkFalsy: true })
    .withMessage("Type is required")
    .bail()
    .custom(notArray)
    .withMessage("Type must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Type must be a string")
    .bail()
    .isIn(["Info", "Success", "Warning", "Error"])
    .withMessage("Type must be one of: Info, Success, Warning, Error"),
  body("message")
    .exists({ checkFalsy: true })
    .withMessage("Message is required")
    .bail()
    .custom(notArray)
    .withMessage("Message must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Message must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Message must be between 1 and 500 characters"),
  body("target_audience")
    .exists({ checkFalsy: true })
    .withMessage("Target audience is required")
    .bail()
    .custom(notArray)
    .withMessage("Target audience must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Target audience must be a string")
    .bail()
    .isIn(["All Users", "Active Users", "Premium Users", "Free Users"])
    .withMessage("Target audience must be one of: All Users, Active Users, Premium Users, Free Users"),
];

const updateNotificationValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid notification ID"),
  body("title")
    .optional()
    .custom(notArray)
    .withMessage("Title must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("type")
    .optional()
    .custom(notArray)
    .withMessage("Type must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Type must be a string")
    .bail()
    .isIn(["Info", "Success", "Warning", "Error"])
    .withMessage("Type must be one of: Info, Success, Warning, Error"),
  body("message")
    .optional()
    .custom(notArray)
    .withMessage("Message must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Message must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Message must be between 1 and 500 characters"),
  body("target_audience")
    .optional()
    .custom(notArray)
    .withMessage("Target audience must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Target audience must be a string")
    .bail()
    .isIn(["All Users", "Active Users", "Premium Users", "Free Users"])
    .withMessage("Target audience must be one of: All Users, Active Users, Premium Users, Free Users"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
];

module.exports = {
  createNotificationValidation,
  updateNotificationValidation,
};