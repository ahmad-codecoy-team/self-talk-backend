const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const OTP = require("../models/OTP");
const { success, error } = require("../utils/response");
const { deleteProfilePicture } = require("./authController");

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

// =================== GET PROFILE ===================
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId)
      .select("-password")
      .populate("current_subscription")
      .populate("role");

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
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================== UPDATE PROFILE ===================
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, profilePicture, voice_id, model_id } = req.body;
    const userId = req.user.uid;

    const user = await User.findById(userId).populate("role");
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

    // Handle profile picture update from JSON body (path from /upload-profile-picture)
    if (profilePicture !== undefined) {
      const oldPicturePath = user.profilePicture;

      if (profilePicture && profilePicture.trim()) {
        user.profilePicture = profilePicture.trim();
      } else {
        user.profilePicture = ""; // Clear profile picture
      }

      profileUpdated = true;

      // Delete old profile picture if it's not the default and different from new one
      if (
        oldPicturePath &&
        oldPicturePath !== user.profilePicture &&
        !oldPicturePath.includes("default-profile-pic.jpg")
      ) {
        await deleteProfilePicture(userId, oldPicturePath);
      }
    }

    // Handle voice_id update
    if (voice_id !== undefined) {
      user.voice_id = voice_id && voice_id.trim() ? voice_id.trim() : null;
      profileUpdated = true;
    }

    // Handle model_id update
    if (model_id !== undefined) {
      user.model_id = model_id && model_id.trim() ? model_id.trim() : null;
      profileUpdated = true;
    }

    // Save only if something was actually updated
    if (profileUpdated) {
      await user.save();
      await user.populate("role");
    }

    return success(res, 200, "Profile updated successfully", {
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
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================== CHANGE PASSWORD ===================
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.uid;

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

// =================== DELETE USER ACCOUNT ===================
exports.deleteAccount = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user.uid;

    // Find user to get profile picture path and email before deletion
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Start transaction for atomic deletion
    await session.withTransaction(async () => {
      // 1. Delete all messages related to the user
      await Message.deleteMany({ userId }, { session });

      // 2. Delete all conversations related to the user
      await Conversation.deleteMany({ userId }, { session });

      // 3. Delete all OTPs related to the user's email
      await OTP.deleteMany({ email: user.email }, { session });

      // 4. Finally, delete the user account itself
      await User.findByIdAndDelete(userId, { session });
    });

    // 5. Delete profile picture after successful database operations
    // (this is outside transaction as it's a file system operation)
    await deleteProfilePicture(userId, user.profilePicture);

    return success(res, 200, "Account and all associated data deleted successfully");
  } catch (err) {
    console.error("Error during account deletion:", err);
    next(err);
  } finally {
    await session.endSession();
  }
};
