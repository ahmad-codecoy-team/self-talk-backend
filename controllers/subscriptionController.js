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
// exports.buySubscription = async (req, res, next) => {
//   try {
//     const userId = req.user.uid;
//     const { name } = req.body;

//     if (!name) {
//       return error(res, 400, "Plan name is required");
//     }

//     // Validate plan name
//     const validPlans = ["Free", "Premium", "Super"];
//     if (!validPlans.includes(name)) {
//       return error(
//         res,
//         400,
//         "Invalid plan name. Valid plans: Free, Premium, Super"
//       );
//     }

//     // Find the plan template from database
//     const planTemplate = await SubscriptionPlan.findOne({ name });
//     if (!planTemplate) {
//       return error(res, 404, `${name} plan template not found in database`);
//     }

//     const user = await User.findById(userId).populate("role");
//     if (!user) {
//       return error(res, 404, "User not found");
//     }

//     // Delete old user subscription (user loses everything from previous subscription)
//     if (user.current_subscription) {
//       await UserSubscription.deleteOne({ _id: user.current_subscription });
//     }

//     // Calculate subscription dates
//     const now = new Date();
//     const endDate = new Date(now);
//     endDate.setMonth(endDate.getMonth() + 1); // Add 1 month for all plans including Free

//     // Get minutes based on plan template
//     const minutes = planTemplate.voice_minutes;

//     // Create new user subscription
//     const newUserSubscription = await UserSubscription.create({
//       plan_id: planTemplate._id,
//       name: planTemplate.name,
//       status: planTemplate.status,
//       price: planTemplate.price,
//       billing_period: planTemplate.billing_period,
//       features: planTemplate.features,
//       description: planTemplate.description,
//       is_popular: planTemplate.is_popular,
//       currency: planTemplate.currency,
//       total_minutes: minutes,
//       available_minutes: minutes,
//       recordings: [],
//       subscription_started_at: now,
//       subscription_end_date: endDate,
//     });

//     // Update user's subscription reference
//     user.current_subscription = newUserSubscription._id;
//     await user.save();

//     // Reload user with populated subscription
//     const updatedUser = await User.findById(userId)
//       .select("-password")
//       .populate("role")
//       .populate("current_subscription");

//     return success(res, 200, "Successfully subscribed to plan", {
//       user: formatUserResponse(updatedUser),
//     });
//   } catch (err) {
//     next(err);
//   }
// };

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

    if (user.current_subscription) {
      await UserSubscription.deleteOne({ _id: user.current_subscription });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const minutes = planTemplate.voice_minutes;

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
      recordings: [],
      subscription_started_at: now,
      subscription_end_date: endDate,
    });

    user.current_subscription = newUserSubscription._id;
    await user.save();

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

    // Add minutes to both total and available
    userSubscription.total_minutes += minutes;
    userSubscription.available_minutes += minutes;
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

    // Find Free plan template
    const freePlanTemplate = await SubscriptionPlan.findOne({ name: "Free" });
    if (!freePlanTemplate) {
      return error(res, 404, "Free plan template not found in database");
    }

    // Delete current user subscription
    await UserSubscription.deleteOne({ _id: currentSubscription._id });

    // Calculate new dates (1 month from now)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create new Free user subscription with 2 minutes
    const newFreeSubscription = await UserSubscription.create({
      plan_id: freePlanTemplate._id,
      name: freePlanTemplate.name,
      status: freePlanTemplate.status,
      price: freePlanTemplate.price,
      billing_period: freePlanTemplate.billing_period,
      features: freePlanTemplate.features,
      description: freePlanTemplate.description,
      is_popular: freePlanTemplate.is_popular,
      currency: freePlanTemplate.currency,
      total_minutes: 2,
      available_minutes: 2,
      recordings: [],
      subscription_started_at: now,
      subscription_end_date: endDate,
    });

    // Update user's subscription reference
    user.current_subscription = newFreeSubscription._id;
    await user.save();

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

// POST - Update recordings in user's subscription (internal use only)
exports.updateRecordings = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { recordings } = req.body;

    if (!recordings || !Array.isArray(recordings)) {
      return error(res, 400, "Recordings must be an array");
    }

    // Validate all recordings are strings
    if (!recordings.every((r) => typeof r === "string")) {
      return error(res, 400, "All recording IDs must be strings");
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

    // Update recordings
    userSubscription.recordings = recordings;
    await userSubscription.save();

    return success(res, 200, "Recordings updated successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};
