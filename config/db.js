const mongoose = require("mongoose");
const { seedSubscriptionPlans } = require("../utils/seedPlans");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Initialize default subscription plans
    await seedSubscriptionPlans();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
