const { verifyAccessToken } = require("../utils/jwt");
const { error } = require("../utils/response");
const User = require("../models/User");

/**
 * Reads JWT access token from Authorization header:
 *   Authorization: Bearer <accessToken>
 */
const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");

  if (scheme !== "Bearer" || !token) {
    return error(res, 401, "Not authenticated");
  }

  try {
    const decoded = verifyAccessToken(token);

    // Check if user is suspended
    const user = await User.findById(decoded.uid).select("is_suspended");
    if (!user) {
      return error(res, 401, "User not found");
    }

    if (user.is_suspended) {
      return error(res, 403, "Your account has been suspended. Please contact support for assistance.");
    }

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
    const user = await User.findById(userId).populate("role");

    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.role || user.role.name !== "admin") {
      return error(res, 403, "Admin access required");
    }

    next();
  } catch (err) {
    return error(res, 500, "Server error", { detail: err.message });
  }
};

module.exports = { requireAuth, requireAdmin };
