const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { success, error } = require("../utils/response");
const { sendEmail } = require("../utils/emailService");

// Access token: 30 days
const ACCESS_EXPIRES = "30d";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

// Reset token (short-lived, for final password reset step)
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || "change_me";
const RESET_TOKEN_EXPIRES = "15m"; // 15 minutes

// Helpers
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
function signResetToken(payload) {
  return jwt.sign(payload, JWT_RESET_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES,
  });
}
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
function constantTimeEq(a, b) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// =================== REGISTER ===================
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return error(res, 400, "Username, email & password are required");
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return error(res, 409, "Email already in use");

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return error(res, 409, "Username already taken");

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = signAccessToken({ uid: user._id });

    return success(res, 201, "Registered successfully", {
      user: { _id: user._id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// =================== LOGIN ===================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, 400, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return error(res, 400, "Invalid credentials");

    const accessToken = signAccessToken({ uid: user._id });

    return success(res, 200, "Logged in successfully", {
      user: { _id: user._id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// =================== ME ===================
exports.me = async (req, res) => {
  return success(res, 200, "User info fetched", {
    _id: req.user.uid,
  });
};

// =================== LOGOUT ===================
exports.logout = async (_req, res) => {
  return success(res, 200, "Logged out successfully");
};

// =================== FORGOT PASSWORD ===================
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email });

    // Always respond success (no enumeration)
    if (!user) {
      return success(
        res,
        200,
        "If that email exists, you will receive a reset code"
      );
    }

    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const exp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      { $set: { resetOTP: hashed, resetOTPExp: exp } },
      { upsert: false, runValidators: false }
    );

    await sendEmail(
      user.email,
      "SelfTalk Password Reset Code",
      `Hi,\n\nWe received a request to reset your password. Your code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn’t request this, you can ignore this email.\n\n— The SelfTalk Team`
    );

    return success(
      res,
      200,
      "If that email exists, you will receive a reset code"
    );
  } catch (err) {
    next(err);
  }
};

// =================== VERIFY RESET OTP ===================
exports.verifyResetOtp = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return error(res, 400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || !user.resetOTPExp) {
      return error(res, 400, "Invalid or expired code");
    }

    if (user.resetOTPExp.getTime() < Date.now()) {
      return error(res, 400, "Invalid or expired code");
    }

    const providedHash = hashOtp(otp);
    if (!constantTimeEq(providedHash, user.resetOTP)) {
      return error(res, 400, "Invalid or expired code");
    }

    // ✅ Clear OTP using updateOne (avoids password validation)
    await User.updateOne(
      { _id: user._id },
      { $set: { resetOTP: null, resetOTPExp: null } }
    );

    const resetToken = signResetToken({
      uid: user._id.toString(),
      email: user.email,
      purpose: "password_reset",
    });

    return success(res, 200, "Code verified", {
      resetToken,
      expiresIn: RESET_TOKEN_EXPIRES,
    });
  } catch (err) {
    next(err);
  }
};

// =================== RESET PASSWORD ===================
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmNewPassword } = req.body;

    if (!resetToken || !newPassword || !confirmNewPassword) {
      return error(
        res,
        400,
        "Reset token, new password and confirm password are required"
      );
    }

    if (newPassword !== confirmNewPassword) {
      return error(res, 400, "Passwords do not match");
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_RESET_SECRET);
    } catch {
      return error(res, 400, "Invalid or expired reset token");
    }

    if (payload.purpose !== "password_reset") {
      return error(res, 400, "Invalid reset token");
    }

    const user = await User.findById(payload.uid);
    if (!user) {
      return error(res, 400, "User not found");
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    return success(res, 200, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};
