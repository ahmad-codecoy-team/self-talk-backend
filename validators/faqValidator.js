const { body, param } = require("express-validator");

const isPlainString = (v) => typeof v === "string";
const notArray = (v) => !Array.isArray(v);

const createFAQValidation = [
  body("category")
    .exists({ checkFalsy: true })
    .withMessage("Category is required")
    .bail()
    .custom(notArray)
    .withMessage("Category must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Category must be a string")
    .bail()
    .isIn(["General", "Account", "Billing", "Features", "Technical"])
    .withMessage("Category must be one of: General, Account, Billing, Features, Technical"),
  body("question")
    .exists({ checkFalsy: true })
    .withMessage("Question is required")
    .bail()
    .custom(notArray)
    .withMessage("Question must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Question must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Question cannot be empty"),
  body("answer")
    .exists({ checkFalsy: true })
    .withMessage("Answer is required")
    .bail()
    .custom(notArray)
    .withMessage("Answer must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Answer must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Answer cannot be empty"),
];

const updateFAQValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid FAQ ID"),
  body("category")
    .optional()
    .custom(notArray)
    .withMessage("Category must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Category must be a string")
    .bail()
    .isIn(["General", "Account", "Billing", "Features", "Technical"])
    .withMessage("Category must be one of: General, Account, Billing, Features, Technical"),
  body("question")
    .optional()
    .custom(notArray)
    .withMessage("Question must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Question must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Question cannot be empty"),
  body("answer")
    .optional()
    .custom(notArray)
    .withMessage("Answer must not be an array")
    .bail()
    .custom(isPlainString)
    .withMessage("Answer must be a string")
    .bail()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Answer cannot be empty"),
];

module.exports = {
  createFAQValidation,
  updateFAQValidation,
};