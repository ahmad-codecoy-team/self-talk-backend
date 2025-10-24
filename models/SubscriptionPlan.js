const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
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
    voice_minutes: {
      type: Number,
      required: true,
      min: 0,
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
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
SubscriptionPlanSchema.index({ name: 1 }, { unique: true });
SubscriptionPlanSchema.index({ status: 1 });

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
