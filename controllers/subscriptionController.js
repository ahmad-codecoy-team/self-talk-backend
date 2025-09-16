const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const { success, error } = require("../utils/response");

// =================== ADMIN CRUD OPERATIONS ===================

// CREATE - Create a new subscription plan (Admin only)
exports.createPlan = async (req, res, next) => {
  try {
    const { name, status, price, billing_period, voice_minutes, features, description, is_popular } = req.body;

    // Validation
    if (!name || !["Free", "Premium", "Super"].includes(name)) {
      return error(res, 400, "Invalid plan name. Must be Free, Premium, or Super");
    }

    if (status && !["Active", "Inactive"].includes(status)) {
      return error(res, 400, "Invalid status. Must be Active or Inactive");
    }

    if (price === undefined || price < 0) {
      return error(res, 400, "Price is required and must be >= 0");
    }

    if (!billing_period || !["yearly", "monthly"].includes(billing_period)) {
      return error(res, 400, "Invalid billing period. Must be yearly or monthly");
    }

    if (voice_minutes === undefined || voice_minutes < 0) {
      return error(res, 400, "Voice minutes is required and must be >= 0");
    }

    if (!features || !Array.isArray(features) || features.length === 0) {
      return error(res, 400, "Features array is required and cannot be empty");
    }

    if (!description) {
      return error(res, 400, "Description is required");
    }

    // Check if plan with same name already exists
    const existingPlan = await SubscriptionPlan.findOne({ name });
    if (existingPlan) {
      return error(res, 409, `Plan with name '${name}' already exists`);
    }

    const plan = await SubscriptionPlan.create({
      name,
      status: status || "Active",
      price,
      billing_period,
      voice_minutes,
      features,
      description,
      is_popular: is_popular || false,
    });

    return success(res, 201, "Subscription plan created successfully", { plan });
  } catch (err) {
    next(err);
  }
};

// READ - Get all subscription plans
exports.getAllPlans = async (req, res, next) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status && ["Active", "Inactive"].includes(status)) {
      filter.status = status;
    }

    const plans = await SubscriptionPlan.find(filter).sort({ createdAt: 1 });

    return success(res, 200, "Subscription plans fetched successfully", { plans });
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

    return success(res, 200, "Subscription plan fetched successfully", { plan });
  } catch (err) {
    next(err);
  }
};

// UPDATE - Update subscription plan (Admin only)
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status, price, billing_period, voice_minutes, features, description, is_popular } = req.body;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return error(res, 404, "Subscription plan not found");
    }

    // Validation for updates
    if (name && !["Free", "Premium", "Super"].includes(name)) {
      return error(res, 400, "Invalid plan name. Must be Free, Premium, or Super");
    }

    if (status && !["Active", "Inactive"].includes(status)) {
      return error(res, 400, "Invalid status. Must be Active or Inactive");
    }

    if (price !== undefined && price < 0) {
      return error(res, 400, "Price must be >= 0");
    }

    if (billing_period && !["yearly", "monthly"].includes(billing_period)) {
      return error(res, 400, "Invalid billing period. Must be yearly or monthly");
    }

    if (voice_minutes !== undefined && voice_minutes < 0) {
      return error(res, 400, "Voice minutes must be >= 0");
    }

    if (features && (!Array.isArray(features) || features.length === 0)) {
      return error(res, 400, "Features must be a non-empty array");
    }

    // Check if changing name would create duplicate
    if (name && name !== plan.name) {
      const existingPlan = await SubscriptionPlan.findOne({ name, _id: { $ne: id } });
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

    await plan.save();

    return success(res, 200, "Subscription plan updated successfully", { plan });
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

    // Check if any users are currently using this plan
    const usersWithPlan = await User.countDocuments({ current_subscription: id });
    if (usersWithPlan > 0) {
      return error(res, 400, `Cannot delete plan. ${usersWithPlan} users are currently subscribed to this plan`);
    }

    await SubscriptionPlan.findByIdAndDelete(id);

    return success(res, 200, "Subscription plan deleted successfully");
  } catch (err) {
    next(err);
  }
};

// =================== USER SUBSCRIPTION MANAGEMENT ===================

// GET - Get user's current subscription details
exports.getUserSubscription = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId)
      .select("voice_id model_id total_minutes available_minutes current_subscription subscription_started_at")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    return success(res, 200, "User subscription details fetched successfully", {
      user_subscription: {
        voice_id: user.voice_id,
        model_id: user.model_id,
        total_minutes: user.total_minutes,
        available_minutes: user.available_minutes,
        current_plan: user.current_subscription,
        started_at: user.subscription_started_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT - Update user's voice_id and model_id
exports.updateUserVoiceModel = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { voice_id, model_id } = req.body;

    if (!voice_id && !model_id) {
      return error(res, 400, "At least one of voice_id or model_id is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Update fields
    if (voice_id) user.voice_id = voice_id;
    if (model_id) user.model_id = model_id;

    await user.save();

    return success(res, 200, "User voice and model settings updated successfully", {
      voice_id: user.voice_id,
      model_id: user.model_id,
    });
  } catch (err) {
    next(err);
  }
};

// POST - Subscribe user to a plan
exports.subscribeToPlan = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { plan_id } = req.body;

    if (!plan_id) {
      return error(res, 400, "Plan ID is required");
    }

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) {
      return error(res, 404, "Subscription plan not found");
    }

    if (plan.status !== "Active") {
      return error(res, 400, "Cannot subscribe to an inactive plan");
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Set the new subscription
    user.current_subscription = plan_id;
    user.subscription_started_at = new Date();

    // Add voice minutes to total and available minutes
    user.total_minutes += plan.voice_minutes;
    user.available_minutes += plan.voice_minutes;

    await user.save();

    // Populate the plan details for response
    await user.populate("current_subscription");

    return success(res, 200, "Successfully subscribed to plan", {
      user_subscription: {
        current_plan: user.current_subscription,
        started_at: user.subscription_started_at,
        total_minutes: user.total_minutes,
        available_minutes: user.available_minutes,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST - Add minutes to user account (can be used for separate minute purchases)
exports.addMinutes = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return error(res, 400, "Minutes must be a positive number");
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Add minutes to both total and available
    user.total_minutes += minutes;
    user.available_minutes += minutes;

    await user.save();

    return success(res, 200, "Minutes added successfully", {
      added_minutes: minutes,
      total_minutes: user.total_minutes,
      available_minutes: user.available_minutes,
    });
  } catch (err) {
    next(err);
  }
};

// GET - Get all active plans (for users to see available options)
exports.getActivePlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ status: "Active" }).sort({ price: 1 });

    return success(res, 200, "Active subscription plans fetched successfully", { plans });
  } catch (err) {
    next(err);
  }
};