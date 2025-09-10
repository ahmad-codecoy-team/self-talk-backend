const { validationResult } = require("express-validator");
const { error } = require("../utils/response");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};

    // express-validator v7 uses `path`, older uses `param`
    errors.array().forEach((err) => {
      const field = err.path || err.param || "unknown";

      // Only keep the first error per field
      if (!formattedErrors[field]) {
        formattedErrors[field] = err.msg;
      }
    });

    return error(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

module.exports = validate;
