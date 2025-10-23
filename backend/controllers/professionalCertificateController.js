// backend/controllers/professionalCertificateController.js
const ProfessionalCertificate = require("../models/ProfessionalCertificate");
const CertificationAttempt = require("../models/CertificationAttempt");
const ProfessionalCertification = require("../models/ProfessionalCertification");
const User = require("../models/User");
const crypto = require("crypto");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

/**
 * Generate verification code
 * Format: 8 character alphanumeric
 */
/**
 * Generate unique certificate number
 * Format: LA-PRO-YYYY-XXXXXX
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LA-COC-${year}-${random}`;
};

const fontsPath = path.join(__dirname, "../assets/fonts");
const robotoPath = path.join(fontsPath, "Roboto-Regular.ttf");
const cormorantLightPath = path.join(fontsPath, "CormorantGaramond-Light.ttf");
const cormorantBoldPath = path.join(fontsPath, "CormorantGaramond-Bold.ttf");

if (fs.existsSync(robotoPath)) {
  registerFont(robotoPath, {
    family: "MyRoboto",
  });
}

if (fs.existsSync(cormorantLightPath)) {
  registerFont(cormorantLightPath, {
    family: "MyCormorantLight",
  });
}

if (fs.existsSync(cormorantBoldPath)) {
  registerFont(cormorantBoldPath, {
    family: "MyCormorantBold",
  });
}

const createProfessionalCertificateImage = async (data) => {
  const {
    certificateNumber,
    studentName,
    certificationTitle,
    category,
    subcategories,
    level,
    score,
    grade,
    correctAnswers,
    totalQuestions,
    completedDate,
    designedBy,
    auditedBy,
  } = data;

  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load template
  const templatePath = path.join(
    __dirname,
    "../../frontend/src/assets/templates/professional-certificate.png"
  );
  try {
    const templateImage = await loadImage(templatePath);
    ctx.drawImage(templateImage, 0, 0, width, height);
    console.log("✅ Template image loaded");
  } catch (error) {
    console.error("❌ Failed to load template:", error.message);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ===== STUDENT NAME - Using Roboto =====
  ctx.fillStyle = "#111d60";
  ctx.font = "45px MyRoboto";
  ctx.fillText(studentName.toUpperCase(), width / 2, 541);

  // ===== CERTIFICATION TITLE - Using CormorantLight =====
  ctx.fillStyle = "#111d60";
  ctx.font = "45px MyCormorantLight";

  const maxWidth = 1400;
  const titleLines = wrapText(ctx, certificationTitle, maxWidth);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, 703 + index * 50);
  });

  // ===== CATEGORY - Using Roboto =====
  ctx.fillStyle = "#111d60";
  ctx.font = "35px MyRoboto";
  ctx.fillText(category.toUpperCase(), width / 2, 810);

  if (subcategories && subcategories.length > 0) {
    ctx.fillStyle = "#111d60";
    ctx.font = "24px MyRoboto";
    const subCatText = subcategories.join(" • ");
    ctx.fillText(subCatText, width / 2, 867);
  }

  // ===== CERTIFICATE NUMBER - Using Roboto =====
  ctx.fillStyle = "#767676";
  ctx.font = "34px MyRoboto";
  ctx.fillText(certificateNumber, 1090, 1008);

  // ===== SCORE - Using CormorantBold =====
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "57px MyCormorantBold";
  ctx.fillText(`${score}%`, 1751, 913);

  // ===== GRADE - Using CormorantBold =====
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px MyCormorantBold";
  ctx.fillText(grade.toUpperCase(), 1753, 961);

  // ===== DATE - Using CormorantLight =====
  ctx.fillStyle = "#0e0e0e";
  ctx.font = "18px MyCormorantLight";
  const dateStr = completedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillText(`Issued on ${dateStr}`, 160, 1050);

  return canvas.toBuffer("image/png");
};

// Helper function
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;

    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
/**
 * Get user's eligible certificates (passed tests, not yet paid)
 */
const getEligibleCertificates = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all passed attempts without certificates
    const attempts = await CertificationAttempt.find({
      user: userId,
      passed: true,
      certificateIssued: false,
      status: "completed",
    })
      .populate(
        "certification",
        "title thumbnail category level certificatePrice discountPrice discountEndDate"
      )
      .sort({ completedAt: -1 })
      .lean();

    // Check which already have pending certificates
    const eligibleCerts = [];
    for (let attempt of attempts) {
      const existingCert = await ProfessionalCertificate.findOne({
        userId,
        attemptId: attempt._id,
      });

      if (!existingCert) {
        // Calculate current price
        const cert = attempt.certification;
        let price = cert.certificatePrice.usd;

        if (
          cert.discountPrice &&
          cert.discountEndDate &&
          new Date() < new Date(cert.discountEndDate)
        ) {
          price = cert.discountPrice.usd;
        }

        eligibleCerts.push({
          attemptId: attempt._id,
          certificationTitle: cert.title,
          thumbnail: cert.thumbnail,
          category: cert.category,
          level: cert.level,
          score: attempt.score,
          grade: calculateGrade(attempt.score),
          completedAt: attempt.completedAt,
          price,
          originalPrice: cert.certificatePrice.usd,
        });
      }
    }

    res.json({ success: true, eligibleCertificates: eligibleCerts });
  } catch (error) {
    console.error("Get eligible certificates error:", error);
    res.status(500).json({ error: "Failed to fetch eligible certificates" });
  }
};

/**
 * Get user's professional certificates (paid)
 */
const getMyCertificates = async (req, res) => {
  try {
    const userId = req.userId;

    const certificates = await ProfessionalCertificate.find({
      user: userId,
      status: { $ne: "revoked" },
    })
      .populate("certification", "title thumbnail category subcategories")
      .populate("user", "username displayName avatar")
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Get my certificates error:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
};

/**
 * Purchase certificate (create pending, then process payment)
 */

/**
 * Record certificate on blockchain (async, existing system)
 */
const recordCertificateOnBlockchain = async (certificate) => {
  try {
    console.log("🔗 Starting blockchain recording...");
    console.log("📋 Certificate:", certificate.certificateNumber);

    const {
      getProfessionalCertBlockchainService,
    } = require("../services/professionalCertificateBlockchainService");
    const blockchainService = getProfessionalCertBlockchainService();

    console.log("📝 Recording professional certificate on blockchain...");

    const result = await blockchainService.recordProfessionalCertificate({
      certificateNumber: certificate.certificateNumber,
      certificateType:
        certificate.certificateType || "Professional Certificate of Competency",
      studentName: certificate.studentName,
      studentWallet: certificate.studentWallet || "Not Connected",
      certificationTitle: certificate.certificationTitle,
      category: certificate.category,
      score: certificate.score,
      grade: certificate.grade,
      completedDate: certificate.completedDate,
      issuedDate: certificate.issuedDate,
    });

    console.log("✅ Blockchain SUCCESS!", result.transactionHash);

    // Update certificate
    certificate.blockchainVerified = true;
    certificate.blockchainTransactionHash = result.transactionHash;
    certificate.blockchainRecordedAt = new Date();
    await certificate.save();
  } catch (error) {
    console.error("❌ Blockchain recording failed:", error.message);
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await ProfessionalCertificate.findOne({
      certificateNumber,
      paid: true,
    })
      .populate("userId", "username displayName avatar")
      .populate("certificationId", "title category level")
      .lean();

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Public info only
    const publicData = {
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType,
      studentName: certificate.studentName,
      certificationTitle: certificate.certificationTitle,
      category: certificate.category,
      level: certificate.level,
      score: certificate.score,
      grade: certificate.grade,
      totalQuestions: certificate.totalQuestions,
      correctAnswers: certificate.correctAnswers,
      completedDate: certificate.completedDate,
      issuedDate: certificate.issuedDate,
      templateImage: certificate.templateImage,
      blockchainHash: certificate.blockchainHash,
      blockchainExplorerUrl: certificate.blockchainExplorerUrl,
      blockchainVerified: certificate.blockchainVerified,
      isValid: certificate.isValid,
      status: certificate.status,
    };

    res.json({ success: true, certificate: publicData });
  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
};

/**
 * Calculate grade based on score
 */
const calculateGrade = (score) => {
  if (score >= 95) return "Outstanding";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 70) return "Good";
  return "Pass";
};

module.exports = {
  getEligibleCertificates,
  getMyCertificates,
  verifyCertificate,
  createProfessionalCertificateImage,
};
