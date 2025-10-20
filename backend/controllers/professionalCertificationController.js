// backend/controllers/professionalCertificationController.js
const ProfessionalCertification = require("../models/ProfessionalCertification");
const CertificationAttempt = require("../models/CertificationAttempt");
const ProfessionalCertificate = require("../models/ProfessionalCertificate");
const AttemptReset = require("../models/AttemptReset");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

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

    console.log("🔍 Request userId:", req.userId); // ADD THIS

    const certification = await ProfessionalCertification.findOne({
      slug,
      status: "published",
    })
      .select("-questions")
      .lean();

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    console.log("🔍 User authenticated:", !!req.userId); // ADD THIS

    const token = req.header("Authorization")?.replace("Bearer ", "");
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user && user.isActive && !user.isBanned) {
          userId = user._id;
        }
      } catch (error) {
        // Invalid token, treat as unauthenticated
      }
    }

    console.log("🔍 User authenticated:", !!userId);

    if (userId) {
      console.log("✅ Fetching attempts for user:", userId);

      const attempts = await CertificationAttempt.find({
        user: userId,
        user: req.userId,
        certification: certification._id,
      })
        .select("attemptNumber score passed completedAt status")
        .sort({ attemptNumber: -1 })
        .lean();

      console.log("📊 Found attempts:", attempts); // ADD THIS

      certification.userAttempts = attempts;
      certification.attemptsUsed = attempts.filter(
        (a) => a.status === "completed" || a.status === "cancelled"
      ).length;

      console.log("📊 Attempts used:", certification.attemptsUsed); // ADD THIS

      certification.canTakeTest =
        certification.attemptsUsed < certification.maxAttempts;

      const pendingCert = await ProfessionalCertificate.findOne({
        userId: req.userId,
        certificationId: certification._id,
        paid: false,
        status: "pending-payment",
      });
      certification.hasPendingCertificate = !!pendingCert;
    } else {
      console.log("❌ User not authenticated"); // ADD THIS
    }

    console.log("📤 Sending response:", {
      attemptsUsed: certification.attemptsUsed,
    }); // ADD THIS

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
  try {
    const { certificationId } = req.body;
    const userId = req.userId;
    const requestKey = `${userId}_${certificationId}`;

    if (activeStartRequests.has(requestKey)) {
      return res.status(429).json({ error: "Request already in progress" });
    }

    activeStartRequests.add(requestKey);

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

      if (completedAttempts >= certification.maxAttempts) {
        activeStartRequests.delete(requestKey);
        return res.status(403).json({
          error: "Maximum attempts reached",
          maxAttempts: certification.maxAttempts,
          canResetAttempts: certification.attemptResetEnabled,
          resetPrice: certification.attemptResetPrice,
        });
      }

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
        grade: calculateGrade(score),
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
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        passed: attempt.passed,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        duration: attempt.duration,
        completedAt: attempt.completedAt,
        grade: calculateGrade(attempt.score),
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

const calculateGrade = (score) => {
  if (score >= 95) return "Outstanding";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Pass";
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

module.exports = {
  getAllCertifications,
  getCertificationDetails,
  startTestAttempt,
  submitTestAttempt,
  getMyAttempts,
  getAttemptDetails,
  resetAttempts,
};
