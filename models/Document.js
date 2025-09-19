const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["privacy-policy", "terms-conditions"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "document",
      immutable: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Update lastUpdated field on save
DocumentSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.lastUpdated = new Date();
  }
  next();
});

// Index for faster queries
DocumentSchema.index({ slug: 1 });
DocumentSchema.index({ isPublished: 1 });

module.exports = mongoose.model("Document", DocumentSchema);