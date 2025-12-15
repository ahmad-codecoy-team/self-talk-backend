const mongoose = require("mongoose");

const PromptSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    llmModal: {
      type: String,
      required: false,
      trim: true,
    },
    ttsModal: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prompt", PromptSchema);