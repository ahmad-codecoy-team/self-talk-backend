const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
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
      default: "",
    },
    voice_id: {
      type: String,
      default: null,
    },
    model_id: {
      type: String,
      default: null,
    },
    counter: {
      type: Number,
      default: 0,
    },
    current_subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      default: null,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    is_suspended: {
      type: Boolean,
      default: false,
    },
    lastAccess: {
      type: Date,
      default: null,
    },
    comped: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
