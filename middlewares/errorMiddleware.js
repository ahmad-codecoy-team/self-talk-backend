const { error } = require("../utils/response");

const errorHandler = (err, req, res, _next) => {
  console.error("❌ ERROR:", err.stack);

  // If response already sent by controller, skip
  if (res.headersSent) {
    return _next(err);
  }

  return error(res, 500, err.message || "Server error");
};

module.exports = { errorHandler };
