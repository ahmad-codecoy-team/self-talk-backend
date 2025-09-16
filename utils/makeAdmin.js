require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find user by email and make them admin
    const result = await User.updateOne(
      { email: "admin@example.com" },
      { $set: { is_admin: true } }
    );

    console.log("Admin user updated:", result);

    // Verify the update
    const adminUser = await User.findOne({ email: "admin@example.com" });
    console.log("Admin user:", {
      email: adminUser.email,
      is_admin: adminUser.is_admin
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

makeAdmin();