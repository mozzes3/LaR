const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "manual_escrow_release",
        "manual_escrow_refund",
        "grant_free_course_access",
        "remove_course_access",
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Purchase", "User", "Course"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ipAddress: String,
  },
  {
    timestamps: true,
  }
);

adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
