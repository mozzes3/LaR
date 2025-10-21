// backend/controllers/professionalCertificationController.js
const ProfessionalCertification = require("../models/ProfessionalCertification");
const CertificationAttempt = require("../models/CertificationAttempt");
const ProfessionalCertificate = require("../models/ProfessionalCertificate");
const AttemptReset = require("../models/AttemptReset");
const {
  getProfessionalCertBlockchainService,
} = require("../services/professionalCertificateBlockchainService");
const {
  createProfessionalCertificateImage,
} = require("./professionalCertificateController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const FormData = require("form-data");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const sharp = require("sharp");

/**
 * ANTI-CHEAT: Server-side session management
 * Each active test gets a unique session token
 */
const activeSessions = new Map(); // userId+certId -> sessionData
const activeStartRequests = new Set();
/**
 * Get all published professional certifications
 * PUBLIC - No auth required for browsing
 */
/**
 * Generate unique certificate number
 * Format: LA-COC-YYYY-XXXXXX (Certificate of Competency)
 */

const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LA-COC-${year}-${random}`;
};
const generateVerificationCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const getAllCertifications = async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 12 } = req.query;

    const query = { status: "published" };

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const certifications = await ProfessionalCertification.find(query)
      .select("-questions") // SECURITY: Never expose questions in list
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ProfessionalCertification.countDocuments(query);

    // For each cert, check if user has attempts (if authenticated)
    if (req.userId) {
      for (let cert of certifications) {
        const attempts = await CertificationAttempt.countDocuments({
          user: req.userId,
          certification: cert._id,
          status: { $in: ["completed", "cancelled"] },
        });
        cert.userAttempts = attempts;
        cert.canTakeTest = attempts < cert.maxAttempts;
      }
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
 * Get single certification details
 * PUBLIC - But questions hidden
 */
const getCertificationDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const certification = await ProfessionalCertification.findOne({
      slug,
      status: "published",
    })
      .select("-questions")
      .lean();

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }
    console.log("🔍 Certification ID:", certification._id);
    console.log("🔍 User ID:", req.userId);

    // Check if user is authenticated
    if (req.userId) {
      const attempts = await CertificationAttempt.find({
        user: req.userId,
        certification: certification._id.toString(),
      })
        .select("attemptNumber score passed completedAt status")
        .sort({ attemptNumber: -1 })
        .lean();

      certification.userAttempts = attempts;
      certification.attemptsUsed = attempts.filter(
        (a) => a.status === "completed" || a.status === "cancelled"
      ).length;

      certification.canTakeTest =
        certification.attemptsUsed < certification.maxAttempts;

      const pendingCert = await ProfessionalCertificate.findOne({
        userId: req.userId,
        certificationId: certification._id,
        paid: false,
        status: "pending-payment",
      });

      certification.hasPendingCertificate = !!pendingCert;
    }

    res.json({ success: true, certification });
  } catch (error) {
    console.error("Get certification details error:", error);
    res.status(500).json({ error: "Failed to fetch certification" });
  }
};

/**
 * ANTI-CHEAT: Start a new test attempt
 * Creates secure session, validates eligibility
 */
const startTestAttempt = async (req, res) => {
  console.log("🔍 Start test attempt called");
  try {
    const { certificationId } = req.body;
    const userId = req.userId;
    const requestKey = `${userId}_${certificationId}`;

    if (activeStartRequests.has(requestKey)) {
      console.log("⚠️ Duplicate request detected, ignoring");
      return res.status(429).json({ error: "Request already in progress" });
    }

    activeStartRequests.add(requestKey);

    // Auto-cleanup after 10 seconds in case something goes wrong
    setTimeout(() => {
      activeStartRequests.delete(requestKey);
    }, 10000);
    try {
      const certification = await ProfessionalCertification.findById(
        certificationId
      );
      if (!certification || certification.status !== "published") {
        activeStartRequests.delete(requestKey);
        return res.status(404).json({ error: "Certification not found" });
      }

      // Check if total questions available
      if (certification.questions.length < certification.questionsPerTest) {
        activeStartRequests.delete(requestKey);
        return res.status(400).json({
          error: `Insufficient questions. Need ${certification.questionsPerTest}, have ${certification.questions.length}`,
        });
      }

      const sessionKey = `${userId}_${certificationId}`;

      if (activeSessions.has(sessionKey)) {
        const existingSession = activeSessions.get(sessionKey);
        const existingAttempt = await CertificationAttempt.findById(
          existingSession.attemptId
        );

        if (existingAttempt && existingAttempt.status === "in-progress") {
          const timeElapsed = Math.floor(
            (Date.now() - existingSession.startTime) / 1000
          );
          const timeRemaining = Math.max(
            0,
            certification.duration * 60 - timeElapsed
          );

          activeStartRequests.delete(requestKey);
          return res.json({
            success: true,
            attemptId: existingAttempt._id,
            sessionToken: existingSession.token,
            questions: existingSession.sanitizedQuestions,
            timeRemaining,
            attemptNumber: existingAttempt.attemptNumber,
            settings: {
              allowCopyPaste: certification.allowCopyPaste,
              allowTabSwitch: certification.allowTabSwitch,
              tabSwitchWarnings: certification.tabSwitchWarnings,
            },
          });
        }
      }

      const existingAttempt = await CertificationAttempt.findOne({
        user: userId,
        certification: certificationId,
        status: "in-progress",
      });

      if (existingAttempt) {
        await CertificationAttempt.deleteOne({ _id: existingAttempt._id });
      }
      const completedAttempts = await CertificationAttempt.countDocuments({
        user: userId,
        certification: certificationId,
        status: { $in: ["completed", "cancelled"] },
      });
      // NEW: Randomly select questions from pool
      let allQuestions = JSON.parse(JSON.stringify(certification.questions));

      // Shuffle all questions
      allQuestions = shuffleArray(allQuestions);

      // Select only questionsPerTest amount
      let questions = allQuestions.slice(0, certification.questionsPerTest);

      if (certification.shuffleOptions) {
        questions = questions.map((q) => {
          if (q.type === "multiple-choice" && q.options) {
            q.options = shuffleArray(q.options);
          }
          return q;
        });
      }

      const sanitizedQuestions = questions.map((q, index) => {
        const sanitized = {
          _id: q._id,
          question: q.question,
          type: q.type,
          points: q.points,
          order: index + 1,
        };

        if (q.type === "multiple-choice") {
          sanitized.options = q.options.map((opt) => ({
            text: opt.text,
          }));
        }

        return sanitized;
      });

      const attempt = await CertificationAttempt.create({
        user: userId,
        certification: certificationId,
        attemptNumber: completedAttempts + 1,
        startedAt: new Date(),
        totalQuestions: questions.length,
        status: "in-progress",
        fingerprint: {
          userAgent: req.headers["user-agent"],
          ip: crypto
            .createHash("sha256")
            .update(req.ip || "unknown")
            .digest("hex")
            .substring(0, 16),
        },
      });

      const sessionToken = crypto.randomBytes(32).toString("hex");

      activeSessions.set(sessionKey, {
        token: sessionToken,
        attemptId: attempt._id,
        questions: questions,
        sanitizedQuestions: sanitizedQuestions,
        startTime: Date.now(),
        userId,
        certificationId,
      });

      setTimeout(() => {
        activeSessions.delete(sessionKey);
        activeStartRequests.delete(requestKey);
      }, (certification.duration + 5) * 60 * 1000);

      activeStartRequests.delete(requestKey);

      res.json({
        success: true,
        attemptId: attempt._id,
        sessionToken,
        questions: sanitizedQuestions,
        timeRemaining: certification.duration * 60,
        attemptNumber: attempt.attemptNumber,
        settings: {
          allowCopyPaste: certification.allowCopyPaste,
          allowTabSwitch: certification.allowTabSwitch,
          tabSwitchWarnings: certification.tabSwitchWarnings,
        },
      });
    } catch (innerError) {
      activeStartRequests.delete(requestKey);
      throw innerError;
    }
  } catch (error) {
    console.error("Start test attempt error:", error);
    res.status(500).json({ error: "Failed to start test" });
  }
};

/**
 * ANTI-CHEAT: Track security violations
 */

/**
 * Submit test answers - SERVER-SIDE VALIDATION ONLY
 * SECURITY: Never trust client-side scoring
 */
const submitTestAttempt = async (req, res) => {
  try {
    const { attemptId, answers, sessionToken, securityLog } = req.body;
    const userId = req.userId;

    // Atomically update status to prevent race conditions
    const attempt = await CertificationAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        user: userId,
        status: "in-progress",
      },
      { $set: { status: "processing" } },
      { new: false }
    ).populate("certification");

    if (!attempt) {
      return res
        .status(404)
        .json({ error: "Invalid attempt or already submitted" });
    }

    const sessionKey = `${userId}_${attempt.certification._id}`;
    const session = activeSessions.get(sessionKey);

    if (!session || session.token !== sessionToken) {
      attempt.status = "in-progress";
      await attempt.save();
      return res.status(403).json({ error: "Invalid session" });
    }

    // Process security log
    if (securityLog && Array.isArray(securityLog)) {
      const tabSwitches = securityLog.filter(
        (e) => e.type === "tab-switch"
      ).length;
      const copyAttempts = securityLog.filter(
        (e) => e.type === "copy-attempt"
      ).length;
      const pasteAttempts = securityLog.filter(
        (e) => e.type === "paste-attempt"
      ).length;
      const rightClicks = securityLog.filter(
        (e) => e.type === "right-click"
      ).length;

      attempt.tabSwitches = tabSwitches;
      attempt.copyAttempts = copyAttempts;
      attempt.pasteAttempts = pasteAttempts;
      attempt.rightClickAttempts = rightClicks;

      if (tabSwitches > 0) {
        attempt.tabSwitchTimestamps = securityLog
          .filter((e) => e.type === "tab-switch")
          .map((e) => new Date(e.timestamp));
      }
    }

    // Validate time limits
    const timeElapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const maxTime = attempt.certification.duration * 60 + 60;

    if (timeElapsed > maxTime) {
      attempt.status = "cancelled";
      attempt.cancelReason = "Time limit exceeded";
      attempt.completedAt = new Date();
      await attempt.save();
      activeSessions.delete(sessionKey);
      return res.status(400).json({ error: "Time limit exceeded" });
    }

    // SERVER-SIDE SCORING
    const originalQuestions = session.questions;
    let correctCount = 0;
    const gradedAnswers = [];

    for (let userAnswer of answers) {
      const question = originalQuestions.find(
        (q) => q._id.toString() === userAnswer.questionId
      );

      if (!question) continue;

      let isCorrect = false;

      if (question.type === "multiple-choice") {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        isCorrect = correctOption && userAnswer.answer === correctOption.text;
      } else if (question.type === "true-false") {
        isCorrect = userAnswer.answer === question.correctAnswer;
      }

      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionId: question._id,
        answer: userAnswer.answer,
        isCorrect,
        timeSpent: userAnswer.timeSpent || 0,
      });
    }

    const score = Math.round((correctCount / originalQuestions.length) * 100);
    const passed = score >= attempt.certification.passingScore;
    const actualDuration = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );

    // Update attempt
    attempt.answers = gradedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.incorrectAnswers =
      originalQuestions.length -
      correctCount -
      (originalQuestions.length - answers.length);
    attempt.unansweredQuestions = originalQuestions.length - answers.length;
    attempt.score = score;
    attempt.passed = passed;
    attempt.completedAt = new Date();
    attempt.duration = actualDuration;
    attempt.status = "completed";

    await attempt.save();
    activeSessions.delete(sessionKey);

    res.json({
      success: true,
      results: {
        attemptId: attempt._id,
        score,
        passed,
        correctAnswers: correctCount,
        incorrectAnswers: attempt.incorrectAnswers,
        unansweredQuestions: attempt.unansweredQuestions,
        totalQuestions: originalQuestions.length,
        duration: actualDuration,
        grade: calculateGrade(score, attempt.certification.passingScore),
        attemptNumber: attempt.attemptNumber,
      },
    });
  } catch (error) {
    console.error("Submit test attempt error:", error);
    res.status(500).json({ error: "Failed to submit test" });
  }
};

/**
 * Get user's attempt history
 */
const getMyAttempts = async (req, res) => {
  try {
    const userId = req.userId;
    const { certificationId } = req.query;

    const query = {
      user: userId,
      status: "completed",
    };
    if (certificationId) query.certification = certificationId;

    const attempts = await CertificationAttempt.find(query)
      .populate("certification", "title slug thumbnail category level")
      .select("-answers -fingerprint")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, attempts });
  } catch (error) {
    console.error("Get attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};

/**
 * Get attempt details with answers (after completion)
 */
const getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.userId;

    const attempt = await CertificationAttempt.findOne({
      _id: attemptId,
      user: userId,
      status: "completed",
    }).populate("certification");

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    // Get questions with correct answers for review
    const questions = attempt.certification.questions.map((q, index) => {
      const userAnswer = attempt.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      return {
        question: q.question,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer?.answer,
        isCorrect: userAnswer?.isCorrect,
        points: q.points,
        explanation: q.explanation,
      };
    });

    res.json({
      success: true,
      attempt: {
        _id: attempt._id,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        grade: attempt.grade,
        passed: attempt.passed,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        duration: attempt.duration,
        completedAt: attempt.completedAt,
        grade: calculateGrade(
          attempt.score,
          attempt.certification.passingScore
        ),
      },
      certification: {
        slug: attempt.certification.slug,
        title: attempt.certification.title,
        category: attempt.certification.category,
        subcategory: attempt.certification.subcategory,
        passingScore: attempt.certification.passingScore,
        maxAttempts: attempt.certification.maxAttempts,
      },
      questions,
    });
  } catch (error) {
    console.error("Get attempt details error:", error);
    res.status(500).json({ error: "Failed to fetch attempt details" });
  }
};

const resetAttempts = async (req, res) => {
  try {
    const { certificationId, paymentMethod, paymentId, transactionHash } =
      req.body;
    const userId = req.userId;

    const certification = await ProfessionalCertification.findById(
      certificationId
    );

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    if (!certification.attemptResetEnabled) {
      return res
        .status(400)
        .json({ error: "Attempt reset not available for this certification" });
    }

    const completedAttempts = await CertificationAttempt.countDocuments({
      user: userId,
      certification: certificationId,
      status: { $in: ["completed", "cancelled"] },
    });

    if (completedAttempts < certification.maxAttempts) {
      return res
        .status(400)
        .json({ error: "You still have attempts remaining" });
    }

    // Create reset record
    const attemptReset = await AttemptReset.create({
      user: userId,
      certification: certificationId,
      paymentAmount: certification.attemptResetPrice.usd,
      paymentCurrency: "USD",
      paymentMethod,
      paymentId,
      transactionHash,
      attemptsResetCount: certification.maxAttempts,
    });

    // Delete all previous attempts
    await CertificationAttempt.deleteMany({
      user: userId,
      certification: certificationId,
    });

    res.json({
      success: true,
      message: "Attempts reset successfully",
      attemptsAvailable: certification.maxAttempts,
      resetRecord: attemptReset._id,
    });
  } catch (error) {
    console.error("Reset attempts error:", error);
    res.status(500).json({ error: "Failed to reset attempts" });
  }
};
// Helper functions
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateGrade = (score, passingScore = 70) => {
  if (score >= 95) return "Outstanding";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= passingScore) return "Pass"; // Dynamic based on certification's passing score
  return "Fail";
};

const calculateAverageScore = async (certificationId) => {
  const result = await CertificationAttempt.aggregate([
    {
      $match: {
        certification: certificationId,
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: "$score" },
      },
    },
  ]);

  return result[0]?.averageScore || 0;
};

const purchaseCertificate = async (req, res) => {
  try {
    const { attemptId, paymentMethod, transactionHash } = req.body;
    const userId = req.userId;

    console.log("📝 Purchase request:", { attemptId, paymentMethod, userId });

    // Get attempt with all populated data
    const attempt = await CertificationAttempt.findById(attemptId)
      .populate("certification")
      .populate("user", "username displayName email walletAddress");

    console.log("🔍 Found attempt:", attempt ? "YES" : "NO");

    if (!attempt) {
      console.log("❌ Attempt not found for ID:", attemptId);
      return res.status(404).json({ error: "Attempt not found" });
    }

    // Fix user comparison - handle both ObjectId and populated object
    const attemptUserId = attempt.user._id || attempt.user;

    console.log("👤 Comparing users:", {
      attemptUserId: attemptUserId.toString(),
      currentUserId: userId.toString(),
    });

    if (attemptUserId.toString() !== userId.toString()) {
      console.log("❌ Unauthorized: User mismatch");
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!attempt.passed) {
      return res.status(400).json({ error: "Test not passed" });
    }

    // Check if certificate already exists
    const existingCert = await ProfessionalCertificate.findOne({
      userId: userId,
      attemptId: attemptId, // Check by attemptId, not certificationId
      status: { $ne: "revoked" },
    })
      .populate("certificationId", "title thumbnail category subcategories")
      .populate("userId", "username displayName avatar");

    if (existingCert) {
      console.log("📜 Certificate already exists for this attempt");
      return res.json({
        success: true,
        certificate: existingCert,
        message: "Certificate already purchased",
        alreadyExists: true,
      });
    }
    // Generate certificate number
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    // ADD THESE DEBUG LOGS:
    console.log("🔍 Generated certificateNumber:", certificateNumber);
    console.log("🔍 Generated verificationCode:", verificationCode);
    console.log("🔍 Type of verificationCode:", typeof verificationCode);
    // Generate certificate image
    const studentName = attempt.user.displayName || attempt.user.username;
    const certificationData = {
      certificateNumber,
      studentName,
      certificationTitle: attempt.certification.title,
      category: attempt.certification.category,
      subcategories: attempt.certification.subcategories,
      level: attempt.certification.level,
      score: attempt.score,
      grade: attempt.grade,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      completedDate: attempt.completedAt,
      designedBy: attempt.certification.designedBy,
      auditedBy: attempt.certification.auditedBy,
    };

    const certificateBuffer = await createProfessionalCertificateImage(
      certificationData
    );

    const webpBuffer = await sharp(certificateBuffer)
      .webp({ quality: 85, effort: 6 })
      .toBuffer();

    // Upload to Bunny CDN
    const filename = `${certificateNumber}.webp`;
    let certificateUrl;

    try {
      console.log("📤 Uploading certificate to Bunny CDN...");

      const uploadResponse = await axios.put(
        `https://storage.bunnycdn.com/${process.env.BUNNY_ZONE_CERTIFICATES}/${filename}`,
        webpBuffer,
        {
          headers: {
            AccessKey: process.env.BUNNY_STORAGE_PASSWORD_CERTIFICATES,
            "Content-Type": "image/webp",
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      certificateUrl = `${process.env.BUNNY_CDN_CERTIFICATES}/${filename}`;
      console.log("✅ Certificate uploaded:", certificateUrl);
    } catch (uploadError) {
      console.error(
        "❌ Certificate upload error:",
        uploadError.response?.data || uploadError.message
      );
      throw new Error("Failed to upload certificate");
    }

    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify/${certificateNumber}`;

    const certificate = await ProfessionalCertificate.create({
      // Required fields from model
      userId: userId,
      certificationId: attempt.certification._id,
      attemptId: attemptId,
      studentName: studentName,
      studentWallet: attempt.user.walletAddress || "N/A",
      certificationTitle: attempt.certification.title,
      completedDate: attempt.completedAt,
      issuedDate: new Date(),
      verificationUrl: verificationUrl,
      verificationCode: verificationCode,

      // Certificate details
      certificateNumber,
      certificateUrl,
      templateImage: certificateUrl,
      grade: calculateGrade(attempt.score, attempt.certification.passingScore),
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      testDuration: attempt.certification.duration,
      category: attempt.certification.category,
      level: attempt.certification.level,

      // Payment details
      paymentAmount: attempt.certification.certificatePrice.usd,
      paymentCurrency: "USD",
      paymentMethod,
      transactionHash,
      paid: true,

      // Status
      isValid: true,
      status: "active",
      blockchainVerified: false,

      // Optional metadata
      metadata: {
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        attemptNumber: attempt.attemptNumber,
        category: attempt.certification.category,
        subcategories: attempt.certification.subcategories,
        level: attempt.certification.level,
      },
    });

    // Mark attempt as certificate issued
    attempt.certificateIssued = true;
    await attempt.save();

    // Record on blockchain
    try {
      console.log("📝 Recording certificate on blockchain...");
      console.log(
        "🔍 Type of import:",
        typeof getProfessionalCertBlockchainService
      );
      console.log("🔍 Import value:", getProfessionalCertBlockchainService);

      if (typeof getProfessionalCertBlockchainService !== "function") {
        throw new Error(
          "getProfessionalCertBlockchainService is not a function - import failed"
        );
      }

      const blockchainService = await getProfessionalCertBlockchainService();
      console.log("🔍 Service instance:", blockchainService);

      const blockchainTx =
        await blockchainService.recordProfessionalCertificate({
          certificateNumber: certificate.certificateNumber,
          certificateType: "Professional Competency",
          studentName: certificate.studentName,
          studentWallet:
            certificate.studentWallet === "N/A"
              ? "0x0000000000000000000000000000000000000000"
              : certificate.studentWallet,
          certificationTitle: certificate.certificationTitle,
          category: certificate.category,
          score: certificate.score,
          grade: certificate.grade,
          completedDate: certificate.completedDate,
          issuedDate: certificate.issuedDate,
        });

      certificate.blockchainVerified = true;
      certificate.blockchainHash = blockchainTx.hash;
      certificate.blockchainExplorerUrl = blockchainTx.explorerUrl;
      certificate.blockchainBlock = blockchainTx.blockNumber;
      certificate.blockchainNetwork = "Somnia";
      certificate.blockchainVerifiedAt = new Date(); // Also set this
      await certificate.save();

      console.log("✅ Certificate recorded on blockchain:", blockchainTx.hash);
    } catch (blockchainError) {
      console.error("❌ Blockchain recording failed:", blockchainError.message);
      console.error("❌ Full error:", blockchainError);
    }

    // ===========================================
    // NFT MINTING (NEW)
    // ===========================================
    try {
      if (certificate.studentWallet && certificate.studentWallet !== "N/A") {
        console.log("🎨 Starting NFT minting process...");

        const { getIPFSService } = require("../services/ipfsService");
        const {
          getNFTBlockchainService,
        } = require("../services/nftBlockchainService");

        console.log("📤 Uploading certificate image to IPFS...");
        const ipfsService = getIPFSService();
        const ipfsImage = await ipfsService.uploadImage(
          webpBuffer,
          `${certificateNumber}.webp`
        );
        console.log(`✅ Image uploaded: ${ipfsImage.url}`);

        const metadata = {
          name: `${attempt.certification.title} - Certificate of Competency`,
          description: `Soul-bound Professional Certificate of Competency issued to ${studentName} by Lizard Academy for completing ${attempt.certification.title}. This certificate represents verified achievement in ${attempt.certification.category}.`,
          image: ipfsImage.url,
          external_url: verificationUrl,
          attributes: [
            { trait_type: "Certificate Number", value: certificateNumber },
            { trait_type: "Student", value: studentName },
            { trait_type: "Certification", value: attempt.certification.title },
            { trait_type: "Category", value: attempt.certification.category },
            { trait_type: "Level", value: attempt.certification.level },
            {
              trait_type: "Score",
              value: attempt.score,
              display_type: "number",
            },
            { trait_type: "Grade", value: certificate.grade },
            {
              trait_type: "Correct Answers",
              value: `${attempt.correctAnswers}/${attempt.totalQuestions}`,
            },
            {
              trait_type: "Completed Date",
              value: Math.floor(attempt.completedAt.getTime() / 1000),
              display_type: "date",
            },
            {
              trait_type: "Issued Date",
              value: Math.floor(new Date().getTime() / 1000),
              display_type: "date",
            },
            { trait_type: "Type", value: "Soul-bound Certificate" },
            { trait_type: "Blockchain", value: "Somnia" },
          ],
          properties: {
            category: "certificates",
            type: "competency",
            creators: [{ address: "Lizard Academy", share: 100 }],
          },
        };

        console.log("📤 Uploading metadata to IPFS...");
        const ipfsMetadata = await ipfsService.uploadMetadata(metadata);
        console.log(`✅ Metadata uploaded: ${ipfsMetadata.url}`);

        console.log("🎨 Minting NFT on blockchain...");
        const nftService = await getNFTBlockchainService();
        const nftResult = await nftService.mintCertificateNFT(
          {
            studentWallet: certificate.studentWallet,
            certificateNumber: certificate.certificateNumber,
          },
          ipfsMetadata.url
        );

        certificate.nftTokenId = nftResult.tokenId;
        certificate.nftMetadataURI = ipfsMetadata.url;
        certificate.nftImageURI = ipfsImage.url;
        certificate.nftMinted = true;
        certificate.nftContractAddress =
          process.env.COMPETENCY_NFT_CONTRACT_ADDRESS;
        certificate.nftTransactionHash = nftResult.transactionHash;
        certificate.nftMintedAt = new Date();
        await certificate.save();

        console.log(`✅ NFT minted! Token ID: ${nftResult.tokenId}`);
        console.log(`🔗 Explorer: ${nftResult.explorerUrl}`);
      } else {
        console.log("⚠️ No wallet connected - skipping NFT mint");
      }
    } catch (nftError) {
      console.error("❌ NFT minting failed:", nftError.message);
      certificate.nftMintError = nftError.message;
      await certificate.save();
    }

    // Populate certificate for response
    const populatedCert = await ProfessionalCertificate.findById(
      certificate._id
    )
      .populate("certificationId", "title thumbnail category subcategories")
      .populate("userId", "username displayName avatar");

    res.json({
      success: true,
      certificate: populatedCert,
      message: "Certificate purchased and generated successfully",
    });
  } catch (error) {
    console.error("Purchase certificate error:", error);
    res.status(500).json({
      error: "Failed to purchase certificate",
      details: error.message,
    });
  }
};

const getEligibleCertificates = async (req, res) => {
  try {
    const userId = req.userId;

    const passedAttempts = await CertificationAttempt.find({
      user: userId,
      passed: true,
      status: "completed",
    }).populate(
      "certification",
      "title thumbnail category subcategories certificatePrice"
    );

    // Check which attempts already have certificates
    const attemptIds = passedAttempts.map((a) => a._id.toString());
    const purchased = await ProfessionalCertificate.find({
      userId: userId,
      attemptId: { $in: attemptIds },
      status: { $ne: "revoked" },
    }).select("attemptId");

    const purchasedAttemptIds = purchased.map((p) => p.attemptId.toString());

    // Filter out attempts that already have certificates
    const eligible = passedAttempts.filter(
      (attempt) => !purchasedAttemptIds.includes(attempt._id.toString())
    );

    res.json({
      success: true,
      eligible: eligible.map((a) => ({
        attemptId: a._id,
        certification: a.certification,
        score: a.score,
        passedAt: a.completedAt,
      })),
    });
  } catch (error) {
    console.error("Get eligible error:", error);
    res.status(500).json({ error: "Failed to fetch eligible certificates" });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const userId = req.userId;

    const certificates = await ProfessionalCertificate.find({
      userId: userId,
      status: { $ne: "revoked" },
    })
      .populate("certificationId", "title thumbnail category subcategories")
      .populate("userId", "username displayName avatar")
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Get my certificates error:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await ProfessionalCertificate.findOne({
      certificateNumber,
      isValid: true,
      status: "active",
    })
      .populate("certificationId", "title category subcategories") // CORRECT
      .populate("userId", "username displayName avatar"); // CORRECT

    if (!certificate) {
      return res
        .status(404)
        .json({ error: "Certificate not found or invalid" });
    }

    res.json({
      success: true,
      certificate,
      verified: true,
    });
  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
};

module.exports = {
  getAllCertifications,
  getCertificationDetails,
  startTestAttempt,
  submitTestAttempt,
  getMyAttempts,
  getAttemptDetails,
  resetAttempts,
  purchaseCertificate,
  getEligibleCertificates,
  getMyCertificates,
  verifyCertificate,
};
