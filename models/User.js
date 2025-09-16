const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String, // URL of the profile picture
      default: "uploads/profile_pics/default-profile-pic.jpg",
    },
    resetOTP: {
      type: String,
      default: null,
    },
    resetOTPExp: {
      type: Date,
      default: null,
    },
    voice_id: {
      type: String,
      default: null,
    },
    model_id: {
      type: String,
      default: null,
    },
    total_minutes: {
      type: Number,
      default: 2, // Default 2 minutes for free plan
      min: 0,
    },
    available_minutes: {
      type: Number,
      default: 2, // Default 2 minutes for free plan
      min: 0,
    },
    current_subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null, // Will be set to Free plan ID after plan creation
    },
    subscription_started_at: {
      type: Date,
      default: null,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
