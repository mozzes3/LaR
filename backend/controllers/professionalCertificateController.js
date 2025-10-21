// backend/controllers/professionalCertificateController.js
const ProfessionalCertificate = require("../models/ProfessionalCertificate");
const CertificationAttempt = require("../models/CertificationAttempt");
const ProfessionalCertification = require("../models/ProfessionalCertification");
const User = require("../models/User");
const crypto = require("crypto");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

/**
 * Generate verification code
 * Format: 8 character alphanumeric
 */
const generateVerificationCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};
/**
 * Generate unique certificate number
 * Format: LA-PRO-YYYY-XXXXXX
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LA-COC-${year}-${random}`;
};

/**
 * Create PREMIUM professional certificate image (16:9 - 1920x1080)
 */
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

  // ===== PREMIUM BACKGROUND =====
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0a0a0a");
  bgGradient.addColorStop(0.3, "#1a1a2e");
  bgGradient.addColorStop(0.7, "#16213e");
  bgGradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid pattern overlay
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  // ===== PREMIUM BORDER FRAME =====
  const borderGradient = ctx.createLinearGradient(0, 0, width, height);
  borderGradient.addColorStop(0, "#3b82f6");
  borderGradient.addColorStop(0.3, "#8b5cf6");
  borderGradient.addColorStop(0.7, "#3b82f6");
  borderGradient.addColorStop(1, "#8b5cf6");

  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner accent border
  ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Corner decorative elements
  const drawPremiumCorner = (x, y, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, 40);
    ctx.stroke();

    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawPremiumCorner(100, 100, 0);
  drawPremiumCorner(width - 100, 100, Math.PI / 2);
  drawPremiumCorner(width - 100, height - 100, Math.PI);
  drawPremiumCorner(100, height - 100, (Math.PI * 3) / 2);

  // ===== HEADER BADGE =====
  const headerY = 120;
  const badgeWidth = 480;
  const badgeHeight = 60;
  const badgeX = width / 2 - badgeWidth / 2;

  ctx.save();
  const headerGradient = ctx.createLinearGradient(
    badgeX,
    headerY,
    badgeX + badgeWidth,
    headerY
  );
  headerGradient.addColorStop(0, "#3b82f6");
  headerGradient.addColorStop(0.5, "#8b5cf6");
  headerGradient.addColorStop(1, "#3b82f6");
  ctx.fillStyle = headerGradient;

  ctx.beginPath();
  ctx.roundRect(badgeX, headerY, badgeWidth, badgeHeight, 10);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CERTIFICATE OF COMPETENCY", width / 2, headerY + 40);
  ctx.restore();

  // Decorative circles
  ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
  ctx.beginPath();
  ctx.arc(200, 250, 100, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
  ctx.beginPath();
  ctx.arc(width - 200, height - 250, 120, 0, Math.PI * 2);
  ctx.fill();

  // ===== MAIN TITLE =====
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
  ctx.shadowBlur = 20;
  ctx.fillText("Professional Certification", width / 2, 240);
  ctx.shadowBlur = 0;

  // ===== RECIPIENT SECTION =====
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "26px Arial";
  ctx.fillText("This is to certify that", width / 2, 320);

  // Student name with premium glow
  ctx.save();
  ctx.shadowColor = "#3b82f6";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px Arial";
  ctx.fillText(studentName, width / 2, 420);
  ctx.restore();

  // ===== ACHIEVEMENT TEXT =====
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "24px Arial";
  ctx.fillText(
    "has successfully demonstrated professional-level competency in",
    width / 2,
    490
  );

  // Certification title
  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 42px Arial";

  const maxWidth = 1400;
  const words = certificationTitle.split(" ");
  let line = "";
  let lines = [];

  for (let word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  const titleStartY = 560;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, titleStartY + index * 50);
  });

  // Category and subcategories
  const detailsY = titleStartY + lines.length * 50 + 40;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "italic 24px Arial";
  const categoryText = `${category}${
    subcategories && subcategories.length > 0
      ? " • " + subcategories.join(" | ")
      : ""
  }`;
  ctx.fillText(categoryText, width / 2, detailsY);

  // ===== SCORE DISPLAY BOX =====
  const scoreBoxY = detailsY + 60;
  const scoreBoxWidth = 600;
  const scoreBoxHeight = 100;
  const scoreBoxX = width / 2 - scoreBoxWidth / 2;

  ctx.save();
  const scoreGradient = ctx.createLinearGradient(
    scoreBoxX,
    scoreBoxY,
    scoreBoxX + scoreBoxWidth,
    scoreBoxY + scoreBoxHeight
  );
  scoreGradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
  scoreGradient.addColorStop(1, "rgba(5, 150, 105, 0.2)");
  ctx.fillStyle = scoreGradient;
  ctx.beginPath();
  ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 15);
  ctx.fill();

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 48px Arial";
  ctx.fillText(`SCORE: ${score}%`, width / 2, scoreBoxY + 40);

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "22px Arial";
  ctx.fillText(
    `${correctAnswers} of ${totalQuestions} Questions • Grade: ${grade}`,
    width / 2,
    scoreBoxY + 75
  );
  ctx.restore();

  // ===== VERIFICATION SECTION =====
  const verifyY = 880;

  ctx.save();
  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.beginPath();
  ctx.roundRect(width / 2 - 250, verifyY - 25, 500, 50, 10);
  ctx.fill();

  ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "16px Arial";
  ctx.fillText("Certificate ID", width / 2, verifyY - 5);

  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 22px monospace";
  ctx.fillText(certificateNumber, width / 2, verifyY + 20);
  ctx.restore();

  // Issue date
  const dateY = 945;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "20px Arial";
  ctx.fillText(
    `Issued on ${new Date(completedDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
    width / 2,
    dateY
  );

  // ===== FOOTER CREDENTIALS =====
  const footerY = 1005;

  if (designedBy) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Designed by", 120, footerY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 16px Arial";
    ctx.fillText(designedBy, 120, footerY + 22);
  }

  if (auditedBy) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Audited by", width - 120, footerY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 16px Arial";
    ctx.fillText(auditedBy, width - 120, footerY + 22);
  }

  // Blockchain verified badge
  ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
  ctx.textAlign = "center";
  ctx.font = "bold 13px Arial";
  ctx.fillText(
    "🔒 BLOCKCHAIN VERIFIED • TAMPER-PROOF • GLOBALLY RECOGNIZED",
    width / 2,
    1050
  );

  return canvas.toBuffer("image/png");
};
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
const purchaseCertificate = async (req, res) => {
  try {
    const { attemptId, paymentMethod } = req.body;
    const userId = req.userId;

    // Validate attempt
    const attempt = await CertificationAttempt.findOne({
      _id: attemptId,
      user: userId,
      passed: true,
      certificateIssued: false,
      status: "completed",
    }).populate("certification");

    if (!attempt) {
      return res.status(404).json({ error: "Eligible attempt not found" });
    }

    // Check if certificate already exists
    const existingCert = await ProfessionalCertificate.findOne({
      userId,
      attemptId,
    });

    if (existingCert && existingCert.paid) {
      return res.status(400).json({ error: "Certificate already purchased" });
    }

    const user = await User.findById(userId);
    const certification = attempt.certification;

    // Calculate price
    let price = certification.certificatePrice.usd;
    if (
      certification.discountPrice &&
      certification.discountEndDate &&
      new Date() < new Date(certification.discountEndDate)
    ) {
      price = certification.discountPrice.usd;
    }

    // For now, simulate payment (integrate Stripe/crypto later)
    const paymentId = `pay_${crypto.randomBytes(16).toString("hex")}`;

    // Generate certificate
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    const grade = calculateGrade(attempt.score);

    // Create certificate image
    const certificateBuffer = await createProfessionalCertificateImage({
      certificateNumber,
      studentName: user.displayName || user.username,
      certificationTitle: certification.title,
      category: certification.category,
      level: certification.level,
      score: attempt.score,
      grade,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      completedDate: attempt.completedAt,
      attemptNumber: attempt.attemptNumber,
    });

    // Upload to Bunny CDN
    const filename = `${certificateNumber}.png`;
    const storageZone = process.env.BUNNY_ZONE_CERTIFICATES;
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD_CERTIFICATES;
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${filename}`;

    await axios.put(uploadUrl, certificateBuffer, {
      headers: {
        AccessKey: storagePassword,
        "Content-Type": "image/png",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const certificateImageUrl = `${process.env.BUNNY_CDN_CERTIFICATES}/${filename}`;
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-professional/${certificateNumber}`;

    // Create certificate record
    const certificate = await ProfessionalCertificate.create({
      userId,
      certificationId: certification._id,
      attemptId: attempt._id,
      certificateNumber,
      certificateType: "Professional Certificate of Competency",
      studentName: user.displayName || user.username,
      studentWallet: user.walletAddress || "Not Connected",
      certificationTitle: certification.title,
      category: certification.category,
      level: certification.level,
      score: attempt.score,
      grade,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      testDuration: certification.duration,
      completedDate: attempt.completedAt,
      attemptNumber: attempt.attemptNumber,
      templateImage: certificateImageUrl,
      verificationUrl,
      verificationCode,
      paid: true, // Mark as paid (after payment processing)
      paymentAmount: price,
      paymentCurrency: "USD",
      paymentMethod,
      paymentId,
      paidAt: new Date(),
      status: "active",
      issuedDate: new Date(),
      isValid: true,
    });

    // Update attempt
    attempt.certificateIssued = true;
    attempt.certificateId = certificate._id;
    attempt.certificatePaid = true;
    attempt.certificatePaymentId = paymentId;
    attempt.certificatePaidAt = new Date();
    await attempt.save();

    // Blockchain recording (async, don't wait)
    recordCertificateOnBlockchain(certificate).catch((err) =>
      console.error("Blockchain recording error:", err)
    );

    res.json({
      success: true,
      message: "Certificate purchased successfully!",
      certificate: {
        certificateNumber,
        verificationUrl,
        imageUrl: certificateImageUrl,
      },
    });
  } catch (error) {
    console.error("Purchase certificate error:", error);
    res.status(500).json({ error: "Failed to purchase certificate" });
  }
};

/**
 * Record certificate on blockchain (async)
 */
/**
 * Record certificate on blockchain (async)
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

    console.log("✅ Blockchain SUCCESS!");
    console.log("📝 TX:", result.transactionHash);
    console.log("🔗 Explorer:", result.explorerUrl);

    certificate.blockchainHash = result.transactionHash;
    certificate.blockchainExplorerUrl = result.explorerUrl;
    certificate.blockchainBlock = result.blockNumber;
    certificate.blockchainVerified = true;
    certificate.blockchainVerifiedAt = new Date();
    await certificate.save();

    console.log("✅ Certificate updated with blockchain info");
  } catch (error) {
    console.error("❌ Blockchain recording FAILED:", error.message);
    console.error("❌ Stack:", error.stack);
  }
};
/**
 * Verify certificate by number (public)
 */
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
  purchaseCertificate,
  verifyCertificate,
  createProfessionalCertificateImage,
};
