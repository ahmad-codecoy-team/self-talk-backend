// models/Conversation.js
const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    mood: {
      type: String,
      trim: true,
      default: null, // fixed string for now; later link to mood module
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    durationSec: {
      type: Number,
      required: true,
      min: 0,
    },
    // 📌 messages removed (now in Message collection)
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
