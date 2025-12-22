const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");
const FAQ = require("../models/FAQ");
const Document = require("../models/Document");
const Notification = require("../models/Notification");
const Prompt = require("../models/Prompt");
const CustomSupport = require("../models/CustomSupport");
const Language = require("../models/Language");
const Accent = require("../models/Accent");
const { success, error } = require("../utils/response");
const {
  formatUserResponse,
  formatPlanResponse,
  formatFAQResponse,
  formatDocumentResponse,
  formatNotificationResponse,
  formatLanguageResponse,
  formatAccentResponse,
} = require("../utils/formatters");

exports.createPlan = async (req, res, next) => {
  try {
    const {
      name,
      status,
      price,
      billing_period,
      total_minutes,
      available_minutes,
      features,
      description,
      currency,
      is_popular,
    } = req.body;

    // ✅ Get user ID from auth middleware (e.g., JWT)
    const user_id = req.user?._id || req.userId;
    if (!user_id) {
      return error(res, 401, "User not authenticated");
    }

    // ✅ Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // ✅ Check if user already has this plan
    const existingPlan = await SubscriptionPlan.findOne({ name, user_id });
    if (existingPlan) {
      return error(
        res,
        409,
        `User already has a '${name}' plan. Delete or update the existing plan.`
      );
    }

    // ✅ Delete user's current subscription if switching plans
    if (user.current_subscription) {
      await SubscriptionPlan.deleteOne({
        _id: user.current_subscription,
        user_id: user_id,
      });
    }

    // ✅ Create subscription plan
    const plan = await SubscriptionPlan.create({
      name,
      status: status || "Active",
      price,
      billing_period,
      total_minutes,
      available_minutes,
      features,
      description,
      currency: currency || "EUR",
      is_popular: is_popular || false,
      user_id,
      subscription_started_at: new Date(),
      subscription_end_date:
        name.toLowerCase() === "free"
          ? null
          : (() => {
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 30);
              return endDate;
            })(),
    });

    // ✅ Update user’s current subscription reference
    user.current_subscription = plan._id;
    await user.save();

    // ✅ Success response
    return success(res, 201, "Subscription plan created successfully", {
      plan: formatPlanResponse(plan),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get all subscription plans (grouped by user or show all)
exports.getAllPlans = async (req, res, next) => {
  try {
    const { status, user_id, template_only } = req.query;

    let filter = {};
    if (status && ["Active", "Inactive"].includes(status)) {
      filter.status = status;
    }

    if (user_id) {
      filter.user_id = user_id;
    }

    // If template_only is true, we could show unique plan types
    // For now, just return all plans matching the filter
    const plans = await SubscriptionPlan.find(filter)
      .populate("user_id", "username email")
      .sort({ createdAt: -1 });

    return success(res, 200, "Subscription plans fetched successfully", {
      plans: plans.map((plan) => formatPlanResponse(plan)),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get single subscription plan by ID
exports.getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return error(res, 404, "Subscription plan not found");
    }

    return success(res, 200, "Subscription plan fetched successfully", {
      plan: formatPlanResponse(plan),
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update subscription plan (Admin only)
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      status,
      price,
      billing_period,
      voice_minutes,
      features,
      description,
      is_popular,
      currency,
    } = req.body;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return error(res, 404, "Subscription plan not found");
    }

    // Validation for updates
    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return error(res, 400, "Plan name must be a non-empty string");
    }

    if (status && !["Active", "Inactive"].includes(status)) {
      return error(res, 400, "Invalid status. Must be Active or Inactive");
    }

    if (price !== undefined && price < 0) {
      return error(res, 400, "Price must be >= 0");
    }

    if (billing_period && !["yearly", "monthly"].includes(billing_period)) {
      return error(
        res,
        400,
        "Invalid billing period. Must be yearly or monthly"
      );
    }

    if (voice_minutes !== undefined && voice_minutes < 0) {
      return error(res, 400, "Voice minutes must be >= 0");
    }

    if (features && (!Array.isArray(features) || features.length === 0)) {
      return error(res, 400, "Features must be a non-empty array");
    }

    // Check if changing name would create duplicate
    if (name && name !== plan.name) {
      const existingPlan = await SubscriptionPlan.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingPlan) {
        return error(res, 409, `Plan with name '${name}' already exists`);
      }
    }

    // Update fields
    if (name) plan.name = name;
    if (status) plan.status = status;
    if (price !== undefined) plan.price = price;
    if (billing_period) plan.billing_period = billing_period;
    if (voice_minutes !== undefined) plan.voice_minutes = voice_minutes;
    if (features) plan.features = features;
    if (description) plan.description = description;
    if (is_popular !== undefined) plan.is_popular = is_popular;
    if (currency) plan.currency = currency;

    await plan.save();

    return success(res, 200, "Subscription plan updated successfully", {
      plan: formatPlanResponse(plan),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete subscription plan (Admin only)
exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return error(res, 404, "Subscription plan not found");
    }

    // Check if any users are subscribed to this plan
    const subscribedUsers = await User.countDocuments({
      current_subscription: id,
    });
    if (subscribedUsers > 0) {
      return error(
        res,
        400,
        `Cannot delete plan. ${subscribedUsers} users are currently subscribed to this plan`
      );
    }

    await SubscriptionPlan.findByIdAndDelete(id);

    return success(res, 200, "Subscription plan deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN USER MANAGEMENT ===================

const axios = require("axios");
const ELEVENLABS_API_KEY = "bfab645123b771ca7d9fd353e04a2fcdb0433e32629adc";

// GET - Get all users with pagination (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with role "user" only (exclude admins from this list)
    const roleFilter = await require("../models/Role").findOne({
      name: "user",
    });
    if (!roleFilter) {
      return error(res, 500, "User role not found");
    }

    const filter = { role: roleFilter._id };

    // Get total count for pagination meta
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get users with pagination
    const users = await User.find(filter)
      .populate("role", "name description")
      .populate("current_subscription") // Populate all subscription fields
      .select("-password") // Exclude password from response
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    return success(
      res,
      200,
      "Users fetched successfully",
      {
        users: users.map((user) => formatUserResponse(user)),
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

// PUT - Toggle user suspension (Admin only)
exports.toggleUserSuspension = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate("role")
      .populate("current_subscription");
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Prevent suspending admin users
    if (user.role && user.role.name === "admin") {
      return error(res, 403, "Cannot suspend admin users");
    }

    // Toggle suspension status
    user.is_suspended = !user.is_suspended;
    await user.save();

    const action = user.is_suspended ? "suspended" : "unsuspended";
    return success(res, 200, `User ${action} successfully`, {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete user's ElevenLabs data only (Admin only)
exports.deleteUserElevenLabsData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate("role")
      .populate("current_subscription");
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Prevent deleting admin users' data
    if (user.role && user.role.name === "admin") {
      return error(res, 403, "Cannot delete admin users' ElevenLabs data");
    }

    // Delete voices from ElevenLabs
    const deletePromises = [];

    // Delete voice from ElevenLabs if voice_id exists
    if (user.voice_id) {
      deletePromises.push(
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
            // Don't throw error, just log it
          })
      );
    }

    // Delete agent from ElevenLabs if model_id exists
    if (user.model_id) {
      deletePromises.push(
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
            // Don't throw error, just log it
          })
      );
    }

    // Wait for all ElevenLabs deletions to complete
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    // Reset user's voice_id and model_id to null
    user.voice_id = null;
    user.model_id = null;
    await user.save();

    return success(res, 200, "User's ElevenLabs data deleted successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// POST - Bulk actions for users (suspend/unsuspend/delete) (Admin only)
exports.bulkUserActions = async (req, res, next) => {
  const mongoose = require("mongoose");
  const { deleteProfilePicture } = require("./authController");
  const UserSubscription = require("../models/UserSubscription");
  const Conversation = require("../models/Conversation");
  const Message = require("../models/Message");
  const OTP = require("../models/OTP");

  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return error(res, 400, "userIds array is required");
    }

    if (!action || !["suspend", "unsuspend", "delete"].includes(action)) {
      return error(res, 400, "Invalid action. Must be suspend, unsuspend, or delete");
    }

    const users = await User.find({ _id: { $in: userIds } })
      .populate("role")
      .populate("current_subscription");

    if (users.length === 0) {
      return error(res, 404, "No users found");
    }

    // Prevent actions on admin users
    const adminUsers = users.filter(user => user.role && user.role.name === "admin");
    if (adminUsers.length > 0) {
      return error(res, 403, "Cannot perform bulk actions on admin users");
    }

    let results = [];

    if (action === "suspend" || action === "unsuspend") {
      // Bulk suspend/unsuspend
      const isSuspended = action === "suspend";
      
      for (const user of users) {
        user.is_suspended = isSuspended;
        await user.save();
        results.push({
          userId: user._id,
          action: action,
          success: true,
          user: formatUserResponse(user)
        });
      }

      return success(res, 200, `Users ${action}ed successfully`, {
        results,
        totalProcessed: results.length
      });

    } else if (action === "delete") {
      // Bulk delete users
      for (const user of users) {
        const session = await mongoose.startSession();
        
        try {
          // Delete ElevenLabs data first
          const deletePromises = [];

          if (user.voice_id) {
            deletePromises.push(
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
                })
            );
          }

          if (user.model_id) {
            deletePromises.push(
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
                })
            );
          }

          if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
          }

          // Delete user data in transaction
          await session.withTransaction(async () => {
            await Message.deleteMany({ userId: user._id }, { session });
            await Conversation.deleteMany({ userId: user._id }, { session });
            await OTP.deleteMany({ email: user.email }, { session });
            
            if (user.current_subscription) {
              await UserSubscription.findByIdAndDelete(user.current_subscription, { session });
            }
            
            await User.findByIdAndDelete(user._id, { session });
          });

          // Delete profile picture
          await deleteProfilePicture(user._id, user.profilePicture);

          results.push({
            userId: user._id,
            action: "delete",
            success: true
          });

        } catch (err) {
          results.push({
            userId: user._id,
            action: "delete",
            success: false,
            error: err.message
          });
        } finally {
          await session.endSession();
        }
      }

      return success(res, 200, "Bulk delete completed", {
        results,
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    }

  } catch (err) {
    next(err);
  }
};

// POST - Admin purchase subscription for user (Admin only)
exports.adminBuySubscriptionForUser = async (req, res, next) => {
  try {
    const { userId, name } = req.body;

    if (!userId) {
      return error(res, 400, "User ID is required");
    }

    if (!name) {
      return error(res, 400, "Plan name is required");
    }

    // Normalize plan name case
    let planName = name;
    if (typeof planName === "string") {
      planName = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
    }

    // Validate plan name
    const validPlans = ["Free", "Premium", "Super"];
    if (!validPlans.includes(planName)) {
      return error(
        res,
        400,
        "Invalid plan name. Valid plans: Free, Premium, Super"
      );
    }

    // Find the plan template
    const planTemplate = await SubscriptionPlan.findOne({ name: planName });
    if (!planTemplate) {
      return error(res, 404, `${planName} plan template not found in database`);
    }

    // Find the target user
    const user = await User.findById(userId).populate("role");
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Prevent purchasing subscription for admin users
    if (user.role && user.role.name === "admin") {
      return error(res, 403, "Cannot purchase subscription for admin users");
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const minutes = planTemplate.voice_minutes;

    // Helper function to calculate total seconds from minutes
    const calculateTotalSeconds = (userSubscription) => {
      const availableMinutes = userSubscription.available_minutes || 0;
      const extraMinutes = userSubscription.extra_minutes || 0;
      return Math.floor((availableMinutes + extraMinutes) * 60);
    };

    // Helper function to update seconds field
    const updateSecondsField = async (userSubscription) => {
      userSubscription.seconds = Math.floor(calculateTotalSeconds(userSubscription));
      await userSubscription.save();
    };

    // If user has existing subscription, preserve extra_minutes and update fields
    if (user.current_subscription) {
      const existingSubscription = await UserSubscription.findById(
        user.current_subscription
      );
      const preservedExtraMinutes = existingSubscription
        ? existingSubscription.extra_minutes
        : 0;

      // Update existing subscription with new plan data but preserve extra_minutes
      const updateData = {
        plan_id: planTemplate._id,
        name: planTemplate.name,
        status: planTemplate.status,
        price: planTemplate.price,
        billing_period: planTemplate.billing_period,
        features: planTemplate.features,
        description: planTemplate.description,
        is_popular: planTemplate.is_popular,
        currency: planTemplate.currency,
        total_minutes: minutes + preservedExtraMinutes,
        available_minutes: minutes,
        extra_minutes: preservedExtraMinutes,
        recordings: [],
        subscription_started_at: now,
        subscription_end_date: endDate,
      };
      
      const updatedSubscription = await UserSubscription.findByIdAndUpdate(
        user.current_subscription,
        updateData,
        { new: true }
      );
      
      // Calculate seconds from total available time (available + extra minutes)
      await updateSecondsField(updatedSubscription);
    } else {
      // Create new subscription if none exists
      const newUserSubscription = await UserSubscription.create({
        plan_id: planTemplate._id,
        name: planTemplate.name,
        status: planTemplate.status,
        price: planTemplate.price,
        billing_period: planTemplate.billing_period,
        features: planTemplate.features,
        description: planTemplate.description,
        is_popular: planTemplate.is_popular,
        currency: planTemplate.currency,
        total_minutes: minutes,
        available_minutes: minutes,
        extra_minutes: 0,
        recordings: [],
        subscription_started_at: now,
        subscription_end_date: endDate,
      });

      // Calculate seconds from available + extra minutes
      await updateSecondsField(newUserSubscription);

      user.current_subscription = newUserSubscription._id;
      await user.save();
    }

    // Set comped flag to true since admin purchased this subscription
    await User.findByIdAndUpdate(userId, { comped: true });

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("role")
      .populate("current_subscription");

    return success(res, 200, `Successfully purchased ${planName} plan for user`, {
      user: formatUserResponse(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN FAQ MANAGEMENT ===================

// CREATE - Create a new FAQ (Admin only)
exports.createFAQ = async (req, res, next) => {
  try {
    const { category, question, answer } = req.body;

    const faq = await FAQ.create({
      category,
      question,
      answer,
    });

    return success(res, 201, "FAQ created successfully", {
      faq: formatFAQResponse(faq),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get all FAQs
exports.getAllFAQs = async (req, res, next) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (
      category &&
      ["General", "Account", "Billing", "Features", "Technical"].includes(
        category
      )
    ) {
      filter.category = category;
    }

    const faqs = await FAQ.find(filter).sort({ createdAt: -1 });

    return success(res, 200, "FAQs fetched successfully", {
      faqs: faqs.map((faq) => formatFAQResponse(faq)),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get single FAQ by ID
exports.getFAQById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return error(res, 404, "FAQ not found");
    }

    return success(res, 200, "FAQ fetched successfully", {
      faq: formatFAQResponse(faq),
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update FAQ (Admin only)
exports.updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, question, answer } = req.body;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return error(res, 404, "FAQ not found");
    }

    if (category) faq.category = category;
    if (question) faq.question = question;
    if (answer) faq.answer = answer;

    await faq.save();

    return success(res, 200, "FAQ updated successfully", {
      faq: formatFAQResponse(faq),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete FAQ (Admin only)
exports.deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return error(res, 404, "FAQ not found");
    }

    await FAQ.findByIdAndDelete(id);

    return success(res, 200, "FAQ deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN DOCUMENT MANAGEMENT ===================

// READ - Get all documents (Admin only)
exports.getAllDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({}).sort({ createdAt: -1 });

    return success(res, 200, "Documents fetched successfully", {
      documents: documents.map((doc) => formatDocumentResponse(doc)),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get single document by ID (Admin only)
exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return error(res, 404, "Document not found");
    }

    return success(res, 200, "Document fetched successfully", {
      document: formatDocumentResponse(document),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get single document by slug (Admin only)
exports.getDocumentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const document = await Document.findOne({ slug });
    if (!document) {
      return error(res, 404, "Document not found");
    }

    return success(res, 200, "Document fetched successfully", {
      document: formatDocumentResponse(document),
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update document (Admin only)
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return error(res, 404, "Document not found");
    }

    // Update fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (isPublished !== undefined) document.isPublished = isPublished;

    await document.save();

    return success(res, 200, "Document updated successfully", {
      document: formatDocumentResponse(document),
    });
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN NOTIFICATION MANAGEMENT ===================

// CREATE - Create a new notification (Admin only)
exports.createNotification = async (req, res, next) => {
  try {
    const { title, type, message, target_audience } = req.body;
    const created_by = req.user.uid;

    const notification = await Notification.create({
      title,
      type,
      message,
      target_audience,
      created_by,
    });

    const populatedNotification = await Notification.findById(
      notification._id
    ).populate("created_by", "username email");

    return success(res, 201, "Notification created successfully", {
      notification: formatNotificationResponse(populatedNotification),
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get all notifications with pagination (Admin only)
exports.getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, target_audience, is_active } = req.query;

    let filter = {};
    if (type && ["Info", "Success", "Warning", "Error"].includes(type)) {
      filter.type = type;
    }
    if (
      target_audience &&
      ["All Users", "Active Users", "Premium Users", "Free Users"].includes(
        target_audience
      )
    ) {
      filter.target_audience = target_audience;
    }
    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    // Get total count for pagination meta
    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .populate("created_by", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(
      res,
      200,
      "Notifications fetched successfully",
      {
        notifications: notifications.map((notification) =>
          formatNotificationResponse(notification)
        ),
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

// READ - Get single notification by ID (Admin only)
exports.getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id).populate(
      "created_by",
      "username email"
    );
    if (!notification) {
      return error(res, 404, "Notification not found");
    }

    return success(res, 200, "Notification fetched successfully", {
      notification: formatNotificationResponse(notification),
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update notification (Admin only)
exports.updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, type, message, target_audience, is_active } = req.body;

    const notification = await Notification.findById(id);
    if (!notification) {
      return error(res, 404, "Notification not found");
    }

    // Update fields
    if (title !== undefined) notification.title = title;
    if (type !== undefined) notification.type = type;
    if (message !== undefined) notification.message = message;
    if (target_audience !== undefined)
      notification.target_audience = target_audience;
    if (is_active !== undefined) notification.is_active = is_active;

    await notification.save();

    const updatedNotification = await Notification.findById(id).populate(
      "created_by",
      "username email"
    );

    return success(res, 200, "Notification updated successfully", {
      notification: formatNotificationResponse(updatedNotification),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete notification (Admin only)
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return error(res, 404, "Notification not found");
    }

    await Notification.findByIdAndDelete(id);

    return success(res, 200, "Notification deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN PROMPT MANAGEMENT ===================

// CREATE - Create a new prompt (Admin only)
exports.createPrompt = async (req, res, next) => {
  try {
    const { prompt, llmModal, ttsModal } = req.body;

    // Check if prompt already exists (since we only want one global prompt)
    const existingPrompt = await Prompt.findOne();
    if (existingPrompt) {
      return error(
        res,
        409,
        "A global prompt already exists. Please update the existing prompt instead."
      );
    }

    const newPrompt = await Prompt.create({
      prompt,
      llmModal,
      ttsModal,
    });

    return success(res, 201, "Prompt created successfully", {
      prompt: {
        _id: newPrompt._id,
        prompt: newPrompt.prompt,
        llmModal: newPrompt.llmModal,
        ttsModal: newPrompt.ttsModal,
        createdAt: newPrompt.createdAt,
        updatedAt: newPrompt.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get the global prompt (Admin only)
exports.getAdminPrompt = async (req, res, next) => {
  try {
    const prompt = await Prompt.findOne().select(
      "prompt llmModal ttsModal createdAt updatedAt"
    );

    if (!prompt) {
      return error(res, 404, "No prompt found");
    }

    return success(res, 200, "Prompt fetched successfully", {
      prompt: {
        _id: prompt._id,
        prompt: prompt.prompt,
        llmModal: prompt.llmModal,
        ttsModal: prompt.ttsModal,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update the global prompt (Admin only)
exports.updatePrompt = async (req, res, next) => {
  try {
    const { prompt, llmModal, ttsModal } = req.body;

    const existingPrompt = await Prompt.findOne();
    if (!existingPrompt) {
      return error(res, 404, "No prompt found to update");
    }

    existingPrompt.prompt = prompt;
    if (llmModal !== undefined) existingPrompt.llmModal = llmModal;
    if (ttsModal !== undefined) existingPrompt.ttsModal = ttsModal;
    await existingPrompt.save();

    return success(res, 200, "Prompt updated successfully", {
      prompt: {
        _id: existingPrompt._id,
        prompt: existingPrompt.prompt,
        llmModal: existingPrompt.llmModal,
        ttsModal: existingPrompt.ttsModal,
        createdAt: existingPrompt.createdAt,
        updatedAt: existingPrompt.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN LANGUAGE MANAGEMENT ===================

// CREATE - Create a new language (Admin only)
exports.createLanguage = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    const existingLanguage = await Language.findOne({ code });
    if (existingLanguage) {
      return error(res, 409, "Language with this code already exists");
    }

    const language = await Language.create({ name, code });

    return success(res, 201, "Language created successfully", {
      language: {
        _id: language._id,
        name: language.name,
        code: language.code,
      },
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get all languages (Admin only)
exports.getAllLanguages = async (req, res, next) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    return success(res, 200, "Languages fetched successfully", {
      languages,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update language (Admin only)
exports.updateLanguage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const language = await Language.findById(id);
    if (!language) {
      return error(res, 404, "Language not found");
    }

    if (code && code !== language.code) {
      const existingLanguage = await Language.findOne({ code });
      if (existingLanguage) {
        return error(res, 409, "Language with this code already exists");
      }
    }

    if (name) language.name = name;
    if (code) language.code = code;

    await language.save();

    return success(res, 200, "Language updated successfully", {
      language,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete language (Admin only)
exports.deleteLanguage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if language has accents
    const accentsCount = await Accent.countDocuments({ language: id });
    if (accentsCount > 0) {
      return error(
        res,
        400,
        "Cannot delete language with associated accents. Delete accents first."
      );
    }

    const language = await Language.findByIdAndDelete(id);
    if (!language) {
      return error(res, 404, "Language not found");
    }

    return success(res, 200, "Language deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN ACCENT MANAGEMENT ===================

// CREATE - Create a new accent (Admin only)
exports.createAccent = async (req, res, next) => {
  try {
    const { language_id, name } = req.body;

    const language = await Language.findById(language_id);
    if (!language) {
      return error(res, 404, "Language not found");
    }

    const accent = await Accent.create({ language: language_id, name });
    const populatedAccent = await Accent.findById(accent._id).populate(
      "language",
      "name code"
    );

    return success(res, 201, "Accent created successfully", {
      accent: populatedAccent,
    });
  } catch (err) {
    next(err);
  }
};

// READ - Get all accents (Admin only)
exports.getAllAccents = async (req, res, next) => {
  try {
    const { language_id } = req.query;
    const filter = {};
    if (language_id) filter.language = language_id;

    const accents = await Accent.find(filter)
      .populate("language", "name code")
      .sort({ name: 1 });

    return success(res, 200, "Accents fetched successfully", {
      accents,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update accent (Admin only)
exports.updateAccent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, language_id } = req.body;

    const accent = await Accent.findById(id);
    if (!accent) {
      return error(res, 404, "Accent not found");
    }

    if (language_id) {
      const language = await Language.findById(language_id);
      if (!language) {
        return error(res, 404, "Language not found");
      }
      accent.language = language_id;
    }

    if (name) accent.name = name;

    await accent.save();
    const updatedAccent = await Accent.findById(id).populate(
      "language",
      "name code"
    );

    return success(res, 200, "Accent updated successfully", {
      accent: updatedAccent,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE - Delete accent (Admin only)
exports.deleteAccent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accent = await Accent.findByIdAndDelete(id);

    if (!accent) {
      return error(res, 404, "Accent not found");
    }

    return success(res, 200, "Accent deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== ADMIN CUSTOM SUPPORT MANAGEMENT ===================

// GET ALL - Get all custom support requests (Admin only)
exports.getAllCustomSupportRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object for queries
    const filter = {};

    // Optional filters
    if (req.query.search) {
      filter.$or = [{ message: { $regex: req.query.search, $options: "i" } }];
    }

    // Get total count for pagination
    const total = await CustomSupport.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get support requests with populated user data
    const supportRequests = await CustomSupport.find(filter)
      .populate(
        "userId",
        "username email profilePicture is_suspended createdAt"
      )
      .select("message createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedRequests = supportRequests
      .filter((request) => request.userId) // Filter out requests where user is null (e.g. deleted users)
      .map((request) => ({
        _id: request._id,
        message: request.message,
        user: {
          _id: request.userId._id,
          username: request.userId.username,
          email: request.userId.email,
          profilePicture: request.userId.profilePicture,
          is_suspended: request.userId.is_suspended,
          userCreatedAt: request.userId.createdAt,
        },
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }));

    return success(
      res,
      200,
      "Custom support requests fetched successfully",
      {
        supportRequests: formattedRequests,
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
