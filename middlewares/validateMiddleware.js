const { validationResult } = require("express-validator");
const { error } = require("../utils/response");

const validate = (req, res, next) => {
  // Check if req.body is undefined (middleware order issue)
  if (!req.body) {
    return error(res, 400, "Request body is required", {
      general: "No data provided in request body. Ensure Content-Type is application/json"
    });
  }

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
