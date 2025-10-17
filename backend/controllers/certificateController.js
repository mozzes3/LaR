const { generateCertificate } = require("../services/certificateService");
const Certificate = require("../models/Certificate");

// Get user's certificates
exports.getUserCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id })
      .populate("courseId")
      .sort({ completedDate: -1 });

    res.json({ certificates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single certificate
exports.getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("courseId")
      .populate("userId");

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify certificate by number
exports.verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certificateNumber,
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json({ valid: true, certificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate certificate (called when user completes course)
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.body;
    const certificate = await generateCertificate(req.user.id, courseId);

    res.json({ certificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
