const mongoose = require("mongoose");

const instructorApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal Info
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },

    // Professional Info
    expertise: [
      {
        type: String,
        required: true,
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Social proof
    portfolio: {
      type: String, // URL or link to portfolio
      required: true,
    },
    twitter: String,
    linkedin: String,
    website: String,
    discord: String, // ← ADDED DISCORD FIELD

    // Teaching experience
    hasTeachingExperience: {
      type: Boolean,
      required: true,
    },
    teachingExperienceDetails: String,

    // Course plan
    proposedCourses: [
      {
        title: String,
        description: String,
        category: String,
      },
    ],

    // Why teach
    motivation: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Verification
    identityVerified: {
      type: Boolean,
      default: false,
    },
    portfolioVerified: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "under-review", "approved", "rejected"],
      default: "pending",
    },

    // Admin review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    rejectionReason: String,
    adminNotes: String,

    // Follow-up
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpMessage: String,
  },
  {
    timestamps: true,
  }
);

instructorApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model(
  "InstructorApplication",
  instructorApplicationSchema
);
