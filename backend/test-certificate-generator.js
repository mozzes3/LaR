// test-certificate-generator.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const TEMPLATE_IMAGE_PATH = "./certificate-template.png";
const OUTPUT_PATH = "./template/test-certificate.webp";

// Use ABSOLUTE PATH on Windows
const FONT_PATH =
  "C:\\FounderAcademy\\founder-academy\\backend\\template\\assets\\fonts";
const robotoPath = path.join(FONT_PATH, "Roboto-Regular.ttf");

console.log("📁 Checking Roboto at:", robotoPath);
console.log("✅ File exists:", fs.existsSync(robotoPath));

// Register with a unique name to avoid conflicts
if (fs.existsSync(robotoPath)) {
  registerFont(robotoPath, {
    family: "MyCustomFont", // Use a completely unique name
  });
  console.log("✅ Font registered as MyCustomFont");
}

const testData = {
  certificateNumber: "LA-COC-2025-TEST001",
  studentName: "John Doe",
  certificationTitle: "Advanced Web Development Mastery",
  category: "Programming",
  subcategories: ["JavaScript", "React", "Node.js"],
  score: 95,
  grade: "Outstanding",
  completedDate: new Date(),
};

async function createCertificate(data) {
  const {
    certificateNumber,
    studentName,
    certificationTitle,
    category,
    subcategories = [],
    score,
    grade,
    completedDate,
  } = data;

  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load template
  try {
    const templateImage = await loadImage(TEMPLATE_IMAGE_PATH);
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

  const addTextShadow = () => {
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  };

  const clearShadow = () => {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // ===== STUDENT NAME =====
  ctx.fillStyle = "#111d60";
  ctx.font = "45px MyCustomFont"; // Use the unique name
  ctx.fillText(studentName.toUpperCase(), width / 2, 541);
  clearShadow();

  // ===== CERTIFICATION TITLE =====
  ctx.fillStyle = "#111d60";
  ctx.font = "45px MyCustomFont"; // Use the unique name

  const maxWidth = 1400;
  const titleLines = wrapText(ctx, certificationTitle, maxWidth);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, 703 + index * 50);
  });
  clearShadow();

  // ===== CATEGORY =====
  ctx.fillStyle = "#111d60";
  ctx.font = "35px MyCustomFont"; // Use the unique name
  ctx.fillText(category.toUpperCase(), width / 2, 810);

  if (subcategories && subcategories.length > 0) {
    ctx.fillStyle = "#111d60";
    ctx.font = "24px MyCustomFont"; // Use the unique name
    const subCatText = subcategories.join(" • ");
    ctx.fillText(subCatText, width / 2, 867);
  }
  clearShadow();

  // ===== CERTIFICATE NUMBER =====
  ctx.fillStyle = "#767676";
  ctx.font = "34px MyCustomFont"; // Use the unique name
  ctx.fillText(certificateNumber, 1090, 1008);
  clearShadow();

  // ===== OTHER TEXT =====
  // Score
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "57px MyCustomFont"; // Use the unique name
  ctx.fillText(`${score}%`, 1751, 913);

  // Grade
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px MyCustomFont"; // Use the unique name
  ctx.fillText(grade.toUpperCase(), 1753, 961);

  // Date
  ctx.fillStyle = "#0e0e0e";
  ctx.font = "18px MyCustomFont"; // Use the unique name
  const dateStr = completedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillText(`Issued on ${dateStr}`, 160, 1050);

  const pngBuffer = canvas.toBuffer("image/png");
  const webpBuffer = await sharp(pngBuffer)
    .webp({ quality: 90, effort: 6 })
    .toBuffer();

  return webpBuffer;
}

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

// Run test
async function test() {
  console.log("🎨 Generating test certificate...");

  try {
    const certificateBuffer = await createCertificate(testData);
    fs.writeFileSync(OUTPUT_PATH, certificateBuffer);
    console.log(`✅ Certificate saved to: ${OUTPUT_PATH}`);
    console.log(
      `📏 File size: ${(certificateBuffer.length / 1024).toFixed(2)} KB`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

test();
