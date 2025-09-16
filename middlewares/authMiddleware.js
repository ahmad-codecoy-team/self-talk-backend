const { verifyAccessToken } = require("../utils/jwt");
const { error } = require("../utils/response");
const User = require("../models/User");

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

/**
 * Middleware to check if the authenticated user is an admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId).select("is_admin");

    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.is_admin) {
      return error(res, 403, "Admin access required");
    }

    next();
  } catch (err) {
    return error(res, 500, "Server error", { detail: err.message });
  }
};

module.exports = { requireAuth, requireAdmin };
