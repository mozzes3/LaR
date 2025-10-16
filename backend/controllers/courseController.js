const Course = require("../models/Course");
const User = require("../models/User");
const Purchase = require("../models/Purchase");
const videoService = require("../services/videoService");

// Create new course
const createCourse = async (req, res) => {
  try {
    const { title, subtitle, description, category, level, price } = req.body;

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
      price: { usd: price.usd || 0, fdr: price.fdr || 0 },
      instructor: req.userId,
      status: "draft",
      thumbnail: "https://via.placeholder.com/400x225",
    });

    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalCoursesCreated: 1 },
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Create course error:", error);
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
const getCourse = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ slug }).populate(
      "instructor",
      "username avatar bio instructorBio expertise averageRating totalStudents"
    );

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    let hasPurchased = false;
    if (req.userId) {
      const purchase = await Purchase.findOne({
        user: req.userId,
        course: course._id,
        status: "active",
      });
      hasPurchased = !!purchase;
    }

    if (course.status !== "published") {
      if (
        !req.userId ||
        req.userId.toString() !== course.instructor._id.toString()
      ) {
        return res.status(403).json({ error: "Course not available" });
      }
    }

    const courseData = course.toObject();
    if (
      !hasPurchased &&
      req.userId?.toString() !== course.instructor._id.toString()
    ) {
      courseData.sections = courseData.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: lesson.isPreview ? lesson.videoUrl : null,
        })),
      }));
    }

    res.json({
      course: courseData,
      hasPurchased,
      isInstructor: req.userId?.toString() === course.instructor._id.toString(),
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.instructor.toString() !== req.userId.toString()) {
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
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    });

    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    console.error("Update course error:", error);
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

// Publish course
const publishCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Validation
    if (!course.thumbnail || course.thumbnail.includes("placeholder")) {
      return res.status(400).json({ error: "Please upload a thumbnail" });
    }
    if (course.sections.length === 0) {
      return res.status(400).json({ error: "Add at least one section" });
    }
    if (course.totalLessons === 0) {
      return res.status(400).json({ error: "Add at least one lesson" });
    }

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
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  publishCourse,
};
