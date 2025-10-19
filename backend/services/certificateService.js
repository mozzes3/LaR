// backend/services/certificateService.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const { getBlockchainService } = require("./blockchainService");

// Register fonts
try {
  registerFont(path.join(__dirname, "../assets/fonts/Poppins-Bold.ttf"), {
    family: "Poppins Bold",
  });
  registerFont(path.join(__dirname, "../assets/fonts/Poppins-Regular.ttf"), {
    family: "Poppins",
  });
  registerFont(path.join(__dirname, "../assets/fonts/Poppins-SemiBold.ttf"), {
    family: "Poppins SemiBold",
  });
} catch (error) {
  console.warn("⚠️ Fonts not loaded, using system fonts");
}

/**
 * Generate certificate number
 * Format: LA-YYYY-XXXXXX (Lizard Academy - Year - Random)
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LA-${year}-${random}`;
};

/**
 * Calculate grade based on final score
 */
const calculateGrade = (score) => {
  if (score >= 95) return "Outstanding";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Pass";
  return "Completed";
};

/**
 * Create certificate image
 */
const createCertificateImage = async (data) => {
  const {
    studentName,
    courseTitle,
    category,
    skills,
    instructor,
    completedDate,
    certificateNumber,
    grade,
    finalScore,
    totalHours,
    totalLessons,
  } = data;

  const width = 2480;
  const height = 3508;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0a0a");
  gradient.addColorStop(0.5, "#1a1a1a");
  gradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 20;
  ctx.strokeRect(100, 100, width - 200, height - 200);

  // Inner border
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 4;
  ctx.strokeRect(150, 150, width - 300, height - 300);

  // Logo/Badge area
  ctx.fillStyle = "#00ff87";
  ctx.beginPath();
  ctx.arc(width / 2, 500, 120, 0, Math.PI * 2);
  ctx.fill();

  // "LIZARD ACADEMY" text
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 140px Poppins Bold";
  ctx.textAlign = "center";
  ctx.fillText("LIZARD ACADEMY", width / 2, 800);

  // "Certificate of Completion"
  ctx.fillStyle = "#ffffff";
  ctx.font = "80px Poppins";
  ctx.fillText("CERTIFICATE OF COMPLETION", width / 2, 950);

  // Divider line
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 400, 1000);
  ctx.lineTo(width / 2 + 400, 1000);
  ctx.stroke();

  // "This certifies that"
  ctx.fillStyle = "#cccccc";
  ctx.font = "50px Poppins";
  ctx.fillText("This certifies that", width / 2, 1150);

  // Student name
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 120px Poppins Bold";
  wrapText(ctx, studentName, width / 2, 1300, width - 500, 140);

  // "Has successfully completed"
  ctx.fillStyle = "#ffffff";
  ctx.font = "50px Poppins";
  ctx.fillText("has successfully completed", width / 2, 1500);

  // Course title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 90px Poppins Bold";
  wrapText(ctx, courseTitle, width / 2, 1650, width - 400, 110);

  // Category badge
  ctx.fillStyle = "#00ff87";
  ctx.font = "40px Poppins SemiBold";
  const categoryWidth = ctx.measureText(category).width + 60;
  ctx.fillRect(width / 2 - categoryWidth / 2, 1850, categoryWidth, 60);
  ctx.fillStyle = "#000000";
  ctx.fillText(category, width / 2, 1895);

  // Stats section
  const statsY = 2050;
  const statsSpacing = 450;

  // Grade
  ctx.fillStyle = "#00ff87";
  ctx.font = "60px Poppins Bold";
  ctx.fillText(grade, width / 2 - statsSpacing, statsY);
  ctx.fillStyle = "#999999";
  ctx.font = "35px Poppins";
  ctx.fillText("GRADE", width / 2 - statsSpacing, statsY + 50);

  // Score
  ctx.fillStyle = "#00ff87";
  ctx.font = "60px Poppins Bold";
  ctx.fillText(`${finalScore}%`, width / 2, statsY);
  ctx.fillStyle = "#999999";
  ctx.font = "35px Poppins";
  ctx.fillText("SCORE", width / 2, statsY + 50);

  // Hours
  ctx.fillStyle = "#00ff87";
  ctx.font = "60px Poppins Bold";
  ctx.fillText(`${totalHours}h`, width / 2 + statsSpacing, statsY);
  ctx.fillStyle = "#999999";
  ctx.font = "35px Poppins";
  ctx.fillText(
    `${totalLessons} LESSONS`,
    width / 2 + statsSpacing,
    statsY + 50
  );

  // Skills section
  if (skills && skills.length > 0) {
    ctx.fillStyle = "#cccccc";
    ctx.font = "40px Poppins";
    ctx.fillText("Skills Mastered:", width / 2, 2300);

    ctx.fillStyle = "#00ff87";
    ctx.font = "45px Poppins SemiBold";
    const skillsText = skills.slice(0, 5).join(" • ");
    wrapText(ctx, skillsText, width / 2, 2380, width - 400, 60);
  }

  // Bottom section
  const bottomY = height - 600;

  // Date
  ctx.fillStyle = "#ffffff";
  ctx.font = "40px Poppins";
  ctx.textAlign = "left";
  ctx.fillText("Completed:", 400, bottomY);
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 45px Poppins Bold";
  const dateStr = new Date(completedDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillText(dateStr, 400, bottomY + 60);

  // Instructor
  ctx.fillStyle = "#ffffff";
  ctx.font = "40px Poppins";
  ctx.textAlign = "right";
  ctx.fillText("Instructor:", width - 400, bottomY);
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 45px Poppins Bold";
  ctx.fillText(instructor, width - 400, bottomY + 60);

  // Certificate number
  ctx.fillStyle = "#666666";
  ctx.font = "35px Poppins";
  ctx.textAlign = "center";
  ctx.fillText(`Certificate No: ${certificateNumber}`, width / 2, height - 300);

  // Verification text
  ctx.fillStyle = "#00ff87";
  ctx.font = "30px Poppins";
  ctx.fillText("Verified on Blockchain", width / 2, height - 230);

  return canvas.toBuffer("image/png");
};

/**
 * Generate certificate for completed course
 */
const generateCertificate = async (userId, courseId) => {
  try {
    console.log(
      `🎓 Generating certificate for user ${userId}, course ${courseId}`
    );

    const user = await User.findById(userId);
    const course = await Course.findById(courseId).populate("instructor");
    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      isCompleted: true,
    });

    if (!user || !course || !purchase) {
      throw new Error("User, course, or purchase not found");
    }

    const existingCert = await Certificate.findOne({ userId, courseId });
    if (existingCert) {
      console.log("Certificate already exists");
      return existingCert;
    }

    const certificateNumber = generateCertificateNumber();
    const finalScore = purchase.finalScore || 100;
    const grade = calculateGrade(finalScore);
    const totalHours = course.totalDuration
      ? Math.round((course.totalDuration / 3600) * 10) / 10
      : 0;

    const skills =
      course.skills || course.subcategories || [course.category] || [];

    const certificateImageBuffer = await createCertificateImage({
      studentName: user.displayName || user.username,
      courseTitle: course.title,
      category: course.category || "General",
      skills: skills.slice(0, 5),
      instructor:
        course.instructor?.displayName ||
        course.instructor?.username ||
        "Instructor",
      completedDate: purchase.completedAt || new Date(),
      certificateNumber,
      grade,
      finalScore,
      totalHours,
      totalLessons: course.totalLessons || 0,
    });

    // Upload to Bunny.net CERTIFICATES zone
    const filename = `${certificateNumber}.png`;
    const storageZone = process.env.BUNNY_ZONE_CERTIFICATES;
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD_CERTIFICATES;
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${filename}`;

    await axios.put(uploadUrl, certificateImageBuffer, {
      headers: {
        AccessKey: storagePassword,
        "Content-Type": "image/png",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const certificateImageUrl = `${process.env.BUNNY_CDN_CERTIFICATES}/${filename}`;
    console.log(`✅ Certificate uploaded: ${certificateImageUrl}`);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${certificateNumber}`;

    console.log("📝 Recording certificate on blockchain...");

    // Record on blockchain automatically (backend pays gas)
    const blockchainService = getBlockchainService();
    const blockchainResult = await blockchainService.recordCertificate({
      certificateNumber,
      studentName: user.displayName || user.username,
      studentWallet: user.walletAddress || "Not Connected",
      courseTitle: course.title,
      instructor:
        course.instructor?.displayName ||
        course.instructor?.username ||
        "Instructor",
      completedDate: purchase.completedAt || new Date(),
      grade,
      finalScore,
      totalHours,
      totalLessons: course.totalLessons || 0,
    });

    console.log(`✅ Blockchain recorded: ${blockchainResult.transactionHash}`);

    const certificate = await Certificate.create({
      userId,
      courseId,
      templateImage: certificateImageUrl,
      studentName: user.displayName || user.username,
      studentWallet: user.walletAddress || "Not Connected",
      courseTitle: course.title,
      instructor:
        course.instructor?.displayName ||
        course.instructor?.username ||
        "Instructor",
      completedDate: purchase.completedAt || new Date(),
      skills: skills,
      certificateNumber,
      grade,
      finalScore,
      totalHours,
      totalLessons: course.totalLessons || 0,
      blockchainHash: blockchainResult.transactionHash,
      blockchainExplorerUrl: blockchainResult.explorerUrl,
      blockchainBlock: blockchainResult.blockNumber,
      verificationUrl,
    });

    user.certificatesEarned = (user.certificatesEarned || 0) + 1;
    await user.save();

    console.log(`✅ Certificate generated: ${certificateNumber}`);

    return certificate;
  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    throw error;
  }
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line.trim(), x, startY + index * lineHeight);
  });
}

module.exports = {
  generateCertificate,
  generateCertificateNumber,
  calculateGrade,
};
