const mongoose = require("mongoose");

const AccentSchema = new mongoose.Schema(
  {
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Accent", AccentSchema);
