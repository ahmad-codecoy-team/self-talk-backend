const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");
const { success, error } = require("../utils/response");
const { formatUserResponse } = require("../utils/formatters");

// =================== USER SUBSCRIPTION MANAGEMENT ===================

// GET - Get user's current subscription details with full user profile
exports.getUserSubscription = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId)
      .select("-password")
      .populate("role")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    return success(res, 200, "User subscription details fetched successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// POST - Buy/Subscribe to a plan (replaces old subscription completely)
exports.buySubscription = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let { name } = req.body;

    if (!name) {
      return error(res, 400, "Plan name is required");
    }

    // Normalize plan name case
    if (typeof name === "string") {
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    // Validate plan name
    const validPlans = ["Free", "Premium", "Super"];
    if (!validPlans.includes(name)) {
      return error(
        res,
        400,
        "Invalid plan name. Valid plans: Free, Premium, Super"
      );
    }

    // Find the plan template
    const planTemplate = await SubscriptionPlan.findOne({ name });
    if (!planTemplate) {
      return error(res, 404, `${name} plan template not found in database`);
    }

    const user = await User.findById(userId).populate("role");
    if (!user) {
      return error(res, 404, "User not found");
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const minutes = planTemplate.voice_minutes;

    // If user has existing subscription, preserve extra_minutes and update fields
    if (user.current_subscription) {
      const existingSubscription = await UserSubscription.findById(
        user.current_subscription
      );
      const preservedExtraMinutes = existingSubscription
        ? existingSubscription.extra_minutes
        : 0;

      // Update existing subscription with new plan data but preserve extra_minutes
      await UserSubscription.findByIdAndUpdate(user.current_subscription, {
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
      });
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

      user.current_subscription = newUserSubscription._id;
      await user.save();
    }

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("role")
      .populate("current_subscription");

    return success(res, 200, "Successfully subscribed to plan", {
      user: formatUserResponse(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// POST - Add minutes to user account (for purchasing additional minutes at 0.99€ per minute)
exports.addMinutes = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return error(res, 400, "Minutes must be a positive number");
    }

    const user = await User.findById(userId)
      .populate("role")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.current_subscription) {
      return error(res, 400, "User has no active subscription");
    }

    const userSubscription = user.current_subscription;

    // Add minutes to extra_minutes and reflect in total_minutes (current cycle total)
    // Do not touch available_minutes; formatter will include extra in response
    userSubscription.extra_minutes += minutes;
    userSubscription.total_minutes += minutes;
    await userSubscription.save();

    return success(res, 200, "Minutes added successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// GET - Get all active plan templates (for users to see available options)
exports.getActivePlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ status: "Active" }).sort({
      price: 1,
    });

    return success(res, 200, "Active subscription plans fetched successfully", {
      plans: plans.map((plan) => ({
        _id: plan._id,
        name: plan.name,
        status: plan.status,
        price: plan.price,
        billing_period: plan.billing_period,
        features: plan.features,
        description: plan.description,
        is_popular: plan.is_popular,
        currency: plan.currency,
        voice_minutes: plan.voice_minutes,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST - Check and handle subscription expiry (always downgrades to Free and adds 2 minutes)
exports.checkSubscriptionExpiry = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId)
      .populate("role")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.current_subscription) {
      return error(res, 400, "User has no active subscription");
    }

    const currentSubscription = user.current_subscription;
    const preservedExtraMinutes = currentSubscription.extra_minutes || 0;

    // Find Free plan template
    const freePlanTemplate = await SubscriptionPlan.findOne({ name: "Free" });
    if (!freePlanTemplate) {
      return error(res, 404, "Free plan template not found in database");
    }

    // Calculate new dates (1 month from now)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    // Update existing subscription to Free plan while preserving extra_minutes
    await UserSubscription.findByIdAndUpdate(currentSubscription._id, {
      plan_id: freePlanTemplate._id,
      name: freePlanTemplate.name,
      status: freePlanTemplate.status,
      price: freePlanTemplate.price,
      billing_period: freePlanTemplate.billing_period,
      features: freePlanTemplate.features,
      description: freePlanTemplate.description,
      is_popular: freePlanTemplate.is_popular,
      currency: freePlanTemplate.currency,
      total_minutes: 2 + preservedExtraMinutes,
      available_minutes: 2,
      extra_minutes: preservedExtraMinutes,
      recordings: [],
      subscription_started_at: now,
      subscription_end_date: endDate,
    });

    // Reload user with populated subscription
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("role")
      .populate("current_subscription");

    return success(res, 200, "Downgraded to Free plan with 2 minutes", {
      user: formatUserResponse(updatedUser),
    });
  } catch (err) {
    next(err);
  }
};

// POST - Update recordings and/or available_minutes in user's subscription
exports.updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { recordings, available_minutes } = req.body;

    // Validate recordings if provided
    if (recordings !== undefined) {
      if (!Array.isArray(recordings)) {
        return error(res, 400, "Recordings must be an array");
      }
      if (!recordings.every((r) => typeof r === "string")) {
        return error(res, 400, "All recording IDs must be strings");
      }
    }

    // Validate available_minutes if provided
    if (available_minutes !== undefined) {
      if (typeof available_minutes !== "number" || available_minutes < 0) {
        return error(
          res,
          400,
          "Available minutes must be a non-negative number"
        );
      }
    }

    const user = await User.findById(userId)
      .populate("role")
      .populate("current_subscription");

    if (!user) {
      return error(res, 404, "User not found");
    }

    if (!user.current_subscription) {
      return error(res, 400, "User has no active subscription");
    }

    const userSubscription = user.current_subscription;

    // Update recordings if provided
    if (recordings !== undefined) {
      userSubscription.recordings = recordings;
    }

    // Update available_minutes if provided
    if (available_minutes !== undefined) {
      // Frontend sends total available (subscription + extra combined)
      // We need to split this back into subscription available_minutes and extra_minutes
      const currentTotal =
        (userSubscription.available_minutes || 0) +
        (userSubscription.extra_minutes || 0);
      const minutesConsumed = currentTotal - available_minutes;

      if (minutesConsumed > 0) {
        // Deduct from subscription minutes first
        let remainingToDeduct = minutesConsumed;

        if (userSubscription.available_minutes >= remainingToDeduct) {
          // All consumed from subscription minutes
          userSubscription.available_minutes -= remainingToDeduct;
        } else {
          // Consume all subscription minutes, then deduct from extra
          remainingToDeduct -= userSubscription.available_minutes;
          userSubscription.available_minutes = 0;
          userSubscription.extra_minutes = Math.max(
            0,
            userSubscription.extra_minutes - remainingToDeduct
          );
        }
      } else if (minutesConsumed < 0) {
        // Minutes increased (shouldn't happen in normal flow, but handle it)
        const minutesAdded = Math.abs(minutesConsumed);
        userSubscription.extra_minutes += minutesAdded;
      }
    }

    await userSubscription.save();

    return success(res, 200, "Subscription updated successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};
