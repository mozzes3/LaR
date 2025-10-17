const Course = require("../models/Course");
const User = require("../models/User");
const Purchase = require("../models/Purchase");
const Review = require("../models/Review");
const videoService = require("../services/videoService");

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
const getCourses = async (req, res) => {
  try {
    const { category, level, search, sort, page = 1, limit = 12 } = req.query;

    const filter = { status: "published" };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = {};
    switch (sort) {
      case "popular":
        sortOption = { enrollmentCount: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const courses = await Course.find(filter)
      .populate("instructor", "username avatar averageRating totalStudents")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Course.countDocuments(filter);

    res.json({
      courses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
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

    const course = await Course.findOne({ slug }).populate(
      "instructor",
      "username avatar bio instructorBio expertise averageRating totalStudents instructorVerified socialLinks"
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

    const courseData = course.toObject();

    // Calculate total lessons correctly
    const totalLessons = courseData.sections.reduce((total, section) => {
      return total + (section.lessons?.length || 0);
    }, 0);

    console.log(`📊 Total lessons calculated: ${totalLessons}`);

    // Calculate total duration
    const totalDuration = courseData.sections.reduce((total, section) => {
      const sectionDuration = section.lessons.reduce((sum, lesson) => {
        return sum + (lesson.duration || 0);
      }, 0);
      return total + sectionDuration;
    }, 0);

    console.log(`⏱️ Total duration calculated: ${totalDuration}s`);

    // Hide lesson videos if not purchased (except previews)
    const isInstructor =
      req.userId?.toString() === course.instructor._id.toString();

    if (!hasPurchased && !isInstructor) {
      courseData.sections = courseData.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: lesson.isPreview ? lesson.videoUrl : null,
          videoId: lesson.isPreview ? lesson.videoId : null, // Also hide videoId
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
    console.log(`    - Total Lessons: ${totalLessons}`);
    console.log(`    - Total Duration: ${totalDuration}s`);
    console.log(`    - Has Purchased: ${hasPurchased}`);
    console.log(`    - Is Instructor: ${isInstructor}`);
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
      .populate("instructor", "username avatar instructorVerified")
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
    console.log("📋 Thumbnail:", course.thumbnail);
    console.log("📋 Sections:", course.sections?.length);

    // Validation - check for empty, placeholder, or invalid URLs
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

    course.status = "published";
    course.publishedAt = new Date();
    await course.save();

    res.json({ success: true, message: "Course published successfully" });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(500).json({ error: "Failed to publish course" });
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
};
