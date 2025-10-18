const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const { createCanvas, loadImage, registerFont } = require("canvas");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

// Optional: Register custom fonts for signatures
// Download fonts and place in backend/fonts/
// Great Vibes: https://fonts.google.com/specimen/Great+Vibes
try {
  registerFont(path.join(__dirname, "../fonts/GreatVibes-Regular.ttf"), {
    family: "Great Vibes",
  });
  console.log("✅ Custom signature font loaded");
} catch (err) {
  console.log("⚠️ Custom fonts not loaded, using default");
}

/**
 * Generate certificate when user completes a course
 */
const generateCertificate = async (userId, courseId) => {
  try {
    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      userId,
      courseId,
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Get user, course, and purchase data
    const user = await User.findById(userId);
    const course = await Course.findById(courseId).populate(
      "instructor",
      "username displayName"
    );
    const purchase = await Purchase.findOne({ user: userId, course: courseId });

    if (!user || !course || !purchase || !purchase.isCompleted) {
      throw new Error("Cannot generate certificate - course not completed");
    }

    // Generate unique certificate number (LA = Lizard Academy)
    const certificateNumber = `LA-${new Date().getFullYear()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    // Calculate grade based on progress/completion
    const finalScore = purchase.progress || 100;
    let grade = "Good";
    if (finalScore >= 95) grade = "Outstanding";
    else if (finalScore >= 85) grade = "Excellent";
    else if (finalScore >= 75) grade = "Good";

    // Calculate total hours from course duration
    const totalHours = course.totalDuration
      ? Math.round((course.totalDuration / 3600) * 10) / 10
      : 0;

    // Get skills/subcategories
    const skills =
      course.skills || course.subcategories || [course.category] || [];

    // Create certificate image
    const certificateImageUrl = await createCertificateImage({
      studentName: user.displayName || user.username,
      courseTitle: course.title,
      category: course.category || "General",
      skills: skills.slice(0, 5), // Top 5 skills
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

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${certificateNumber}`;

    // Create blockchain hash (placeholder for now - will be real later)
    const blockchainHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    // Create certificate record
    const certificate = await Certificate.create({
      userId,
      courseId,
      templateImage: certificateImageUrl,
      studentName: user.displayName || user.username,
      studentWallet: user.walletAddress || "Not connected",
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
      blockchainHash,
      verificationUrl,
    });

    // Update user certificate count
    user.certificatesEarned = (user.certificatesEarned || 0) + 1;
    await user.save();

    console.log(`✅ Certificate generated: ${certificateNumber}`);

    return certificate;
  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    throw error;
  }
};

/**
 * Helper function for text wrapping
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Draw all lines centered
  lines.forEach((line, index) => {
    ctx.fillText(line.trim(), x, y + index * lineHeight);
  });

  return lines.length * lineHeight;
}

/**
 * Create certificate image using Canvas and upload to Bunny.net
 */
const createCertificateImage = async (data) => {
  const width = 1920;
  const height = 1080;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Try to load custom template
  let useTemplate = false;
  try {
    // Option 1: Load from local file
    const templatePath = path.join(
      __dirname,
      "../public/certificate-template.png"
    );
    const template = await loadImage(templatePath);
    ctx.drawImage(template, 0, 0, width, height);
    useTemplate = true;
    console.log("✅ Using custom certificate template");
  } catch (err) {
    // Option 2: Try loading from CDN
    try {
      const templateUrl = `${process.env.BUNNY_CDN_RESOURCES}/certificate-template.png`;
      const template = await loadImage(templateUrl);
      ctx.drawImage(template, 0, 0, width, height);
      useTemplate = true;
      console.log("✅ Using custom certificate template from CDN");
    } catch (cdnErr) {
      console.log("📝 No custom template found, generating design...");

      // Fallback: Beautiful generated certificate

      // Background - elegant dark gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(0.5, "#1e293b"); // slate-800
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle grid pattern
      ctx.strokeStyle = "rgba(250, 204, 21, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 60) {
        for (let j = 0; j < height; j += 60) {
          ctx.strokeRect(i, j, 60, 60);
        }
      }

      // Glowing orbs
      const grd1 = ctx.createRadialGradient(
        width * 0.8,
        height * 0.2,
        0,
        width * 0.8,
        height * 0.2,
        400
      );
      grd1.addColorStop(0, "rgba(250, 204, 21, 0.1)");
      grd1.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = grd1;
      ctx.fillRect(0, 0, width, height);

      const grd2 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.8,
        0,
        width * 0.2,
        height * 0.8,
        400
      );
      grd2.addColorStop(0, "rgba(168, 85, 247, 0.08)");
      grd2.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, width, height);

      // Elegant borders
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 12;
      ctx.strokeRect(80, 80, width - 160, height - 160);

      ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 100, width - 200, height - 200);

      // Corner ornaments
      const drawCornerOrnament = (x, y, rotation) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Main dot
        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();

        // Lines
        ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(50, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, 50);
        ctx.stroke();

        ctx.restore();
      };

      drawCornerOrnament(120, 120, 0);
      drawCornerOrnament(width - 120, 120, Math.PI / 2);
      drawCornerOrnament(width - 120, height - 120, Math.PI);
      drawCornerOrnament(120, height - 120, -Math.PI / 2);
    }
  }

  // Now add text overlay (works for both template and generated design)

  // Academy Name - Top Center
  ctx.fillStyle = "#FACC15";
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LIZARD ACADEMY", width / 2, 200);

  // Certificate Title
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "32px Arial";
  ctx.fillText("CERTIFICATE OF COMPLETION", width / 2, 270);

  // Decorative line
  ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 290);
  ctx.lineTo(width / 2 + 200, 290);
  ctx.stroke();

  // "Awarded to" text
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "24px Arial";
  ctx.fillText("Awarded to", width / 2, 380);

  // Student Name - Use cursive font if available
  ctx.fillStyle = "#FFFFFF";
  try {
    ctx.font = "bold 100px 'Great Vibes'";
  } catch {
    ctx.font = "italic bold 90px Arial";
  }
  ctx.fillText(data.studentName, width / 2, 500);

  // "for successfully completing"
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "24px Arial";
  ctx.fillText("for successfully completing", width / 2, 560);

  // Course Title (with wrapping)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px Arial";
  const titleHeight = wrapText(ctx, data.courseTitle, width / 2, 640, 1400, 60);

  // Category
  const categoryY = 640 + titleHeight + 30;
  if (data.category) {
    ctx.fillStyle = "rgba(250, 204, 21, 0.8)";
    ctx.font = "28px Arial";
    ctx.fillText(data.category, width / 2, categoryY);
  }

  // Skills/Subcategories (if available)
  if (data.skills && data.skills.length > 0) {
    const skillsY = categoryY + 40;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "20px Arial";
    const skillsText = data.skills.slice(0, 5).join(" • ");

    // Wrap skills if too long
    if (ctx.measureText(skillsText).width > 1400) {
      const firstHalf = data.skills.slice(0, 3).join(" • ");
      const secondHalf = data.skills.slice(3, 5).join(" • ");
      ctx.fillText(firstHalf, width / 2, skillsY);
      if (secondHalf) {
        ctx.fillText(secondHalf, width / 2, skillsY + 30);
      }
    } else {
      ctx.fillText(skillsText, width / 2, skillsY);
    }
  }

  // Grade Badge
  const badgeY = height - 220;
  ctx.fillStyle = "#FACC15";
  ctx.fillRect(width / 2 - 150, badgeY - 35, 300, 70);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 32px Arial";
  ctx.fillText(`${data.grade} - ${data.finalScore}%`, width / 2, badgeY + 10);

  // Bottom Section
  const bottomY = height - 110;

  // Date (Left)
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "20px Arial";
  ctx.fillText("Date:", 200, bottomY - 10);
  ctx.fillStyle = "#FACC15";
  ctx.font = "24px Arial";
  ctx.fillText(
    new Date(data.completedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    200,
    bottomY + 20
  );

  // Instructor Signature (Center)
  ctx.textAlign = "center";
  try {
    ctx.font = "italic 48px 'Great Vibes'";
  } catch {
    ctx.font = "italic 40px Arial";
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.instructor, width / 2, bottomY);

  // Signature line
  ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 180, bottomY + 10);
  ctx.lineTo(width / 2 + 180, bottomY + 10);
  ctx.stroke();

  ctx.font = "18px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Instructor", width / 2, bottomY + 30);

  // Certificate Number (Right)
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "18px monospace";
  ctx.fillText(
    `Certificate No: ${data.certificateNumber}`,
    width - 200,
    bottomY + 20
  );

  // Watermark/Logo (subtle)
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(250, 204, 21, 0.05)";
  ctx.font = "bold 100px Arial";
  ctx.fillText("LA", width / 2, height / 2 + 40);

  // Convert canvas to buffer
  const buffer = canvas.toBuffer("image/png");

  // Upload to Bunny.net CERTIFICATES zone
  try {
    const filename = `${data.certificateNumber}.png`;
    const storageZone = process.env.BUNNY_ZONE_CERTIFICATES;
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD_CERTIFICATES;

    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${filename}`;

    console.log(`📤 Uploading certificate to: ${uploadUrl}`);

    await axios.put(uploadUrl, buffer, {
      headers: {
        AccessKey: storagePassword,
        "Content-Type": "image/png",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Return the CDN URL
    const cdnUrl = `${process.env.BUNNY_CDN_CERTIFICATES}/${filename}`;
    console.log(`✅ Certificate image uploaded to Bunny.net: ${cdnUrl}`);

    return cdnUrl;
  } catch (error) {
    console.error(
      "❌ Error uploading to Bunny.net:",
      error.response?.data || error.message
    );
    throw new Error("Failed to upload certificate image");
  }
};

module.exports = {
  generateCertificate,
};
