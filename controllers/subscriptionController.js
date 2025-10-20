const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const { success, error } = require("../utils/response");
const { formatPlanResponse } = require("../utils/formatters");

// =================== USER SUBSCRIPTION MANAGEMENT ===================

// GET - Get user's current subscription details
exports.getUserSubscription = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId)
      .select("voice_id model_id total_minutes available_minutes current_subscription subscription_started_at subscription_end_date")
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
        current_plan: user.current_subscription ? formatPlanResponse(user.current_subscription) : null,
        started_at: user.subscription_started_at,
        end_date: user.subscription_end_date,
      },
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

    // Replace current subscription completely
    user.current_subscription = plan_id;
    user.subscription_started_at = new Date();
    
    // Set subscription end date only for paid plans
    // Free plan has no expiry (users get one-time minutes)
    if (plan.name.toLowerCase() === "free") {
      user.subscription_end_date = null;
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      user.subscription_end_date = endDate;
    }

    // Replace minutes with new plan's minutes (not add)
    user.total_minutes = plan.voice_minutes;
    user.available_minutes = plan.voice_minutes;

    await user.save();

    // Populate the plan details for response
    await user.populate("current_subscription");

    return success(res, 200, "Successfully subscribed to plan", {
      user_subscription: {
        current_plan: formatPlanResponse(user.current_subscription),
        started_at: user.subscription_started_at,
        end_date: user.subscription_end_date,
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

    return success(res, 200, "Active subscription plans fetched successfully", {
      plans: plans.map(plan => formatPlanResponse(plan))
    });
  } catch (err) {
    next(err);
  }
};

// POST - Check and handle subscription expiry
exports.checkSubscriptionExpiry = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId).populate("current_subscription");
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Free users don't have expiry (one-time minutes)
    if (user.current_subscription && user.current_subscription.name.toLowerCase() === "free") {
      return success(res, 200, "Free plan has no expiry", {
        is_expired: false,
        is_free_plan: true,
        current_plan: formatPlanResponse(user.current_subscription),
        available_minutes: user.available_minutes,
      });
    }

    // Check if subscription has expired (only for paid plans)
    const now = new Date();
    const isExpired = user.subscription_end_date && user.subscription_end_date < now;

    if (!isExpired) {
      // Subscription is still active
      return success(res, 200, "Subscription is active", {
        is_expired: false,
        current_plan: formatPlanResponse(user.current_subscription),
        end_date: user.subscription_end_date,
        available_minutes: user.available_minutes,
      });
    }

    // Subscription has expired - downgrade to Free plan
    const freePlan = await SubscriptionPlan.findOne({ name: "Free" });
    if (!freePlan) {
      return error(res, 500, "Free plan not found. Please contact support.");
    }

    // Reset to Free plan
    user.current_subscription = freePlan._id;
    user.subscription_started_at = now;
    
    // Free plan has no expiry (one-time minutes)
    user.subscription_end_date = null;

    // Reset minutes to Free plan's minutes
    user.total_minutes = freePlan.voice_minutes;
    user.available_minutes = freePlan.voice_minutes;

    await user.save();
    await user.populate("current_subscription");

    return success(res, 200, "Subscription expired. Downgraded to Free plan", {
      is_expired: true,
      was_downgraded: true,
      current_plan: formatPlanResponse(user.current_subscription),
      started_at: user.subscription_started_at,
      end_date: user.subscription_end_date,
      total_minutes: user.total_minutes,
      available_minutes: user.available_minutes,
    });
  } catch (err) {
    next(err);
  }
};
