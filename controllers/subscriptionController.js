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
      // .select("voice_id model_id current_subscription")
      .select("current_subscription")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    return success(res, 200, "User subscription details fetched successfully", {
      current_plan: user.current_subscription
        ? formatPlanResponse(user.current_subscription)
        : null,
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

    // Define plan templates (since we're using plan names now)
    const planTemplates = {
      free: {
        name: "Free",
        status: "Active",
        price: 0,
        billing_period: "monthly",
        voice_minutes: 2,
        features: ["2 voice minutes", "Basic AI companion"],
        description: "Perfect for trying out SelfTalk",
        is_popular: false,
        currency: "EUR",
      },
      premium: {
        name: "Premium",
        status: "Active",
        price: 9.99,
        billing_period: "monthly",
        voice_minutes: 100,
        features: [
          "100 voice minutes",
          "Premium AI companion",
          "Priority support",
        ],
        description: "Perfect for regular users",
        is_popular: true,
        currency: "EUR",
      },
      super: {
        name: "Super",
        status: "Active",
        price: 19.99,
        billing_period: "monthly",
        voice_minutes: 500,
        features: [
          "500 voice minutes",
          "Super AI companion",
          "24/7 support",
          "Advanced features",
        ],
        description: "Perfect for power users",
        is_popular: false,
        currency: "EUR",
      },
    };

    // Get the plan template by plan_id (which should be the plan name)
    const basePlan = planTemplates[plan_id.toLowerCase()];
    if (!basePlan) {
      return error(
        res,
        404,
        "Subscription plan not found. Valid plans: free, premium, super"
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Delete old subscription plan for this user if exists
    if (user.current_subscription) {
      await SubscriptionPlan.deleteOne({
        _id: user.current_subscription,
        user_id: userId,
      });
    }

    // Set subscription end date only for paid plans
    let subscriptionEndDate = null;
    if (basePlan.name.toLowerCase() !== "free") {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscriptionEndDate = endDate;
    }

    // Create new subscription plan instance for this user
    const userSubscriptionPlan = await SubscriptionPlan.create({
      name: basePlan.name,
      status: basePlan.status,
      price: basePlan.price,
      billing_period: basePlan.billing_period,
      voice_minutes: basePlan.voice_minutes,
      features: basePlan.features,
      description: basePlan.description,
      is_popular: basePlan.is_popular,
      currency: basePlan.currency,
      total_minutes: basePlan.voice_minutes,
      available_minutes: basePlan.voice_minutes,
      user_id: userId,
      subscription_started_at: new Date(),
      subscription_end_date: subscriptionEndDate,
    });

    // Update user's current subscription reference
    user.current_subscription = userSubscriptionPlan._id;
    await user.save();

    // Populate the plan details for response
    await user.populate("current_subscription");

    return success(res, 200, "Successfully subscribed to plan", {
      user_subscription: {
        current_plan: formatPlanResponse(user.current_subscription),
        subscription_details: formatPlanResponse(userSubscriptionPlan),
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

    const user = await User.findById(userId).populate("current_subscription");
    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.current_subscription) {
      return error(res, 400, "User has no active subscription");
    }

    // Find the user's subscription plan
    const subscriptionPlan = await SubscriptionPlan.findOne({
      _id: user.current_subscription._id,
      // user_id: userId
    });

    if (!subscriptionPlan) {
      return error(res, 404, "Subscription plan not found");
    }

    // Add minutes to both total and available in the subscription plan
    subscriptionPlan.total_minutes += minutes;
    subscriptionPlan.available_minutes += minutes;

    await subscriptionPlan.save();

    return success(res, 200, "Minutes added successfully", {
      added_minutes: minutes,
      total_minutes: subscriptionPlan.total_minutes,
      available_minutes: subscriptionPlan.available_minutes,
    });
  } catch (err) {
    next(err);
  }
};

// GET - Get all active plans (for users to see available options)
exports.getActivePlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ status: "Active" }).sort({
      price: 1,
    });

    return success(res, 200, "Active subscription plans fetched successfully", {
      plans: plans.map((plan) => formatPlanResponse(plan)),
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

    if (!user.current_subscription) {
      return error(res, 400, "User has no active subscription");
    }

    // Get the user's subscription plan details
    const userSubscription = await SubscriptionPlan.findOne({
      _id: user.current_subscription._id,
      // user_id: userId,
    });

    if (!userSubscription) {
      return error(res, 404, "User subscription details not found");
    }

    // Free users don't have expiry (one-time minutes)
    if (userSubscription.name.toLowerCase() === "free") {
      return success(res, 200, "Free plan has no expiry", {
        is_expired: false,
        is_free_plan: true,
        current_plan: formatPlanResponse(user.current_subscription),
      });
    }

    // Check if subscription has expired (only for paid plans)
    const now = new Date();
    const isExpired =
      userSubscription.subscription_end_date &&
      userSubscription.subscription_end_date < now;

    if (!isExpired) {
      // Subscription is still active
      return success(res, 200, "Subscription is active", {
        is_expired: false,
        current_plan: formatPlanResponse(user.current_subscription),
        subscription_details: formatPlanResponse(userSubscription),
      });
    }

    // Subscription has expired - downgrade to Free plan
    // Delete the expired subscription
    await SubscriptionPlan.deleteOne({ _id: userSubscription._id });

    // Create new Free plan for user
    const freeSubscription = await SubscriptionPlan.create({
      name: "Free",
      status: "Active",
      price: 0,
      billing_period: "monthly",
      voice_minutes: 2,
      features: ["2 voice minutes", "Basic AI companion"],
      description: "Perfect for trying out SelfTalk",
      is_popular: false,
      currency: "EUR",
      total_minutes: 2,
      available_minutes: 2,
      user_id: userId,
      subscription_started_at: now,
      subscription_end_date: null, // Free plan has no expiry
    });

    // Update user's subscription reference
    user.current_subscription = freeSubscription._id;
    await user.save();
    await user.populate("current_subscription");

    return success(res, 200, "Subscription expired. Downgraded to Free plan", {
      is_expired: true,
      was_downgraded: true,
      current_plan: formatPlanResponse(user.current_subscription),
      subscription_details: formatPlanResponse(freeSubscription),
    });
  } catch (err) {
    next(err);
  }
};
