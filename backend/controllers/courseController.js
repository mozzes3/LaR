const Course = require("../models/Course");
const User = require("../models/User");
const Purchase = require("../models/Purchase.DEPRECATED");
const Review = require("../models/Review");
const videoService = require("../services/videoService");
const validator = require("validator");
// Create new course
const createCourse = async (req, res) => {
  try {
    const { title, subtitle, description, category, level, price } = req.body;

    console.log("📥 Received course data:", req.body);

    if (!req.user.isInstructor || !req.user.instructorVerified) {
      return res
        .status(403)
        .json({ error: "Only verified instructors can create courses" });
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;

    while (await Course.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const course = await Course.create({
      title,
      slug,
      subtitle,
      description,
      category,
      level,
      price: {
        usd: parseFloat(price.usd) || 0,
        fdr: parseFloat(price.fdr) || 0,
      },
      instructor: req.userId,
      status: "draft",
      thumbnail: "", // ← Empty string instead of placeholder!
      acceptedPaymentMethods: req.body.acceptedPaymentMethods || [
        "usdt",
        "usdc",
      ],
    });

    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalCoursesCreated: 1 },
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("❌ Create course error:", error);
    console.error("❌ Error message:", error.message);
    res.status(500).json({ error: "Failed to create course" });
  }
};

// Get all courses (public browse)
// Get all courses (public browse)
const getCourses = async (req, res) => {
  try {
    const {
      search,
      category,
      level,
      minPrice,
      maxPrice,
      rating,
      sort = "newest",
      page = 1,
      limit = 12, // ✅ Already changed from 100
    } = req.query;

    console.log("📋 Course filters:", {
      search,
      category,
      level,
      minPrice,
      maxPrice,
      rating,
      sort,
      page,
    });

    // Build filter query
    let query = { status: "published" };

    // Check if we have any filters applied
    const hasFilters = !!(
      search ||
      category ||
      level ||
      minPrice ||
      maxPrice ||
      rating
    );

    // Search filter
    if (search && search.trim()) {
      const sanitized = validator.escape(search.trim());
      query.$or = [
        { title: { $regex: sanitized, $options: "i" } },
        { subtitle: { $regex: sanitized, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category.trim()) {
      query.category = category;
    }

    // Level filter
    if (level && level.trim()) {
      query.level = level.toLowerCase();
    }

    // Price filter
    if (minPrice || maxPrice) {
      query["price.usd"] = {};
      if (minPrice) {
        query["price.usd"].$gte = Number(minPrice);
      }
      if (maxPrice) {
        query["price.usd"].$lte = Number(maxPrice);
      }
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));

    // Sort options
    let sortQuery = {};
    switch (sort) {
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "popular":
        sortQuery = { enrollmentCount: -1 };
        break;
      case "rating":
        sortQuery = { averageRating: -1 };
        break;
      case "price-low":
        sortQuery = { "price.usd": 1 };
        break;
      case "price-high":
        sortQuery = { "price.usd": -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ OPTIMIZATION: Get courses
    const courses = await Course.find(query)
      .populate(
        "instructor",
        "username avatar instructorVerified badges walletAddress evmWalletAddress solanaWalletAddress acceptedPaymentMethods"
      )

      .sort(sortQuery)
      .limit(Number(limit))
      .skip(skip)
      .lean(); // ✅ Use lean() for better performance

    // ✅ CRITICAL OPTIMIZATION: Smart count strategy
    let total;

    if (page === 1 && !hasFilters) {
      // ✅ First page with no filters: Use super-fast estimated count
      total = await Course.estimatedDocumentCount();
      console.log("⚡ Using estimatedDocumentCount() - O(1) operation");
    } else {
      // ✅ Filtered or paginated: Use accurate count
      total = await Course.countDocuments(query);
      console.log("🔍 Using countDocuments() - filtered query");
    }

    console.log(`📊 Found ${courses.length} courses, total: ${total}`);

    res.json({
      success: true,
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};
// Get single course
// Get single course
const getCourse = async (req, res) => {
  try {
    const { slug } = req.params;

    console.log("=== getCourse START ===");
    console.log("1. Slug received:", slug);
    console.log("2. User ID:", req.userId);

    // ✅ DON'T use .lean() here because we need Mongoose methods later
    const course = await Course.findOne({ slug })
      .populate(
        "instructor",
        "username displayName avatar bio instructorBio expertise averageRating totalStudents instructorVerified socialLinks badges walletAddress evmWalletAddress solanaWalletAddress acceptedPaymentMethods"
      )
      .select(
        "title subtitle description category subcategory level price acceptedPaymentMethods requirements whatYouWillLearn targetAudience tags thumbnail sections averageRating totalRatings enrollmentCount instructor status createdAt"
      );

    console.log("3. Course found:", course ? "YES" : "NO");

    if (!course) {
      console.log("4. Sending 404 - Course not found");
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("5. Course title:", course.title);
    console.log("6. Course status:", course.status);

    // Check if user has purchased
    let hasPurchased = false;
    if (req.userId) {
      const purchase = await Purchase.findOne({
        user: req.userId,
        course: course._id,
        status: "active",
      });
      hasPurchased = !!purchase;
    }

    console.log("7. Has purchased:", hasPurchased);

    // Check authorization for unpublished courses
    if (course.status !== "published") {
      console.log("8. Course not published, checking authorization...");
      if (
        !req.userId ||
        req.userId.toString() !== course.instructor._id.toString()
      ) {
        console.log("9. Sending 403 - Not authorized");
        return res.status(403).json({ error: "Course not available" });
      }
    }

    // ✅ NOW convert to plain object (this is where .toObject() is used)
    const courseData = course.toObject();

    // ✅ NEW: Fetch durations from Bunny if missing
    const bunnyService = require("../services/bunnyService");
    let needsSave = false;

    for (const section of courseData.sections) {
      for (const lesson of section.lessons) {
        if ((!lesson.duration || lesson.duration === 0) && lesson.videoId) {
          try {
            console.log(
              `⏱️ Fetching duration for "${lesson.title}" from Bunny...`
            );
            const videoInfo = await bunnyService.getVideoInfo(lesson.videoId);

            if (videoInfo.duration > 0) {
              lesson.duration = videoInfo.duration;

              // Update in the actual course document
              const originalLesson = course.sections
                .find((s) => s._id.toString() === section._id.toString())
                ?.lessons.find(
                  (l) => l._id.toString() === lesson._id.toString()
                );

              if (originalLesson) {
                originalLesson.duration = videoInfo.duration;
                needsSave = true;
              }

              console.log(`✅ Set duration: ${videoInfo.duration}s`);
            }
          } catch (error) {
            console.error(
              `❌ Failed to get duration for "${lesson.title}":`,
              error.message
            );
            lesson.duration = 0;
          }
        }
      }
    }

    // Save course if we updated any durations
    if (needsSave) {
      await course.save();
      console.log("💾 Saved updated durations to database");
    }

    // Calculate total lessons
    const totalLessons = courseData.sections.reduce((total, section) => {
      return total + (section.lessons?.length || 0);
    }, 0);

    // Calculate total duration
    const totalDuration = courseData.sections.reduce((total, section) => {
      const sectionDuration = section.lessons.reduce((sum, lesson) => {
        return sum + (lesson.duration || 0);
      }, 0);
      return total + sectionDuration;
    }, 0);

    // Hide lesson videos if not purchased (except previews)
    const isInstructor =
      req.userId?.toString() === course.instructor._id.toString();

    if (!hasPurchased && !isInstructor) {
      courseData.sections = courseData.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: lesson.isPreview ? lesson.videoUrl : null,
          videoId: lesson.isPreview ? lesson.videoId : null,
        })),
      }));
    }

    console.log("10. Sending response with course data");

    res.json({
      course: {
        ...courseData,
        totalLessons: totalLessons,
        totalDuration: totalDuration,
      },
      hasPurchased,
      isInstructor: isInstructor,
    });

    console.log("11. Response sent successfully");
    console.log("=== getCourse END ===");
  } catch (error) {
    console.error("ERROR in getCourse:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};
// Update course
const updateCourse = async (req, res) => {
  try {
    const { slug } = req.params;

    console.log("📝 Updating course:", slug);
    console.log("📝 Raw body:", JSON.stringify(req.body, null, 2));

    const course = await Course.findOne({ slug });

    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.instructor.toString() !== req.userId.toString()) {
      console.log("❌ Not authorized");
      return res.status(403).json({ error: "Not authorized" });
    }

    const allowedUpdates = [
      "title",
      "subtitle",
      "description",
      "category",
      "subcategory",
      "level",
      "price",
      "acceptedPaymentMethods", // ADD THIS
      "requirements",
      "whatYouWillLearn",
      "targetAudience",
      "tags",
      "thumbnail",
      "sections",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        // Special handling for sections
        if (field === "sections") {
          console.log("🔍 Sections type:", typeof value);
          console.log("🔍 Sections value:", JSON.stringify(value, null, 2));

          // If it's a string, parse it
          if (typeof value === "string") {
            try {
              value = JSON.parse(value);
              console.log("✅ Parsed sections from string");
            } catch (e) {
              console.error("❌ Failed to parse sections:", e);
            }
          }

          // Ensure all resources in lessons are arrays
          if (Array.isArray(value)) {
            value = value.map((section) => ({
              ...section,
              lessons: (section.lessons || []).map((lesson) => {
                let resources = lesson.resources || [];

                // If resources is a string, parse it
                if (typeof resources === "string") {
                  try {
                    resources = JSON.parse(resources);
                    console.log(
                      "✅ Parsed resources from string for lesson:",
                      lesson.title
                    );
                  } catch (e) {
                    console.error(
                      "❌ Failed to parse resources for lesson:",
                      lesson.title,
                      e
                    );
                    resources = [];
                  }
                }

                // Ensure it's an array
                if (!Array.isArray(resources)) {
                  console.warn(
                    "⚠️ Resources is not an array, converting to empty array"
                  );
                  resources = [];
                }

                return {
                  ...lesson,
                  resources: resources,
                };
              }),
            }));
          }
        }

        console.log(`✏️ Updating ${field}`);
        course[field] = value;
      }
    });

    await course.save();

    console.log("✅ Course updated successfully");
    console.log("📋 New thumbnail:", course.thumbnail);
    console.log("📋 Sections count:", course.sections?.length);

    res.json({ success: true, course });
  } catch (error) {
    console.error("❌ Update course error:", error);
    console.error("❌ Error details:", error.message);
    res.status(500).json({ error: "Failed to update course" });
  }
};
// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete all videos from CDN
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson.videoId) {
          try {
            await videoService.deleteVideo(lesson.videoId);
          } catch (err) {
            console.error("Error deleting video:", err);
          }
        }
      }
    }

    await course.deleteOne();
    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

// Get instructor's courses
const getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.userId }).sort({
      createdAt: -1,
    });

    res.json({ courses });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

/**
 * Get courses by instructor
 */
const getCoursesByInstructor = async (req, res) => {
  try {
    const { username } = req.params;

    // Find instructor by username
    const instructor = await User.findOne({ username, isInstructor: true });

    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    // Get all courses by this instructor
    const courses = await Course.find({
      instructor: instructor._id,
      status: "published", // ← CHANGE FROM isPublished to status
    })
      .populate(
        "instructor",
        "username avatar instructorVerified badges walletAddress evmWalletAddress solanaWalletAddress acceptedPaymentMethods"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({ error: "Failed to get instructor courses" });
  }
};

/**
 * Get instructor's courses with detailed stats
 */
const getInstructorCoursesWithStats = async (req, res) => {
  try {
    const instructorId = req.userId;

    const courses = await Course.find({ instructor: instructorId })
      .sort({ createdAt: -1 })
      .lean();

    // Get stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Get purchase count
        const purchases = await Purchase.find({
          course: course._id,
          status: "active",
        });

        const students = purchases.length;
        const revenue = students * (course.price?.usd || 0);

        // Get completion rate
        const completedCount = purchases.filter((p) => p.isCompleted).length;
        const completionRate =
          students > 0 ? Math.round((completedCount / students) * 100) : 0;

        // Get review count
        const reviews = await Review.countDocuments({ course: course._id });

        return {
          ...course,
          students,
          revenue: Math.round(revenue * 100) / 100,
          reviews,
          completionRate,
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithStats,
    });
  } catch (error) {
    console.error("Get instructor courses with stats error:", error);
    res.status(500).json({ error: "Failed to get courses" });
  }
};
// Publish course
const publishCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    console.log("🔍 Publishing course:", slug);
    console.log("📋 Current status:", course.status);
    console.log("📋 Thumbnail:", course.thumbnail);
    console.log("📋 Sections:", course.sections?.length);

    // Validation
    if (
      !course.thumbnail ||
      course.thumbnail === "" ||
      course.thumbnail.includes("placeholder") ||
      course.thumbnail.includes("via.placeholder")
    ) {
      console.log("❌ Thumbnail validation failed:", course.thumbnail);
      return res.status(400).json({ error: "Please upload a thumbnail" });
    }

    if (course.sections.length === 0) {
      console.log("❌ No sections");
      return res.status(400).json({ error: "Add at least one section" });
    }

    const hasLessons = course.sections.some(
      (s) => s.lessons && s.lessons.length > 0
    );
    if (!hasLessons) {
      console.log("❌ No lessons");
      return res.status(400).json({ error: "Add at least one lesson" });
    }

    const allLessonsHaveVideos = course.sections.every((section) =>
      section.lessons.every((lesson) => lesson.videoId && lesson.videoUrl)
    );

    if (!allLessonsHaveVideos) {
      console.log("❌ Some lessons missing videos");
      return res
        .status(400)
        .json({ error: "All lessons must have videos uploaded" });
    }

    console.log("✅ All validations passed");

    // CRITICAL FIX: Check if this is a NEW course or EDIT
    const isNewCourse = course.status === "draft";
    const isEdit = course.status === "published";

    if (isNewCourse) {
      // NEW COURSE: Set to pending for admin approval
      course.status = "pending";
      // Do NOT set publishedAt yet - will be set when admin approves
    } else if (isEdit) {
      // EDITED COURSE: Set to pending for re-approval
      course.status = "pending";
      // KEEP the original publishedAt date - don't change it
    } else {
      // Course was already pending, just keep it pending
      course.status = "pending";
    }

    await course.save();

    const message = isNewCourse
      ? "Course submitted for admin approval"
      : "Changes submitted for admin approval";

    res.json({
      success: true,
      message,
      requiresApproval: true, // Let frontend know
    });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(500).json({ error: "Failed to publish course" });
  }
};

/**
 * Get analytics for all instructor's courses
 */
const getAllCoursesAnalytics = async (req, res) => {
  try {
    const instructorId = req.userId;

    const courses = await Course.find({ instructor: instructorId }).lean();
    const courseIds = courses.map((c) => c._id);

    const Purchase = require("../models/Purchase.DEPRECATED");
    const Review = require("../models/Review");

    const purchases = await Purchase.find({
      course: { $in: courseIds },
      status: "active",
    }).populate("course", "price title");

    // Calculate overall stats
    const totalRevenue = purchases.reduce(
      (sum, p) => sum + (p.course?.price?.usd || 0),
      0
    );
    const totalStudents = new Set(purchases.map((p) => p.user.toString())).size;
    const completedPurchases = purchases.filter((p) => p.isCompleted).length;
    const completionRate =
      purchases.length > 0
        ? Math.round((completedPurchases / purchases.length) * 100)
        : 0;

    // Get all reviews
    const reviews = await Review.find({ course: { $in: courseIds } }).lean();
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Revenue by month (last 3 months)
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRevenue = purchases
      .filter((p) => new Date(p.createdAt) >= thisMonth)
      .reduce((sum, p) => sum + (p.course?.price?.usd || 0), 0);

    const lastMonthRevenue = purchases
      .filter(
        (p) =>
          new Date(p.createdAt) >= lastMonth &&
          new Date(p.createdAt) < thisMonth
      )
      .reduce((sum, p) => sum + (p.course?.price?.usd || 0), 0);

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    // Student progress distribution
    const progressRanges = [
      { range: "0-25%", count: 0 },
      { range: "26-50%", count: 0 },
      { range: "51-75%", count: 0 },
      { range: "76-99%", count: 0 },
      { range: "100%", count: 0 },
    ];

    purchases.forEach((p) => {
      const progress = p.progress || 0;
      if (progress <= 25) progressRanges[0].count++;
      else if (progress <= 50) progressRanges[1].count++;
      else if (progress <= 75) progressRanges[2].count++;
      else if (progress < 100) progressRanges[3].count++;
      else progressRanges[4].count++;
    });

    progressRanges.forEach((range) => {
      range.percentage =
        purchases.length > 0
          ? ((range.count / purchases.length) * 100).toFixed(1)
          : 0;
    });

    // Reviews breakdown
    const reviewsBreakdown = {
      total: reviews.length,
      fiveStar: reviews.filter((r) => r.rating === 5).length,
      fourStar: reviews.filter((r) => r.rating === 4).length,
      threeStar: reviews.filter((r) => r.rating === 3).length,
      twoStar: reviews.filter((r) => r.rating === 2).length,
      oneStar: reviews.filter((r) => r.rating === 1).length,
      averageRating: Math.round(avgRating * 10) / 10,
    };

    res.json({
      success: true,
      analytics: {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalStudents,
          completionRate,
          averageRating: Math.round(avgRating * 10) / 10,
        },
        revenue: {
          thisMonth: Math.round(thisMonthRevenue),
          lastMonth: Math.round(lastMonthRevenue),
          growth: revenueGrowth,
          averagePerStudent:
            totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0,
          totalEarnings: Math.round(totalRevenue),
        },
        studentProgress: progressRanges,
        reviews: reviewsBreakdown,
        engagement: {
          averageWatchTime:
            purchases.length > 0
              ? Math.round(
                  purchases.reduce(
                    (sum, p) => sum + (p.totalWatchTime || 0),
                    0
                  ) /
                    purchases.length /
                    60
                )
              : 0,
          returningStudents: 0, // Would need session tracking
        },
      },
    });
  } catch (error) {
    console.error("Get all courses analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
};

/**
 * Get analytics for specific course
 */
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.userId;

    console.log("🔍 Analytics request - courseId/slug:", courseId);
    console.log("🔍 Instructor ID:", instructorId);

    // Find course by slug or _id
    let course;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      course = await Course.findOne({
        _id: courseId,
        instructor: instructorId,
      }).lean();
    } else {
      // It's a slug
      course = await Course.findOne({
        slug: courseId,
        instructor: instructorId,
      }).lean();
    }

    console.log("🔍 Course found:", course ? "YES" : "NO");

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const Purchase = require("../models/Purchase.DEPRECATED");
    const Review = require("../models/Review");

    const purchases = await Purchase.find({
      course: course._id,
      status: "active",
    }).lean();

    console.log("🔍 Purchases found:", purchases.length);

    const totalRevenue = purchases.reduce(
      (sum, p) => sum + (course.price?.usd || 0),
      0
    );
    const totalStudents = purchases.length;
    const completedPurchases = purchases.filter((p) => p.isCompleted).length;
    const completionRate =
      totalStudents > 0
        ? Math.round((completedPurchases / totalStudents) * 100)
        : 0;

    const reviews = await Review.find({ course: course._id }).lean();
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Revenue by month
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRevenue = purchases
      .filter((p) => new Date(p.createdAt) >= thisMonth)
      .reduce((sum) => sum + (course.price?.usd || 0), 0);

    const lastMonthRevenue = purchases
      .filter(
        (p) =>
          new Date(p.createdAt) >= lastMonth &&
          new Date(p.createdAt) < thisMonth
      )
      .reduce((sum) => sum + (course.price?.usd || 0), 0);

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    // Student progress distribution
    const progressRanges = [
      { range: "0-25%", count: 0 },
      { range: "26-50%", count: 0 },
      { range: "51-75%", count: 0 },
      { range: "76-99%", count: 0 },
      { range: "100%", count: 0 },
    ];

    purchases.forEach((p) => {
      const progress = p.progress || 0;
      if (progress <= 25) progressRanges[0].count++;
      else if (progress <= 50) progressRanges[1].count++;
      else if (progress <= 75) progressRanges[2].count++;
      else if (progress < 100) progressRanges[3].count++;
      else progressRanges[4].count++;
    });

    progressRanges.forEach((range) => {
      range.percentage =
        totalStudents > 0
          ? ((range.count / totalStudents) * 100).toFixed(1)
          : 0;
    });

    // Reviews breakdown
    const reviewsBreakdown = {
      total: reviews.length,
      fiveStar: reviews.filter((r) => r.rating === 5).length,
      fourStar: reviews.filter((r) => r.rating === 4).length,
      threeStar: reviews.filter((r) => r.rating === 3).length,
      twoStar: reviews.filter((r) => r.rating === 2).length,
      oneStar: reviews.filter((r) => r.rating === 1).length,
      averageRating: Math.round(avgRating * 10) / 10,
    };

    console.log("✅ Analytics calculated successfully");

    res.json({
      success: true,
      course: {
        id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
      },
      analytics: {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalStudents,
          completionRate,
          averageRating: Math.round(avgRating * 10) / 10,
        },
        revenue: {
          thisMonth: Math.round(thisMonthRevenue),
          lastMonth: Math.round(lastMonthRevenue),
          growth: revenueGrowth,
          averagePerStudent:
            totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0,
          totalEarnings: Math.round(totalRevenue),
        },
        studentProgress: progressRanges,
        reviews: reviewsBreakdown,
        engagement: {
          averageWatchTime:
            totalStudents > 0
              ? Math.round(
                  purchases.reduce(
                    (sum, p) => sum + (p.totalWatchTime || 0),
                    0
                  ) /
                    totalStudents /
                    60
                )
              : 0,
          returningStudents: 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get course analytics error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Failed to get analytics" });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  getBySlug: getCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  getCoursesByInstructor,
  getInstructorCoursesWithStats,
  publishCourse,
  getAllCoursesAnalytics,
  getCourseAnalytics,
};
