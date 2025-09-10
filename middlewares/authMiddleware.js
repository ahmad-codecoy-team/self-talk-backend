const { verifyAccessToken } = require("../utils/jwt");
const { error } = require("../utils/response");

/**
 * Reads JWT access token from Authorization header:
 *   Authorization: Bearer <accessToken>
 */
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");

  if (scheme !== "Bearer" || !token) {
    return error(res, 401, "Not authenticated");
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { uid: decoded.uid };
    next();
  } catch (_e) {
    return error(res, 401, "Token invalid or expired");
  }
};

module.exports = { requireAuth };
