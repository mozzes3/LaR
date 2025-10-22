// backend/controllers/certificateController.js
const { generateCertificate } = require("../services/certificateService");
const crypto = require("crypto");
const Certificate = require("../models/Certificate");
const ProfessionalCertificate = require("../models/ProfessionalCertificate");
const CertificationAttempt = require("../models/CertificationAttempt");
// Get certificate image token
const getCertificateImageToken = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🎫 Generating token for certificate:", id);

    const certificate = await Certificate.findById(id);

    if (!certificate) {
      console.log("❌ Certificate not found");
      return res.status(404).json({ error: "Certificate not found" });
    }

    console.log("👤 Certificate owner:", certificate.userId.toString());
    console.log("🔑 Request user:", req.userId);

    if (certificate.userId.toString() !== req.userId.toString()) {
      console.log("❌ Not authorized");
      return res
        .status(403)
        .json({ error: "Not authorized to view this certificate" });
    }

    const expires = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const filename = certificate.templateImage.split("/").pop();
    const tokenPath = `/${filename}`;

    const tokenKey = process.env.BUNNY_TOKEN_KEY_CERTIFICATES;

    if (!tokenKey) {
      console.error("❌ BUNNY_TOKEN_KEY_CERTIFICATES not set");
      return res
        .status(500)
        .json({ error: "Certificate access not configured" });
    }

    const hashString = `${tokenKey}${tokenPath}${expires}`;
    const token = crypto.createHash("sha256").update(hashString).digest("hex");

    const signedUrl = `${certificate.templateImage}?token=${token}&expires=${expires}`;

    res.json({
      success: true,
      signedUrl,
      expires,
    });
  } catch (error) {
    console.error("❌ Generate certificate token error:", error);
    res.status(500).json({ error: "Failed to generate access token" });
  }
};

// Get user's certificates
const getUserCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.userId })
      .populate("courseId", "title thumbnail slug")
      .sort({ completedDate: -1 });

    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single certificate
const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("courseId", "title thumbnail slug")
      .populate("userId", "username displayName avatar");

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Get certificate error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Verify certificate by number (PUBLIC) - Updated for NFT system
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certificateNumber,
    })
      .populate("courseId", "title")
      .populate("userId", "username displayName");

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        error: "Certificate not found",
      });
    }

    // Return certificate data with NFT information
    const responseData = {
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        instructor: certificate.instructor,
        completedDate: certificate.completedDate,
        totalHours: certificate.totalHours,
        totalLessons: certificate.totalLessons,
        skills: certificate.skills,
        templateImage: certificate.templateImage,
        verificationUrl: certificate.verificationUrl,

        // NFT data
        nftMinted: certificate.nftMinted || false,
        nftTokenId: certificate.nftTokenId,
        nftContractAddress: certificate.nftContractAddress,
        nftMetadataURI: certificate.nftMetadataURI,
        nftTransactionHash: certificate.nftTransactionHash,
        nftMintedAt: certificate.nftMintedAt,

        // User info (populated)
        student: {
          username: certificate.userId?.username,
          displayName: certificate.userId?.displayName,
        },
        course: {
          title: certificate.courseId?.title,
        },
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Generate certificate manually (for testing)
const generateCertificateManual = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const certificate = await generateCertificate(req.userId, courseId);

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Generate certificate error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all certificates (course + professional) in one call
 * Returns same structure as separate endpoints
 */
// Get all certificates in one call
const getAllMyCertificates = async (req, res) => {
  try {
    const userId = req.userId;

    // Course certificates - EXACT SAME query as getUserCertificates
    const courseCertificates = await Certificate.find({ userId: userId })
      .populate("courseId", "title thumbnail slug")
      .sort({ completedDate: -1 })
      .lean();

    // Professional certificates - EXACT SAME query as the original endpoint
    const professionalCertificates = await ProfessionalCertificate.find({
      userId: userId,
    })
      .populate("certificationId", "title slug category thumbnail")
      .sort({ issuedDate: -1 })
      .lean();

    // Attempts - EXACT SAME query as the original endpoint
    const attempts = await CertificationAttempt.find({ user: userId })
      .populate("certification", "title slug category thumbnail")
      .sort({ completedAt: -1 })
      .lean();

    // Return in EXACT SAME format as original separate endpoints
    res.json({
      success: true,
      courseCertificates: {
        certificates: courseCertificates,
      },
      professionalCertificates: {
        certificates: professionalCertificates,
      },
      attempts: {
        attempts: attempts,
      },
    });
  } catch (error) {
    console.error("Get all certificates error:", error);
    res.status(500).json({ error: "Failed to get certificates" });
  }
};
module.exports = {
  getCertificateImageToken,
  getUserCertificates,
  getCertificate,
  verifyCertificate,
  generateCertificateManual,
  getAllMyCertificates,
};
