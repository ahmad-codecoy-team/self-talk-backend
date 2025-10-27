const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const FAQ = require("../models/FAQ");
const Document = require("../models/Document");
const Notification = require("../models/Notification");
const { success, error } = require("../utils/response");
const {
  formatUserResponse,
  formatPlanResponse,
  formatFAQResponse,
  formatDocumentResponse,
  formatNotificationResponse,
} = require("../utils/formatters");

// =================== ADMIN SUBSCRIPTION PLAN MANAGEMENT ===================

// CREATE - Create a new subscription plan for a specific user (Admin only)
// exports.createPlan = async (req, res, next) => {
//   try {
//     const { name, status, price, billing_period, voice_minutes, features, description, is_popular, currency, user_id, total_minutes, available_minutes } = req.body;

//     // Validation
//     if (!name || typeof name !== 'string' || name.trim().length === 0) {
//       return error(res, 400, "Plan name is required and must be a non-empty string");
//     }

//     if (!["Free", "Premium", "Super"].includes(name)) {
//       return error(res, 400, "Plan name must be Free, Premium, or Super");
//     }

//     if (status && !["Active", "Inactive"].includes(status)) {
//       return error(res, 400, "Invalid status. Must be Active or Inactive");
//     }

//     if (price === undefined || price < 0) {
//       return error(res, 400, "Price is required and must be >= 0");
//     }

//     if (!billing_period || !["yearly", "monthly"].includes(billing_period)) {
//       return error(res, 400, "Invalid billing period. Must be yearly or monthly");
//     }

//     if (voice_minutes === undefined || voice_minutes < 0) {
//       return error(res, 400, "Voice minutes is required and must be >= 0");
//     }

//     if (!features || !Array.isArray(features) || features.length === 0) {
//       return error(res, 400, "Features array is required and cannot be empty");
//     }

//     if (!description) {
//       return error(res, 400, "Description is required");
//     }

//     if (!user_id) {
//       return error(res, 400, "User ID is required");
//     }

//     if (total_minutes === undefined || total_minutes < 0) {
//       return error(res, 400, "Total minutes is required and must be >= 0");
//     }

//     if (available_minutes === undefined || available_minutes < 0) {
//       return error(res, 400, "Available minutes is required and must be >= 0");
//     }

//     // Verify user exists
//     const user = await User.findById(user_id);
//     if (!user) {
//       return error(res, 404, "User not found");
//     }

//     // Check if user already has a plan of this type
//     const existingPlan = await SubscriptionPlan.findOne({ name, user_id });
//     if (existingPlan) {
//       return error(res, 409, `User already has a '${name}' plan. Delete the existing plan first or update it.`);
//     }

//     // Delete user's current subscription if switching plans
//     if (user.current_subscription) {
//       await SubscriptionPlan.deleteOne({
//         _id: user.current_subscription,
//         user_id: user_id
//       });
//     }

//     const plan = await SubscriptionPlan.create({
//       name,
//       status: status || "Active",
//       price,
//       billing_period,
//       voice_minutes,
//       features,
//       description,
//       is_popular: is_popular || false,
//       currency: currency || "EUR",
//       total_minutes,
//       available_minutes,
//       user_id,
//       subscription_started_at: new Date(),
//       subscription_end_date: name.toLowerCase() === "free" ? null : (() => {
//         const endDate = new Date();
//         endDate.setDate(endDate.getDate() + 30);
//         return endDate;
//       })(),
//     });

//     // Update user's current subscription reference
//     user.current_subscription = plan._id;
//     await user.save();

//     return success(res, 201, "Subscription plan created successfully", {
//       plan: formatPlanResponse(plan)
//     });
//   } catch (err) {
//     next(err);
//   }
// };
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
      .populate("current_subscription", "name price billing_period")
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
