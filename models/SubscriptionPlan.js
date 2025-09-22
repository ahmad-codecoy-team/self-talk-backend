const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
      enum: ["yearly", "monthly"],
      default: "yearly",
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
  },
  { timestamps: true }
);

// Index for efficient queries
SubscriptionPlanSchema.index({ name: 1 }, { unique: true });
SubscriptionPlanSchema.index({ status: 1 });

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
