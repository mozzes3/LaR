// backend/services/certificateService.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { ethers } = require("ethers");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
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
 * PERFECT 16:9 Certificate Design
 * Fully customizable with background image, logo, signature
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

  // 16:9 aspect ratio - Full HD
  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ═══════════════════════════════════════════════════════
  // BACKGROUND
  // ═══════════════════════════════════════════════════════

  try {
    // Option 1: Try to load custom background from URL or file
    const backgroundUrl = process.env.CERTIFICATE_BACKGROUND_URL || null;

    if (backgroundUrl) {
      try {
        const background = await loadImage(backgroundUrl);
        ctx.drawImage(background, 0, 0, width, height);
      } catch (bgError) {
        console.log("Using gradient background (custom bg not found)");
        throw bgError;
      }
    } else {
      throw new Error("No background URL, using gradient");
    }
  } catch (error) {
    // Fallback: Beautiful gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(0.3, "#1a1a2e");
    gradient.addColorStop(0.7, "#16213e");
    gradient.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.fillStyle = "rgba(0, 255, 135, 0.02)";
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillRect(i, j, 20, 20);
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // BORDER & FRAME
  // ═══════════════════════════════════════════════════════

  // Outer border - Neon green
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner border - Elegant
  ctx.strokeStyle = "rgba(0, 255, 135, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Corner decorations
  const drawCornerDecoration = (x, y, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Corner lines
    ctx.strokeStyle = "#00ff87";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(60, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 60);
    ctx.stroke();

    ctx.restore();
  };

  drawCornerDecoration(100, 100, 0);
  drawCornerDecoration(width - 100, 100, Math.PI / 2);
  drawCornerDecoration(width - 100, height - 100, Math.PI);
  drawCornerDecoration(100, height - 100, -Math.PI / 2);

  // ═══════════════════════════════════════════════════════
  // LOGO / BADGE
  // ═══════════════════════════════════════════════════════

  try {
    // Try to load custom logo
    const logoUrl = process.env.CERTIFICATE_LOGO_URL || null;

    if (logoUrl) {
      const logo = await loadImage(logoUrl);
      // Draw logo at top center
      const logoSize = 120;
      ctx.drawImage(logo, width / 2 - logoSize / 2, 80, logoSize, logoSize);
    } else {
      throw new Error("No logo, using badge");
    }
  } catch (error) {
    // Fallback: Draw badge
    const badgeX = width / 2;
    const badgeY = 140;
    const badgeRadius = 60;

    // Badge circle
    ctx.fillStyle = "#00ff87";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Badge inner circle
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius - 8, 0, Math.PI * 2);
    ctx.fill();

    // Badge icon/text
    ctx.fillStyle = "#00ff87";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LA", badgeX, badgeY);
  }

  // ═══════════════════════════════════════════════════════
  // HEADER - "LIZARD ACADEMY"
  // ═══════════════════════════════════════════════════════

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Main title
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 72px Poppins Bold, Arial";
  ctx.fillText("LIZARD ACADEMY", width / 2, 260);

  // Subtitle
  ctx.fillStyle = "#ffffff";
  ctx.font = "32px Poppins, Arial";
  ctx.fillText("CERTIFICATE OF COMPLETION", width / 2, 320);

  // Decorative line
  ctx.strokeStyle = "#00ff87";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 250, 350);
  ctx.lineTo(width / 2 + 250, 350);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════
  // MAIN CONTENT - Student & Course
  // ═══════════════════════════════════════════════════════

  // "This certifies that"
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "24px Poppins, Arial";
  ctx.fillText("This certifies that", width / 2, 405);

  // Student Name - LARGE & PROMINENT
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 56px Poppins Bold, Arial";
  const maxNameWidth = width - 400;
  wrapText(ctx, studentName || "Student", width / 2, 475, maxNameWidth, 65);

  // "Has successfully completed"
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "24px Poppins, Arial";
  ctx.fillText("has successfully completed", width / 2, 550);

  // Course Title - PROMINENT
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Poppins Bold, Arial";
  const maxCourseWidth = width - 300;
  wrapText(ctx, courseTitle || "Course", width / 2, 620, maxCourseWidth, 52);

  // Category Badge
  ctx.fillStyle = "#00ff87";
  ctx.font = "20px Poppins SemiBold, Arial";
  const categoryWidth = ctx.measureText(category).width + 40;
  ctx.fillRect(width / 2 - categoryWidth / 2, 700, categoryWidth, 36);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 18px Poppins Bold, Arial";
  ctx.fillText(category, width / 2, 718);

  // ═══════════════════════════════════════════════════════
  // STATS ROW - Grade, Score, Hours
  // ═══════════════════════════════════════════════════════

  const statsY = 800;
  const spacing = 400;

  // Right: Hours
  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 40px Poppins Bold, Arial";
  ctx.fillText(`${totalHours}h`, width / 2 + spacing, statsY);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "18px Poppins, Arial";
  ctx.fillText(`${totalLessons} LESSONS`, width / 2 + spacing, statsY + 35);

  // ═══════════════════════════════════════════════════════
  // FOOTER - Date, Instructor, Certificate Number
  // ═══════════════════════════════════════════════════════

  const footerY = 930;

  // Left: Completion Date
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "18px Poppins, Arial";
  ctx.fillText("Completion Date", 150, footerY);

  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 22px Poppins Bold, Arial";
  const dateStr = new Date(completedDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillText(dateStr, 150, footerY + 28);

  // Right: Instructor
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "18px Poppins, Arial";
  ctx.fillText("Instructor", width - 150, footerY);

  ctx.fillStyle = "#00ff87";
  ctx.font = "bold 22px Poppins Bold, Arial";
  ctx.fillText(instructor, width - 150, footerY + 28);

  // Try to load signature image
  try {
    const signatureUrl = process.env.CERTIFICATE_SIGNATURE_URL || null;
    if (signatureUrl) {
      const signature = await loadImage(signatureUrl);
      ctx.drawImage(signature, width - 300, footerY + 40, 150, 40);
    }
  } catch (error) {
    // Draw signature line instead
    ctx.textAlign = "right";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 280, footerY + 60);
    ctx.lineTo(width - 120, footerY + 60);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "14px Poppins, Arial";
    ctx.fillText("Authorized Signature", width - 200, footerY + 75);
  }

  // Center: Certificate Number & Blockchain
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "16px Poppins, Arial";
  ctx.fillText(`Certificate No: ${certificateNumber}`, width / 2, 1010);

  ctx.fillStyle = "#00ff87";
  ctx.font = "14px Poppins, Arial";
  ctx.fillText("✓ Verified on Somnia Blockchain", width / 2, 1035);

  return canvas.toBuffer("image/png");
};

/**
 * Helper function for text wrapping
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  // Handle undefined or null text
  if (!text) {
    text = "";
  }

  // Convert to string if not already
  text = String(text);

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

/**
 * Generate certificate for completed course
 */
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

    console.log("📝 Minting Completion Certificate NFT...");

    // Upload to IPFS and mint NFT
    let blockchainResult = {
      transactionHash: null,
      blockNumber: null,
      tokenId: null,
      contractAddress: null,
      explorerUrl: null,
    };

    let nftMetadataURI = null;
    let nftImageURI = null;

    try {
      if (user.walletAddress && user.walletAddress !== "Not Connected") {
        const { getIPFSService } = require("./ipfsService");
        const { getNFTBlockchainService } = require("./nftBlockchainService");

        console.log("📤 Uploading certificate image to IPFS...");
        const ipfsService = getIPFSService();
        const ipfsImage = await ipfsService.uploadImage(
          certificateImageBuffer,
          `${certificateNumber}.png`
        );
        console.log(`✅ Image uploaded to IPFS: ${ipfsImage.url}`);

        // Create NFT metadata
        const metadata = {
          name: `${course.title} - Certificate of Completion`,
          description: `Soul-bound Certificate of Completion issued to ${
            user.displayName || user.username
          } by Lizard Academy for completing ${
            course.title
          }. This certificate represents verified achievement in ${
            course.category
          }.`,
          image: ipfsImage.url,
          external_url: verificationUrl,
          attributes: [
            { trait_type: "Certificate Number", value: certificateNumber },
            {
              trait_type: "Student",
              value: user.displayName || user.username,
            },
            { trait_type: "Course", value: course.title },
            { trait_type: "Category", value: course.category || "General" },
            {
              trait_type: "Total Hours",
              value: totalHours,
              display_type: "number",
            },
            {
              trait_type: "Total Lessons",
              value: course.totalLessons || 0,
              display_type: "number",
            },
            {
              trait_type: "Instructor",
              value:
                course.instructor?.displayName ||
                course.instructor?.username ||
                "Instructor",
            },
            {
              trait_type: "Completed Date",
              value: Math.floor(
                (purchase.completedAt || new Date()).getTime() / 1000
              ),
              display_type: "date",
            },
            {
              trait_type: "Issued Date",
              value: Math.floor(new Date().getTime() / 1000),
              display_type: "date",
            },
            { trait_type: "Type", value: "Soul-bound Certificate" },
          ],
          properties: {
            category: "certificates",
            type: "completion",
            skills: skills.slice(0, 5),
            creators: [{ address: "Lizard Academy", share: 100 }],
          },
        };

        console.log("📤 Uploading metadata to IPFS...");
        const ipfsMetadata = await ipfsService.uploadMetadata(metadata);
        console.log(`✅ Metadata uploaded to IPFS: ${ipfsMetadata.url}`);

        console.log("🎨 Minting Completion NFT on blockchain...");
        const nftService = await getNFTBlockchainService();
        blockchainResult = await nftService.mintCompletionCertificate(
          user.walletAddress,
          certificateNumber,
          ipfsMetadata.url
        );

        nftMetadataURI = ipfsMetadata.url;
        nftImageURI = ipfsImage.url;

        console.log(`✅ NFT minted: ${blockchainResult.transactionHash}`);
      } else {
        throw new Error("Wallet address not connected - NFT minting required");
      }
    } catch (nftError) {
      console.error("❌ NFT minting failed:", nftError.message);
      throw new Error(`Certificate generation failed: ${nftError.message}`);
    }

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
      blockchainExplorerUrl:
        blockchainResult.explorerUrl ||
        (blockchainResult.transactionHash
          ? `https://shannon-explorer.somnia.network/tx/${blockchainResult.transactionHash}`
          : null),
      blockchainBlock: blockchainResult.blockNumber,
      nftTokenId: blockchainResult.tokenId,
      nftContractAddress: blockchainResult.contractAddress,
      nftMetadataURI: nftMetadataURI,
      nftTransactionHash: blockchainResult.transactionHash,
      nftImageURI: nftImageURI,
      nftMinted: !!blockchainResult.tokenId,
      nftMintedAt: blockchainResult.tokenId ? new Date() : null,
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
module.exports = {
  generateCertificate,
  generateCertificateNumber,
  calculateGrade,
};
