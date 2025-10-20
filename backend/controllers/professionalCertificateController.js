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
 * Generate unique certificate number
 * Format: LA-PRO-YYYY-XXXXXX
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LA-PRO-${year}-${random}`;
};

/**
 * Generate verification code
 * Format: 8 character alphanumeric
 */
const generateVerificationCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

/**
 * Create professional certificate image (16:9 - 1920x1080)
 */
const createProfessionalCertificateImage = async (data) => {
  const {
    certificateNumber,
    studentName,
    certificationTitle,
    category,
    level,
    score,
    grade,
    correctAnswers,
    totalQuestions,
    completedDate,
    attemptNumber,
  } = data;

  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Premium gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0a0a");
  gradient.addColorStop(0.5, "#1a1a2e");
  gradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Premium border
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner border
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Corner decorations
  const drawCorner = (x, y, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "#00ff87";
    ctx.fillRect(-30, -3, 60, 6);
    ctx.fillRect(-3, -30, 6, 60);
    ctx.restore();
  };

  drawCorner(100, 100, 0);
  drawCorner(width - 100, 100, Math.PI / 2);
  drawCorner(width - 100, height - 100, Math.PI);
  drawCorner(100, height - 100, -Math.PI / 2);

  // Badge/Logo
  try {
    const logoUrl = process.env.CERTIFICATE_LOGO_URL;
    if (logoUrl) {
      const logo = await loadImage(logoUrl);
      ctx.drawImage(logo, width / 2 - 80, 100, 160, 160);
    } else {
      throw new Error("Use badge");
    }
  } catch {
    // Badge
    ctx.fillStyle = "#00ff87";
    ctx.beginPath();
    ctx.arc(width / 2, 180, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(width / 2, 180, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00ff87";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LA", width / 2, 180);
  }

  // Header
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 52px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LIZARD ACADEMY", width / 2, 300);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px Arial";
  ctx.fillText("PROFESSIONAL CERTIFICATE OF COMPETENCY", width / 2, 350);

  // Divider
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 300, 380);
  ctx.lineTo(width / 2 + 300, 380);
  ctx.stroke();

  // Main content
  ctx.fillStyle = "#cccccc";
  ctx.font = "24px Arial";
  ctx.fillText("This certifies that", width / 2, 430);

  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 56px Arial";
  ctx.fillText(studentName.toUpperCase(), width / 2, 490);

  ctx.fillStyle = "#cccccc";
  ctx.font = "24px Arial";
  ctx.fillText(
    "has successfully demonstrated professional competency in",
    width / 2,
    540
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  ctx.fillText(certificationTitle, width / 2, 600);

  // Test results box
  const boxY = 660;
  const boxPadding = 30;
  const boxWidth = 800;
  const boxHeight = 140;

  ctx.fillStyle = "rgba(0, 255, 135, 0.05)";
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 2;
  ctx.fillRect(width / 2 - boxWidth / 2, boxY, boxWidth, boxHeight);
  ctx.strokeRect(width / 2 - boxWidth / 2, boxY, boxWidth, boxHeight);

  const col1X = width / 2 - 250;
  const col2X = width / 2;
  const col3X = width / 2 + 250;
  const labelY = boxY + 40;
  const valueY = boxY + 90;

  ctx.fillStyle = "#888888";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SCORE", col1X, labelY);
  ctx.fillText("GRADE", col2X, labelY);
  ctx.fillText("QUESTIONS", col3X, labelY);

  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 36px Arial";
  ctx.fillText(`${score}%`, col1X, valueY);
  ctx.fillText(grade, col2X, valueY);
  ctx.fillText(`${correctAnswers}/${totalQuestions}`, col3X, valueY);

  // Footer info
  const footerY = 870;
  ctx.fillStyle = "#666666";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";

  ctx.fillText(`Category: ${category}`, width / 2 - 300, footerY);
  ctx.fillText(`Level: ${level.toUpperCase()}`, width / 2, footerY);
  ctx.fillText(
    `Completed: ${new Date(completedDate).toLocaleDateString()}`,
    width / 2 + 300,
    footerY
  );

  // Certificate number
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 20px Arial";
  ctx.fillText(`Certificate No: ${certificateNumber}`, width / 2, 930);

  // Blockchain badge
  ctx.fillStyle = "#00ff87";
  ctx.font = "16px Arial";
  ctx.fillText("🔒 BLOCKCHAIN VERIFIED", width / 2, 970);

  ctx.fillStyle = "#666666";
  ctx.font = "14px Arial";
  ctx.fillText("Permanently recorded on Somnia Blockchain", width / 2, 995);

  // Bottom text
  ctx.fillStyle = "#444444";
  ctx.font = "14px Arial";
  ctx.fillText(
    "This certificate validates professional-level competency and knowledge",
    width / 2,
    1030
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
      userId,
      paid: true,
      status: "active",
    })
      .populate("certificationId", "title thumbnail category level")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, certificates });
  } catch (error) {
    console.error("Get certificates error:", error);
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
const recordCertificateOnBlockchain = async (certificate) => {
  try {
    const { getBlockchainService } = require("../services/blockchainService");
    const blockchainService = getBlockchainService();

    console.log("📝 Recording professional certificate on blockchain...");

    const result = await blockchainService.recordProfessionalCertificate({
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType,
      studentName: certificate.studentName,
      studentWallet: certificate.studentWallet,
      certificationTitle: certificate.certificationTitle,
      category: certificate.category,
      level: certificate.level,
      score: certificate.score,
      grade: certificate.grade,
      totalQuestions: certificate.totalQuestions,
      correctAnswers: certificate.correctAnswers,
      attemptNumber: certificate.attemptNumber,
      completedDate: certificate.completedDate,
      issuedDate: certificate.issuedDate,
    });

    // Update certificate with blockchain info
    certificate.blockchainHash = result.transactionHash;
    certificate.blockchainExplorerUrl = result.explorerUrl;
    certificate.blockchainBlock = result.blockNumber;
    certificate.blockchainVerified = true;
    certificate.blockchainVerifiedAt = new Date();
    await certificate.save();

    console.log(
      "✅ Certificate recorded on blockchain:",
      result.transactionHash
    );
  } catch (error) {
    console.error("❌ Blockchain recording failed:", error);
    // Don't throw - certificate is still valid without blockchain
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
};
