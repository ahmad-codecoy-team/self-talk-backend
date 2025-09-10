// models/Conversation.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

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
    messages: {
      type: [MessageSchema],
      default: [],
      validate: [
        {
          validator: function (arr) {
            return Array.isArray(arr) && arr.length > 0;
          },
          message: "At least one message is required.",
        },
      ],
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
