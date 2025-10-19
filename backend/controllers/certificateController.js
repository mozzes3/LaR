// backend/controllers/certificateController.js
const { generateCertificate } = require("../services/certificateService");
const Certificate = require("../models/Certificate");
const crypto = require("crypto");

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

// Verify certificate by number (PUBLIC)
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

    res.json({
      valid: true,
      certificate,
    });
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

module.exports = {
  getCertificateImageToken,
  getUserCertificates,
  getCertificate,
  verifyCertificate,
  generateCertificateManual,
};
