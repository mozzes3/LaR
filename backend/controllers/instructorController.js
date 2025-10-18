const InstructorApplication = require("../models/InstructorApplication");
const User = require("../models/User");

// Submit instructor application
const applyInstructor = async (req, res) => {
  try {
    const {
      fullName,
      email,
      expertise,
      yearsOfExperience,
      bio,
      portfolio,
      twitter,
      linkedin,
      website,
      discord,
      hasTeachingExperience,
      teachingExperienceDetails,
      proposedCourses,
      motivation,
    } = req.body;

    console.log("📥 Instructor application received:", {
      fullName,
      email,
      expertise,
      yearsOfExperience,
    });

    // Validation
    if (!fullName || !email || !bio) {
      return res.status(400).json({
        error: "Missing required fields: fullName, email, and bio are required",
      });
    }

    if (!expertise || expertise.length === 0) {
      return res.status(400).json({
        error: "Please provide at least one area of expertise",
      });
    }

    // Check if already applied
    const existing = await InstructorApplication.findOne({ user: req.userId });
    if (existing) {
      return res.status(400).json({
        error: "You have already submitted an application",
        status: existing.status,
      });
    }

    // Create application
    const application = await InstructorApplication.create({
      user: req.userId,
      fullName,
      email,
      expertise: Array.isArray(expertise) ? expertise : [expertise],
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      bio,
      portfolio: portfolio || "",
      twitter: twitter || "",
      linkedin: linkedin || "",
      website: website || "",
      discord: discord || "",
      hasTeachingExperience: hasTeachingExperience || false,
      teachingExperienceDetails: teachingExperienceDetails || "",
      proposedCourses: proposedCourses || [],
      motivation: motivation || "",
      status: "pending",
    });

    console.log("✅ Application created:", application._id);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: application._id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Apply instructor error:", error);
    res.status(500).json({
      error: "Failed to submit application",
      details: error.message,
    });
  }
};
// Get user's application status
const getMyApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findOne({
      user: req.userId,
    });

    if (!application) {
      return res.status(404).json({ error: "No application found" });
    }

    res.json({ application });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
};

// Get all applications (admin only)
const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await InstructorApplication.find(filter)
      .populate("user", "username walletAddress avatar")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Approve application (admin only)
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

// Reject application (admin only)
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

module.exports = {
  applyInstructor,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
};
