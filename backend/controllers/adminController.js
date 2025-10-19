const User = require("../models/User");
const Role = require("../models/Role");
const UserPermission = require("../models/UserPermission");
const Course = require("../models/Course");
const Review = require("../models/Review");
const Purchase = require("../models/Purchase");
const InstructorApplication = require("../models/InstructorApplication");
const { getUserPermissions } = require("../middleware/permission");

// ===== ROLE MANAGEMENT =====

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ priority: -1, name: 1 });
    res.json({ success: true, roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ error: "Role already exists" });
    }

    const role = await Role.create({
      name,
      displayName,
      description,
      permissions,
      isSystemRole: false,
    });

    res.status(201).json({ success: true, role });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ error: "Failed to create role" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { displayName, description, permissions, isActive } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: "Cannot modify system role" });
    }

    role.displayName = displayName || role.displayName;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    res.json({ success: true, role });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: "Cannot delete system role" });
    }

    const usersWithRole = await User.countDocuments({ roleRef: roleId });
    if (usersWithRole > 0) {
      return res.status(400).json({
        error: `Cannot delete role. ${usersWithRole} user(s) currently have this role`,
      });
    }

    await role.deleteOne();

    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
};

// ===== USER MANAGEMENT =====

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isInstructor,
      isBanned,
      isActive,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { walletAddress: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (isInstructor !== undefined)
      query.isInstructor = isInstructor === "true";
    if (isBanned !== undefined) query.isBanned = isBanned === "true";
    if (isActive !== undefined) query.isActive = isActive === "true";

    console.log("🔍 Admin getAllUsers query:", query);
    console.log("📄 Pagination:", { page, limit });

    // First, check total users in database
    const totalUsersInDB = await User.countDocuments({});
    console.log("👥 Total users in database:", totalUsersInDB);

    const users = await User.find(query)
      .select("-__v")
      .populate("roleRef", "name displayName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    console.log("✅ Found users:", users.length);
    console.log("📊 Total matching query:", total);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      username,
      displayName,
      email,
      bio,
      instructorBio,
      expertise,
      socialLinks,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if username is being changed and if it's unique
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      user.username = username;
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (instructorBio !== undefined) user.instructorBio = instructorBio;
    if (expertise !== undefined) user.expertise = expertise;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;

    await user.save();

    res.json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user details error:", error);
    res.status(500).json({ error: "Failed to update user details" });
  }
};
const toggleInstructorStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isInstructor } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isInstructor = isInstructor;

    // If making instructor, also set verified
    if (isInstructor) {
      user.instructorVerified = true;
    }

    await user.save();

    res.json({
      success: true,
      message: `User ${isInstructor ? "granted" : "removed"} instructor status`,
      user,
    });
  } catch (error) {
    console.error("Toggle instructor status error:", error);
    res.status(500).json({ error: "Failed to update instructor status" });
  }
};
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("roleRef")
      .populate("customPermissions");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const permissions = await getUserPermissions(userId);

    res.json({
      success: true,
      user,
      permissions: permissions.permissions,
      isSuperAdmin: permissions.isSuperAdmin,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

const assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    user.roleRef = roleId;
    await user.save();

    res.json({ success: true, message: "Role assigned successfully", user });
  } catch (error) {
    console.error("Assign role error:", error);
    res.status(500).json({ error: "Failed to assign role" });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { customPermissions, deniedPermissions, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let userPerm = await UserPermission.findOne({ user: userId });

    if (!userPerm) {
      userPerm = await UserPermission.create({
        user: userId,
        customPermissions: customPermissions || [],
        deniedPermissions: deniedPermissions || [],
        grantedBy: req.userId,
        notes,
      });
      user.customPermissions = userPerm._id;
      await user.save();
    } else {
      userPerm.customPermissions =
        customPermissions || userPerm.customPermissions;
      userPerm.deniedPermissions =
        deniedPermissions || userPerm.deniedPermissions;
      userPerm.notes = notes || userPerm.notes;
      userPerm.grantedBy = req.userId;
      await userPerm.save();
    }

    res.json({
      success: true,
      message: "Permissions updated successfully",
      permissions: userPerm,
    });
  } catch (error) {
    console.error("Update permissions error:", error);
    res.status(500).json({ error: "Failed to update permissions" });
  }
};

const toggleUserBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isSuperAdmin) {
      return res.status(403).json({ error: "Cannot ban super admin" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`,
      user,
    });
  } catch (error) {
    console.error("Toggle ban error:", error);
    res.status(500).json({ error: "Failed to toggle ban status" });
  }
};

const makeSuperAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isSuperAdmin = true;
    user.role = "admin";
    await user.save();

    res.json({
      success: true,
      message: "User promoted to super admin",
      user,
    });
  } catch (error) {
    console.error("Make super admin error:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
};

// ===== COURSE MANAGEMENT =====

const getAllCoursesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .populate("instructor", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

const updateCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const oldStatus = course.status;
    course.status = status;

    // Set publishedAt ONLY when approving for the first time
    if (status === "published" && !course.publishedAt) {
      course.publishedAt = new Date();
    }

    // If re-approving after edit, KEEP the original publishedAt date

    await course.save();

    res.json({
      success: true,
      message: `Course ${status}`,
      course,
    });
  } catch (error) {
    console.error("Update course status error:", error);
    res.status(500).json({ error: "Failed to update course status" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const purchaseCount = await Purchase.countDocuments({ course: courseId });
    if (purchaseCount > 0) {
      return res.status(400).json({
        error: `Cannot delete course. ${purchaseCount} purchase(s) exist for this course`,
      });
    }

    await course.deleteOne();

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

// ===== REVIEW MANAGEMENT =====

const getAllReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, courseId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (courseId) query.course = courseId;

    const reviews = await Review.find(query)
      .populate("user", "username avatar")
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, flagReason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const oldStatus = review.status;
    review.status = status;

    if (status === "flagged" && flagReason) {
      review.flagReason = flagReason;
    }

    await review.save();

    const course = await Course.findById(review.course);

    if (course) {
      // Add rating when publishing
      if (status === "published" && oldStatus !== "published") {
        course.updateRating(review.rating);
        await course.save();
      }

      // Remove rating when unpublishing
      if (oldStatus === "published" && status !== "published") {
        course.updateRating(null, review.rating);
        await course.save();
      }
    }

    res.json({
      success: true,
      message: `Review ${status}`,
      review,
    });
  } catch (error) {
    console.error("Update review status error:", error);
    res.status(500).json({ error: "Failed to update review status" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await review.deleteOne();

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// ===== INSTRUCTOR APPLICATIONS =====

const getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = status ? { status } : {};

    const applications = await InstructorApplication.find(query)
      .populate("user", "username walletAddress avatar email")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InstructorApplication.countDocuments(query);

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const application = await InstructorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = "approved";
    application.reviewedBy = req.userId;
    application.reviewedAt = new Date();
    application.adminNotes = adminNotes;
    await application.save();

    // Update user to instructor
    await User.findByIdAndUpdate(application.user, {
      isInstructor: true,
      instructorVerified: true,
      instructorBio: application.bio,
      expertise: application.expertise,
      socialLinks: {
        twitter: application.twitter,
        linkedin: application.linkedin,
        website: application.website,
      },
    });

    res.json({ success: true, message: "Application approved" });
  } catch (error) {
    console.error("Approve application error:", error);
    res.status(500).json({ error: "Failed to approve application" });
  }
};

const pauseApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await InstructorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = "under-review";
    application.followUpRequired = true;
    application.followUpMessage = reason;
    application.reviewedBy = req.userId;
    await application.save();

    res.json({ success: true, message: "Application paused for review" });
  } catch (error) {
    console.error("Pause application error:", error);
    res.status(500).json({ error: "Failed to pause application" });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const application = await InstructorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = "rejected";
    application.reviewedBy = req.userId;
    application.reviewedAt = new Date();
    application.rejectionReason = rejectionReason;
    application.adminNotes = adminNotes;
    await application.save();

    res.json({ success: true, message: "Application rejected" });
  } catch (error) {
    console.error("Reject application error:", error);
    res.status(500).json({ error: "Failed to reject application" });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await InstructorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    await application.deleteOne();

    res.json({ success: true, message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
};

// ===== PURCHASES =====

const getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;

    const purchases = await Purchase.find(query)
      .populate("user", "username email walletAddress")
      .populate("course", "title slug thumbnail price")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(query);

    res.json({
      success: true,
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
};

// ===== DASHBOARD STATS =====

const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalPurchases,
      totalRevenue,
      pendingApplications,
      pendingCourses, // ADD THIS
      pendingReviews,
      flaggedReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Purchase.countDocuments(),
      Purchase.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      InstructorApplication.countDocuments({ status: "pending" }),
      Course.countDocuments({ status: "pending" }), // ADD THIS
      Review.countDocuments({ status: "pending" }),
      Review.countDocuments({ status: "flagged" }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalPurchases,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingApplications,
        pendingCourses, // ADD THIS
        pendingReviews,
        flaggedReviews,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
module.exports = {
  // Roles
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  // Users
  getAllUsers,
  getUserDetails,
  assignRole,
  updateUserPermissions,
  toggleUserBan,
  makeSuperAdmin,
  // Courses
  getAllCoursesAdmin,
  updateCourseStatus,
  deleteCourse,
  // Reviews
  getAllReviewsAdmin,
  updateReviewStatus,
  deleteReview,
  // Applications
  getAllApplications,
  approveApplication,
  pauseApplication,
  rejectApplication,
  deleteApplication,
  // Purchases
  getAllPurchases,
  // Dashboard
  getAdminDashboardStats,
  updateUserDetails,
  toggleInstructorStatus,
};
