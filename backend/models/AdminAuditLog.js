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
        // Payment actions
        "manual_escrow_release",
        "manual_escrow_refund",
        "grant_free_course_access",
        "remove_course_access",
        "create_payment_token",
        "update_payment_token",
        "delete_payment_token",
        "update_platform_settings",
        "update_instructor_fees",
        // User management
        "assign_role",
        "update_user_permissions",
        "toggle_user_ban",
        "make_super_admin",
        "update_user_details",
        "toggle_instructor_status",
        // Role management
        "create_role",
        "update_role",
        "delete_role",
        // Course management
        "update_course_status",
        "delete_course",
        "approve_course",
        // Application management
        "approve_instructor_application",
        "reject_instructor_application",
        // Review management
        "delete_review",
        "update_review_status",
      ],
    },
    targetType: {
      type: String,
      required: true,
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
    userRole: {
      type: String,
      enum: ["superadmin", "admin", "moderator"],
    },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetId: 1, createdAt: -1 });
adminAuditLogSchema.index({ userRole: 1, createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
