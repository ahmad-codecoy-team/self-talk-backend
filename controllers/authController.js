const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { success, error } = require("../utils/response");
const { sendEmail } = require("../utils/emailService");
const { getFreePlanId } = require("../utils/seedPlans");

// Access token: 30 days for regular users, permanent for admins
const ACCESS_EXPIRES = "30d";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

// Reset token (short-lived, for final password reset step)
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || "change_me";
const RESET_TOKEN_EXPIRES = "15m"; // 15 minutes

// Helpers
function signAccessToken(payload, isAdmin = false) {
  const options = isAdmin ? {} : { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
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
    // Ensure req.body exists
    if (!req.body) {
      return error(res, 400, "Request body is required", {
        general: "No data provided in request body"
      });
    }

    const { username, email, password } = req.body;

    // Check if email or username already exists (detailed error messages)
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return error(res, 409, "Registration failed", {
        email: "An account with this email already exists"
      });
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return error(res, 409, "Registration failed", {
        username: "This username is already taken"
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Default profile picture
    const profilePicture = "uploads/profile_pics/default-profile-pic.jpg";

    // Get Free plan ID for default assignment
    const freePlanId = await getFreePlanId();

    // Create new user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profilePicture,
      current_subscription: freePlanId,
      subscription_started_at: new Date(),
      total_minutes: 2,
      available_minutes: 2,
    });

    return success(res, 201, "User registered successfully", {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];

      if (field === 'email') {
        return error(res, 409, "Registration failed", {
          email: "An account with this email already exists"
        });
      } else if (field === 'username') {
        return error(res, 409, "Registration failed", {
          username: "This username is already taken"
        });
      }
    }

    // Handle validation errors from MongoDB
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach((field) => {
        validationErrors[field] = err.errors[field].message;
      });
      return error(res, 400, "Validation failed", validationErrors);
    }

    next(err);
  }
};

// =================== UPLOAD PROFILE PICTURE ===================
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    if (!req.file) {
      return error(res, 400, "Profile picture upload failed", {
        profilePicture: "No file was uploaded"
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Update profile picture path
    const profilePicturePath = `/uploads/profile_pics/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    return success(res, 200, "Profile picture uploaded successfully", {
      profilePicture: profilePicturePath
    });
  } catch (err) {
    next(err);
  }
};

// =================== DELETE PROFILE PICTURE ===================
exports.deleteProfilePicture = async (userId, profilePicturePath) => {
  const fs = require('fs');
  const path = require('path');

  try {
    // Don't delete default profile picture
    if (profilePicturePath && !profilePicturePath.includes('default-profile-pic.jpg')) {
      // Remove leading slash if present
      const cleanPath = profilePicturePath.startsWith('/') ? profilePicturePath.slice(1) : profilePicturePath;
      const fullPath = path.join(__dirname, '..', cleanPath);

      // Check if file exists and delete it
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted profile picture: ${fullPath}`);
      }
    }
  } catch (err) {
    console.error(`Error deleting profile picture for user ${userId}:`, err.message);
  }
};

// =================== DELETE USER ACCOUNT ===================
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Find user to get profile picture path before deletion
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Delete profile picture if it's not the default one
    await exports.deleteProfilePicture(userId, user.profilePicture);

    // Delete user account
    await User.findByIdAndDelete(userId);

    return success(res, 200, "Account deleted successfully");
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

    // Generate permanent token for admin, regular expiring token for users
    const accessToken = signAccessToken({ uid: user._id }, user.is_admin);

    return success(res, 200, "Logged in successfully", {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// =================== PROFILE (GET & PUT) ===================
exports.profile = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // GET - Fetch profile
    if (req.method === "GET") {
      const user = await User.findById(userId).select(
        "-password -resetOTP -resetOTPExp"
      ).populate("current_subscription");
      if (!user) {
        return error(res, 404, "User not found");
      }

      return success(res, 200, "User profile fetched successfully", {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          voice_id: user.voice_id,
          model_id: user.model_id,
          total_minutes: user.total_minutes,
          available_minutes: user.available_minutes,
          current_subscription: user.current_subscription,
          subscription_started_at: user.subscription_started_at,
          is_admin: user.is_admin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }

    // PUT - Update profile
    if (req.method === "PUT") {
      const { username } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return error(res, 404, "User not found");
      }

      let profileUpdated = false;

      // Check if username is being changed and if it's already taken
      if (username && username.trim() && username !== user.username) {
        const existingUsername = await User.findOne({
          username: username.trim(),
          _id: { $ne: userId }, // Exclude current user
        });
        if (existingUsername) {
          return error(res, 409, "Username already taken");
        }
        user.username = username.trim();
        profileUpdated = true;
      }

      // Handle profile picture upload
      if (req.file) {
        const oldPicturePath = user.profilePicture;
        user.profilePicture = `/uploads/profile_pics/${req.file.filename}`;
        profileUpdated = true;

        // Delete old profile picture if it's not the default
        if (oldPicturePath && !oldPicturePath.includes('default-profile-pic.jpg')) {
          await exports.deleteProfilePicture(userId, oldPicturePath);
        }
      }

      // Save only if something was actually updated
      if (profileUpdated) {
        await user.save();
      }

      return success(res, 200, "Profile updated successfully", {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          updatedAt: user.updatedAt,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// =================== CHANGE PASSWORD ===================
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.uid;

    if (newPassword !== confirmNewPassword) {
      return error(res, 400, "New passwords do not match");
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Verify old password
    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return error(res, 400, "Current password is incorrect");
    }

    // Hash and save new password
    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.password = hashedNewPassword;
    await user.save();

    return success(res, 200, "Password changed successfully");
  } catch (err) {
    next(err);
  }
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
