require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
const { ethers } = require("ethers");
const fs = require("fs");

async function extractPrivateKey() {
  try {
    const walletPath = process.env.WALLET_FILE_PATH;
    const password = process.env.WALLET_PASSWORD;

    if (!walletPath || !password) {
      throw new Error("WALLET_FILE_PATH or WALLET_PASSWORD not set in .env");
    }

    console.log("🔐 Extracting private key from encrypted wallet...\n");

    const encryptedJson = fs.readFileSync(walletPath, "utf8");
    const wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedJson,
      password
    );

    console.log("✅ Wallet decrypted successfully\n");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 WALLET INFORMATION");
    console.log("═══════════════════════════════════════════════════════");
    console.log("Address:", wallet.address);
    console.log("Private Key:", wallet.privateKey);
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n⚠️  KEEP THIS PRIVATE KEY SECURE - DO NOT SHARE\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

extractPrivateKey();
