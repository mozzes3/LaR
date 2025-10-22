// backend/controllers/adminProfessionalCertificationController.js
const ProfessionalCertification = require("../models/ProfessionalCertification");
const CertificationAttempt = require("../models/CertificationAttempt");
const ProfessionalCertificate = require("../models/ProfessionalCertificate");

/**
 * Get all professional certifications (admin)
 */
const getAllCertifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;

    const query = {};
    const hasFilters = !!(status || category || search);

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const certifications = await ProfessionalCertification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // ✅ Add lean()

    // ✅ OPTIMIZATION
    let total;
    if (page === 1 && !hasFilters) {
      total = await ProfessionalCertification.estimatedDocumentCount();
      console.log("⚡ Using estimatedDocumentCount() for admin certifications");
    } else {
      total = await ProfessionalCertification.countDocuments(query);
    }

    res.json({
      success: true,
      certifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get certifications error:", error);
    res.status(500).json({ error: "Failed to fetch certifications" });
  }
};

/**
 * Get single certification with full details (admin)
 */
const getCertificationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const certification = await ProfessionalCertification.findById(id).lean();

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    // Get statistics
    const stats = await CertificationAttempt.aggregate([
      {
        $match: {
          certification: certification._id,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          totalPassed: {
            $sum: { $cond: ["$passed", 1, 0] },
          },
          averageScore: { $avg: "$score" },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" },
        },
      },
    ]);

    certification.statistics = stats[0] || {
      totalAttempts: 0,
      totalPassed: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
    };

    res.json({ success: true, certification });
  } catch (error) {
    console.error("Get certification details error:", error);
    res.status(500).json({ error: "Failed to fetch certification" });
  }
};

/**
 * Create new professional certification
 */
const createCertification = async (req, res) => {
  try {
    const certificationData = req.body;

    // Generate slug from title
    if (!certificationData.slug) {
      certificationData.slug = certificationData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const certification = await ProfessionalCertification.create(
      certificationData
    );

    res.status(201).json({
      success: true,
      message: "Certification created successfully",
      certification,
    });
  } catch (error) {
    console.error("Create certification error:", error);

    if (error.code === 11000) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    res.status(500).json({ error: "Failed to create certification" });
  }
};

/**
 * Update professional certification
 */
const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const certification = await ProfessionalCertification.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    res.json({
      success: true,
      message: "Certification updated successfully",
      certification,
    });
  } catch (error) {
    console.error("Update certification error:", error);
    res.status(500).json({ error: "Failed to update certification" });
  }
};

/**
 * Delete professional certification
 */
const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any attempts
    const attemptCount = await CertificationAttempt.countDocuments({
      certification: id,
    });

    if (attemptCount > 0) {
      return res.status(400).json({
        error: "Cannot delete certification with existing attempts",
        attemptCount,
      });
    }

    const certification = await ProfessionalCertification.findByIdAndDelete(id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    res.json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Delete certification error:", error);
    res.status(500).json({ error: "Failed to delete certification" });
  }
};

/**
 * Update certification status (publish/archive)
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updates = { status };
    if (status === "published" && !certification.publishedAt) {
      updates.publishedAt = new Date();
    }

    const certification = await ProfessionalCertification.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    res.json({
      success: true,
      message: `Certification ${status} successfully`,
      certification,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

/**
 * Get all attempts for a certification
 */
const getCertificationAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query = { certification: id };
    if (status) query.status = status;

    const attempts = await CertificationAttempt.find(query)
      .populate("user", "username displayName avatar walletAddress")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await CertificationAttempt.countDocuments(query);

    res.json({
      success: true,
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};

/**
 * Get all professional certificates (admin)
 */
const getAllCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { certificateNumber: { $regex: search, $options: "i" } },
        { studentName: { $regex: search, $options: "i" } },
        { certificationTitle: { $regex: search, $options: "i" } },
      ];
    }

    const certificates = await ProfessionalCertificate.find(query)
      .populate("userId", "username displayName avatar walletAddress")
      .populate("certificationId", "title category level")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ProfessionalCertificate.countDocuments(query);

    res.json({
      success: true,
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
};

/**
 * Revoke a certificate (emergency)
 */
const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Revocation reason required" });
    }

    const certificate = await ProfessionalCertificate.findById(id);

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    if (certificate.status === "revoked") {
      return res.status(400).json({ error: "Certificate already revoked" });
    }

    certificate.status = "revoked";
    certificate.isValid = false;
    certificate.revokedAt = new Date();
    certificate.revokedReason = reason;
    await certificate.save();

    // TODO: Also revoke on blockchain if needed

    res.json({
      success: true,
      message: "Certificate revoked successfully",
      certificate,
    });
  } catch (error) {
    console.error("Revoke certificate error:", error);
    res.status(500).json({ error: "Failed to revoke certificate" });
  }
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCertifications,
      publishedCertifications,
      totalAttempts,
      totalCertificates,
      paidCertificates,
      revenue,
    ] = await Promise.all([
      ProfessionalCertification.countDocuments(),
      ProfessionalCertification.countDocuments({ status: "published" }),
      CertificationAttempt.countDocuments({ status: "completed" }),
      ProfessionalCertificate.countDocuments(),
      ProfessionalCertificate.countDocuments({ paid: true }),
      ProfessionalCertificate.aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, total: { $sum: "$paymentAmount" } } },
      ]),
    ]);

    // Get top certifications
    const topCertifications = await CertificationAttempt.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$certification",
          attempts: { $sum: 1 },
          passed: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
        },
      },
      { $sort: { attempts: -1 } },
      { $limit: 5 },
    ]);

    // Populate certification details
    await ProfessionalCertification.populate(topCertifications, {
      path: "_id",
      select: "title thumbnail category",
    });

    res.json({
      success: true,
      stats: {
        totalCertifications,
        publishedCertifications,
        totalAttempts,
        totalCertificates,
        paidCertificates,
        revenue: revenue[0]?.total || 0,
        topCertifications: topCertifications.map((t) => ({
          certification: t._id,
          attempts: t.attempts,
          passed: t.passed,
          passRate: Math.round((t.passed / t.attempts) * 100),
          averageScore: Math.round(t.averageScore),
        })),
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

module.exports = {
  getAllCertifications,
  getCertificationDetails,
  createCertification,
  updateCertification,
  deleteCertification,
  updateStatus,
  getCertificationAttempts,
  getAllCertificates,
  revokeCertificate,
  getDashboardStats,
};
