const mongoose = require("mongoose");

const FAQSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["General", "Account", "Billing", "Features", "Technical"],
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQ", FAQSchema);