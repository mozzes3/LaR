const mongoose = require("mongoose");

const userPermissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    customPermissions: [
      {
        resource: {
          type: String,
          required: true,
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "approve", "publish"],
          },
        ],
        granted: {
          type: Boolean,
          default: true,
        },
      },
    ],
    deniedPermissions: [
      {
        resource: {
          type: String,
          required: true,
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "approve", "publish"],
          },
        ],
      },
    ],
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

userPermissionSchema.index({ user: 1 });

module.exports = mongoose.model("UserPermission", userPermissionSchema);
