const mongoose = require("mongoose");

const CustomSupportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
CustomSupportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CustomSupport", CustomSupportSchema);