const mongoose = require("mongoose");

const UserSubscriptionSchema = new mongoose.Schema(
  {
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    name: {
      type: String,
      required: true,
      enum: ["Free", "Premium", "Super"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    billing_period: {
      type: String,
      required: true,
      enum: ["monthly"],
      default: "monthly",
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    description: {
      type: String,
      required: true,
    },
    is_popular: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      required: true,
      default: "EUR",
      trim: true,
    },
    // OLD MINUTES-BASED SYSTEM (commented for Socket.io implementation)
    // total_minutes: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
    // available_minutes: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
    // extra_minutes: {
    //   type: Number,
    //   required: true,
    //   default: 0,
    //   min: 0,
    // },

    // NEW SECONDS-BASED SYSTEM for real-time Socket.io timer management
    total_minutes: {
      type: Number,
      required: true,
      min: 0,
    },
    available_minutes: {
      type: Number,
      required: true,
      min: 0,
    },
    extra_minutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    seconds: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    recordings: {
      type: [String],
      default: [],
    },
    subscription_started_at: {
      type: Date,
      default: Date.now,
    },
    subscription_end_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
UserSubscriptionSchema.index({ status: 1 });
UserSubscriptionSchema.index({ subscription_end_date: 1 });

module.exports = mongoose.model("UserSubscription", UserSubscriptionSchema);
