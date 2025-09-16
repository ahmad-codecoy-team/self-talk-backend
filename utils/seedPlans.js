const SubscriptionPlan = require("../models/SubscriptionPlan");

// Initialize default subscription plans
const seedSubscriptionPlans = async () => {
  try {
    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans > 0) {
      console.log("Subscription plans already exist");
      return;
    }

    // Default plans data
    const defaultPlans = [
      {
        name: "Free",
        status: "Active",
        price: 0.0,
        billing_period: "yearly",
        voice_minutes: 2,
        features: [
          "2 voice minutes",
          "Basic AI companion",
          "Text conversations",
          "Standard voice quality",
        ],
        description: "Perfect for trying out SelfTalk",
        is_popular: false,
      },
      {
        name: "Premium",
        status: "Active",
        price: 99.9,
        billing_period: "yearly",
        voice_minutes: 50,
        features: [
          "50 voice minutes",
          "Advanced AI companion",
          "Voice & text conversations",
          "High-quality voice",
          "Priority support",
          "Custom voice settings",
        ],
        description: "Great for regular users",
        is_popular: true,
      },
      {
        name: "Super",
        status: "Active",
        price: 299.9,
        billing_period: "yearly",
        voice_minutes: 200,
        features: [
          "200 voice minutes",
          "Premium AI companion",
          "All conversation types",
          "Studio-quality voice",
          "24/7 priority support",
          "Advanced customization",
          "Early access to features",
        ],
        description: "Ultimate experience for power users",
        is_popular: false,
      },
    ];

    // Create the plans
    const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
    console.log("Default subscription plans created:", createdPlans.length);

    return createdPlans;
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
    throw error;
  }
};

// Get the Free plan ID
const getFreePlanId = async () => {
  try {
    const freePlan = await SubscriptionPlan.findOne({ name: "Free" });
    return freePlan ? freePlan._id : null;
  } catch (error) {
    console.error("Error getting free plan ID:", error);
    return null;
  }
};

module.exports = {
  seedSubscriptionPlans,
  getFreePlanId,
};