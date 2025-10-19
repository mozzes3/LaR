const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  videoId: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  duration: Number, // in seconds
  order: Number,
  isPreview: {
    type: Boolean,
    default: false,
  },
  resources: {
    type: [
      {
        title: {
          type: String,
          required: false,
        },
        url: {
          type: String,
          required: false,
        },
        type: {
          type: String,
          required: false,
        },
      },
    ],
    default: [],
  },
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  order: Number,
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    subtitle: {
      type: String,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
    },

    // Instructor
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    certificateTemplate: {
      type: String,
      default: null, // URL to custom certificate template for this course
    },
    // Content
    sections: [sectionSchema],

    // Media
    thumbnail: {
      type: String,
      required: false, //
      default: "", //
    },
    previewVideo: {
      videoId: String,
      videoUrl: String,
    },

    // Pricing
    price: {
      usd: {
        type: Number,
        required: true,
        min: 0,
      },
      fdr: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    discountPrice: {
      usd: Number,
      fdr: Number,
    },
    discountEndDate: Date,

    // Category & Tags
    category: {
      type: String,
      required: true,
      enum: [
        "Web3 Development",
        "Blockchain Fundamentals",
        "DeFi",
        "NFTs & Digital Art",
        "Smart Contracts",
        "Community Building",
        "Marketing & Growth",
        "Trading & Investment",
        "Security & Auditing",
        "DAOs & Governance",
        "Gaming & Metaverse",
        "Content Creation",
        "Business & Entrepreneurship",
        "Design & UX",
        "Legal & Compliance",
      ],
    },
    subcategories: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],

    // Level
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"], // ← lowercase!
      default: "beginner",
    },

    // Requirements
    requirements: [String],
    whatYouWillLearn: [String],
    targetAudience: [String],

    // Stats
    totalDuration: {
      type: Number,
      default: 0, // in seconds
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "pending", "published", "archived"],
      default: "draft",
    },
    publishedAt: Date,

    // SEO
    metaTitle: String,
    metaDescription: String,

    // Features
    hasSubtitles: {
      type: Boolean,
      default: false,
    },
    hasCertificate: {
      type: Boolean,
      default: true,
    },
    hasLifetimeAccess: {
      type: Boolean,
      default: true,
    },

    // Revenue
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ instructor: 1, createdAt: -1 }); // ✅ ADD THIS
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ "price.usd": 1 }); // ✅ ADD THIS for price filters
courseSchema.index({ averageRating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ status: 1, publishedAt: -1 }); // ✅ ADD THIS

// Generate slug from title
courseSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  let totalLessons = 0;
  let totalDuration = 0;

  this.sections.forEach((section) => {
    section.lessons.forEach((lesson) => {
      totalLessons++;
      totalDuration += lesson.duration || 0;
    });
  });

  this.totalLessons = totalLessons;
  this.totalDuration = totalDuration;

  next();
});

// Calculate total duration and lessons
courseSchema.methods.calculateStats = function () {
  let totalDuration = 0;
  let totalLessons = 0;

  this.sections.forEach((section) => {
    section.lessons.forEach((lesson) => {
      totalDuration += lesson.duration || 0;
      totalLessons++;
    });
  });

  this.totalDuration = totalDuration;
  this.totalLessons = totalLessons;
};

// Update rating
courseSchema.methods.updateRating = function (newRating, oldRating = null) {
  if (oldRating !== null) {
    // Updating existing review
    const totalRatingPoints = this.averageRating * this.totalRatings;
    const updatedTotalPoints = totalRatingPoints - oldRating + newRating;
    this.averageRating = updatedTotalPoints / this.totalRatings;

    // Update distribution
    this.ratingDistribution[oldRating]--;
    this.ratingDistribution[newRating]++;
  } else if (newRating) {
    // Adding new review
    const totalRatingPoints = this.averageRating * this.totalRatings;
    this.totalRatings += 1;
    this.averageRating = (totalRatingPoints + newRating) / this.totalRatings;

    // Update distribution
    this.ratingDistribution[newRating] =
      (this.ratingDistribution[newRating] || 0) + 1;
  } else {
    // Removing review (oldRating exists, newRating is null)
    if (this.totalRatings > 0) {
      const totalRatingPoints = this.averageRating * this.totalRatings;
      this.totalRatings -= 1;

      if (this.totalRatings === 0) {
        this.averageRating = 0;
      } else {
        this.averageRating =
          (totalRatingPoints - oldRating) / this.totalRatings;
      }

      // Update distribution
      this.ratingDistribution[oldRating] = Math.max(
        0,
        (this.ratingDistribution[oldRating] || 0) - 1
      );
    }
  }

  return this;
};

module.exports = mongoose.model("Course", courseSchema);
