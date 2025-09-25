const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ["Info", "Success", "Warning", "Error"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    target_audience: {
      type: String,
      required: true,
      enum: ["All Users", "Active Users", "Premium Users", "Free Users"],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Add index for efficient querying
NotificationSchema.index({ target_audience: 1, is_active: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);