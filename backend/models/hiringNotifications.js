const mongoose = require("mongoose");

const hiringNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "connection_request",
        "connection_accepted",
        "connection_rejected",
        "profile_view",
        "job_application",
        "job_approved",
        "job_rejected",
        "verification_expiring",
        "verification_expired",
      ],
      required: true,
    },

    // Related entities
    connectionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectionRequest",
    },
    jobListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobListing",
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notification content
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
hiringNotificationSchema.index({ user: 1, isRead: 1 });
hiringNotificationSchema.index({ user: 1, createdAt: -1 });
hiringNotificationSchema.index({ type: 1 });

// Method to mark as read
hiringNotificationSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark all as read for a user
hiringNotificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
hiringNotificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

module.exports = mongoose.model("HiringNotification", hiringNotificationSchema);
