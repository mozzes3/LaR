const mongoose = require("mongoose");

const videoSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    videoIds: [
      {
        type: String, // Bunny video IDs
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // ✅ Auto-delete after 24 hours
    },
  },
  { timestamps: true }
);

// Index for cleanup
videoSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user + course lookup
videoSessionSchema.index({ user: 1, course: 1, isActive: 1 });

module.exports = mongoose.model("VideoSession", videoSessionSchema);
