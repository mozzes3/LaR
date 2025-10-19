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
      sparse: true,
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

    paymentWallets: [
      {
        blockchain: {
          type: String,
          enum: ["evm"],
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    avatar: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastUsernameChange: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    // NEW: Advanced role system
    roleRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    customPermissions: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPermission",
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
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
    badges: [
      {
        type: String,
        enum: ["Instructor", "Creator", "KOL", "Professional", "Expert"],
      },
    ],
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
    totalXP: {
      type: Number,
      default: 0,
    },
    tokensEarned: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    reviewsWritten: {
      type: Number,
      default: 0,
    },
    unlockedAchievements: [
      {
        achievementId: {
          type: String,
          required: true,
        },
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
        xpEarned: {
          type: Number,
          default: 0,
        },
        fdrEarned: {
          type: Number,
          default: 0,
        },
      },
    ],

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
userSchema.index({ walletAddress: 1 }); // ✅ Already unique, but ensure index
userSchema.index({ email: 1 }, { sparse: true }); // ✅ ADD THIS
userSchema.index({ isInstructor: 1, instructorVerified: 1 }); // ✅ ADD THIS
userSchema.index({ isInstructor: 1 });
userSchema.index({ level: -1 });
userSchema.index({ roleRef: 1 });
userSchema.index({ isSuperAdmin: 1 });
userSchema.index({ createdAt: -1 }); // ✅ ADD THIS for sorting

// Calculate level from experience
userSchema.methods.calculateLevel = function () {
  this.level = Math.floor(Math.sqrt(this.experience / 100)) + 1;
  return this.level;
};

userSchema.virtual("primaryBadge").get(function () {
  if (!this.badges || this.badges.length === 0) return "Instructor";
  if (this.badges.includes("Instructor")) return "Instructor";
  return this.badges[0];
});

// Method to get sorted badges (Instructor first)
userSchema.methods.getSortedBadges = function () {
  if (!this.badges || this.badges.length === 0) return ["Instructor"];

  const badges = [...this.badges];
  badges.sort((a, b) => {
    if (a === "Instructor") return -1;
    if (b === "Instructor") return 1;
    return 0;
  });

  return badges;
};

// Enable virtuals in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Add experience and update level
userSchema.methods.addExperience = function (amount) {
  this.experience += amount;
  this.calculateLevel();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
