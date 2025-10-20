const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const OTP = require("../models/OTP");
const Document = require("../models/Document");
const Notification = require("../models/Notification");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { success, error } = require("../utils/response");
const { deleteProfilePicture } = require("./authController");
const {
  formatDocumentResponse,
  formatNotificationResponse,
} = require("../utils/formatters");

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
const ELEVENLABS_API_KEY =
  "bfab645123b771ca7d9fd353e04a2fcdb0433e32fbe64e89ee4af62620629adc";

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
        subscription_end_date: user.subscription_end_date,
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

    const user = await User.findById(userId)
      .populate("role")
      .populate("current_subscription");
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
      await user.populate("current_subscription");
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
        subscription_end_date: user.subscription_end_date,
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

    // Delete voices from ElevenLabs before proceeding with database deletion
    const deleteVoicePromises = [];

    // Delete voice from ElevenLabs if voice_id exists
    if (user.voice_id) {
      deleteVoicePromises.push(
        axios
          .delete(`https://api.elevenlabs.io/v1/voices/${user.voice_id}`, {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
          })
          .catch((err) => {
            console.error(
              `Failed to delete voice ${user.voice_id}:`,
              err.response?.data || err.message
            );
            throw new Error(
              `Failed to delete voice from ElevenLabs: ${
                err.response?.data?.detail?.message || err.message
              }`
            );
          })
      );
    }

    // Delete agent from ElevenLabs if model_id exists
    if (user.model_id) {
      deleteVoicePromises.push(
        axios
          .delete(
            `https://api.elevenlabs.io/v1/convai/agents/${user.model_id}`,
            {
              headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
              },
            }
          )
          .catch((err) => {
            console.error(
              `Failed to delete agent ${user.model_id}:`,
              err.response?.data || err.message
            );
            throw new Error(
              `Failed to delete agent from ElevenLabs: ${
                err.response?.data?.detail?.message || err.message
              }`
            );
          })
      );
    }

    // Wait for all ElevenLabs deletions to complete
    if (deleteVoicePromises.length > 0) {
      await Promise.all(deleteVoicePromises);
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

    return success(
      res,
      200,
      "Account and all associated data deleted successfully"
    );
  } catch (err) {
    console.error("Error during account deletion:", err);
    next(err);
  } finally {
    await session.endSession();
  }
};

// =================== PUBLIC DOCUMENT ACCESS ===================

// GET - Get published document by slug (Public access)
exports.getDocumentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Only return published documents
    const document = await Document.findOne({ slug, isPublished: true });
    if (!document) {
      return error(res, 404, "Document not found or not published");
    }

    return success(res, 200, "Document fetched successfully", {
      document: formatDocumentResponse(document),
    });
  } catch (err) {
    next(err);
  }
};

// GET - Get all published documents (Public access)
exports.getPublishedDocuments = async (req, res, next) => {
  try {
    // Only return published documents
    const documents = await Document.find({ isPublished: true })
      .select("slug title lastUpdated createdAt updatedAt")
      .sort({ createdAt: -1 });

    return success(res, 200, "Published documents fetched successfully", {
      documents: documents.map((doc) => ({
        slug: doc.slug,
        title: doc.title,
        lastUpdated: doc.lastUpdated,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// =================== USER NOTIFICATIONS ===================

// GET - Get notifications for the current user
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user with subscription details
    const user = await User.findById(userId).populate("current_subscription");
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Determine user category for filtering notifications
    let userCategories = ["All Users"];

    // Check if user is active (has had recent activity - simplified to always true for active users)
    userCategories.push("Active Users");

    // Check subscription status
    if (user.current_subscription) {
      const plan = user.current_subscription;
      if (plan.name.toLowerCase() === "free") {
        userCategories.push("Free Users");
      } else {
        userCategories.push("Premium Users");
      }
    } else {
      // No subscription means free user
      userCategories.push("Free Users");
    }

    // Build filter for notifications
    const filter = {
      target_audience: { $in: userCategories },
      is_active: true,
    };

    // Get total count for pagination
    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .populate("created_by", "username")
      .select("-created_by.email") // Exclude admin email from response
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(
      res,
      200,
      "Notifications fetched successfully",
      {
        notifications: notifications.map((notification) => ({
          _id: notification._id,
          title: notification.title,
          type: notification.type,
          message: notification.message,
          target_audience: notification.target_audience,
          createdAt: notification.createdAt,
        })),
      },
      {
        total,
        limit,
        totalPages,
        currentPage: page,
      }
    );
  } catch (err) {
    next(err);
  }
};
