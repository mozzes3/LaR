const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true, // Can be null, but if exists must be unique
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: null,
    },
    displayName: {
      // ← ADD THIS ENTIRE BLOCK
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastUsernameChange: {
      // ← ADD THIS TOO IF NOT THERE
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    // Instructor specific
    isInstructor: {
      type: Boolean,
      default: false,
    },
    instructorVerified: {
      type: Boolean,
      default: false,
    },
    instructorBio: {
      type: String,
      maxlength: 1000,
    },
    expertise: [
      {
        type: String,
      },
    ],
    socialLinks: {
      twitter: String,
      website: String,
      linkedin: String,
    },

    // Learning progress
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    learningPoints: {
      type: Number,
      default: 0,
    },

    // Stats
    totalCoursesCreated: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },

    // Student stats
    coursesEnrolled: {
      type: Number,
      default: 0,
    },
    coursesCompleted: {
      type: Number,
      default: 0,
    },
    certificatesEarned: {
      type: Number,
      default: 0,
    },

    // Wallet & Payment
    fdrBalance: {
      type: Number,
      default: 0,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ isInstructor: 1 });
userSchema.index({ level: -1 });

// Calculate level from experience
userSchema.methods.calculateLevel = function () {
  // Level formula: level = floor(sqrt(experience / 100))
  this.level = Math.floor(Math.sqrt(this.experience / 100)) + 1;
  return this.level;
};

// Add experience and update level
userSchema.methods.addExperience = function (amount) {
  this.experience += amount;
  this.calculateLevel();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
