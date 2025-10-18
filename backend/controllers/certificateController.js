const { generateCertificate } = require("../services/certificateService");
const Certificate = require("../models/Certificate");

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

    // Verify ownership
    if (certificate.userId.toString() !== req.userId.toString()) {
      console.log("❌ Not authorized");
      return res
        .status(403)
        .json({ error: "Not authorized to view this certificate" });
    }

    // Generate Bunny token for the certificate image
    const crypto = require("crypto");
    const expires = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours

    // Extract filename from URL
    const filename = certificate.templateImage.split("/").pop();

    // IMPORTANT: The token path should match what Bunny expects
    // If your CDN URL is: https://lizard-academy-certificates.b-cdn.net/FA-2025-E5D7E7.png
    // Then token path should be: /FA-2025-E5D7E7.png
    const tokenPath = `/${filename}`;

    console.log("📄 Filename:", filename);
    console.log("🔗 Token path:", tokenPath);
    console.log("⏰ Expires:", expires);

    // Generate token hash
    const tokenKey = process.env.BUNNY_TOKEN_KEY_CERTIFICATES;

    if (!tokenKey) {
      console.error("❌ BUNNY_TOKEN_KEY_CERTIFICATES not set in .env");
      return res
        .status(500)
        .json({ error: "Certificate access not configured" });
    }

    console.log(
      "🔑 Token key (first 10 chars):",
      tokenKey.substring(0, 10) + "..."
    );

    // Bunny.net token format: sha256(security_key + path + expires)
    const hashString = `${tokenKey}${tokenPath}${expires}`;
    const token = crypto.createHash("sha256").update(hashString).digest("hex");

    console.log("🔐 Hash string format: [key][path][expires]");
    console.log("🔐 Generated token:", token.substring(0, 20) + "...");

    // Generate signed URL - parameter names must match Bunny's format
    const signedUrl = `${certificate.templateImage}?token=${token}&expires=${expires}`;

    console.log("🔗 Full signed URL:", signedUrl);
    console.log("✅ Signed URL generated");

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

// Verify certificate by number (PUBLIC - no auth needed)
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
  getUserCertificates,
  getCertificate,
  verifyCertificate,
  generateCertificateManual,
  getCertificateImageToken,
};
