#!/usr/bin/env node

/**
 * Secure Payment Wallet Creation Script
 * Creates an encrypted wallet for payment operations
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createSecurePaymentWallet() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔐 SECURE PAYMENT WALLET CREATION");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    // Generate strong password
    console.log("📝 Password Requirements:");
    console.log("  • Minimum 20 characters");
    console.log("  • Mix of uppercase, lowercase, numbers, symbols");
    console.log("  • DO NOT lose this password!\n");

    const password = await question("Enter encryption password: ");

    if (password.length < 20) {
      console.log("❌ Password must be at least 20 characters");
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question("Confirm password: ");

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      rl.close();
      process.exit(1);
    }

    console.log("\n🔄 Generating high-entropy wallet...");

    // Generate wallet with high entropy
    const wallet = ethers.Wallet.createRandom();

    console.log("✅ Wallet generated!\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("⚠️  CRITICAL - WRITE THIS DOWN NOW:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n📍 Wallet Address:");
    console.log(wallet.address);
    console.log("\n🔑 Mnemonic Phrase (24 words):");
    console.log(wallet.mnemonic.phrase);
    console.log("\n⚠️  Write the mnemonic on PAPER");
    console.log("⚠️  Store in a SECURE location (safe, vault)");
    console.log("⚠️  NEVER share with anyone");
    console.log("⚠️  This is the ONLY backup if password is lost\n");

    const confirmed = await question(
      "Have you written down the mnemonic? (yes/no): "
    );

    if (confirmed.toLowerCase() !== "yes") {
      console.log("\n❌ Please write down your mnemonic before continuing");
      rl.close();
      process.exit(1);
    }

    // Create secure directory
    const secureDir = path.join(__dirname, "../../secure");
    if (!fs.existsSync(secureDir)) {
      fs.mkdirSync(secureDir, { mode: 0o700 });
      console.log(`\n📁 Created secure directory: ${secureDir}`);
    }

    // Encrypt wallet
    console.log("\n🔐 Encrypting wallet... (this may take 30-60 seconds)");

    const encryptedJson = await wallet.encrypt(password, {
      scrypt: {
        N: 131072, // Higher than default for extra security
      },
    });

    // Save encrypted wallet
    const filename = `payment-wallet.json.enc`;
    const savePath = path.join(secureDir, filename);

    fs.writeFileSync(savePath, encryptedJson);
    fs.chmodSync(savePath, 0o600); // Read/write for owner only

    console.log("\n✅ Encrypted wallet saved!");
    console.log("Location:", savePath);

    // Create backup with timestamp
    const backupFilename = `payment-wallet-backup-${Date.now()}.json.enc`;
    const backupPath = path.join(secureDir, backupFilename);
    fs.writeFileSync(backupPath, encryptedJson);
    fs.chmodSync(backupPath, 0o600);

    console.log("Backup saved:", backupPath);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 ADD TO YOUR backend/.env FILE:");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`PAYMENT_WALLET_FILE_PATH=${savePath}`);
    console.log(`PAYMENT_WALLET_PASSWORD="${password}"`);
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📋 NEXT STEPS:\n");
    console.log("1. Add the above lines to your backend/.env file");
    console.log("2. Fund this wallet with native token for gas fees:");
    console.log(`   Address: ${wallet.address}`);
    console.log("   • Ethereum: Need ETH for gas");
    console.log("   • Polygon: Need MATIC for gas");
    console.log("   • BSC: Need BNB for gas");
    console.log("3. Deploy escrow smart contracts");
    console.log("4. Configure payment tokens in admin panel");
    console.log("5. Test with small amounts first\n");

    console.log("⚠️  SECURITY REMINDERS:");
    console.log("• Mnemonic phrase is on PAPER in secure location");
    console.log("• Password is in .env file (never commit to git)");
    console.log("• Wallet file is encrypted with AES-256");
    console.log("• Keep backup wallet file in separate secure location");
    console.log("• Consider using hardware wallet for production");
    console.log("• Regular security audits recommended\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ WALLET CREATION COMPLETE");
    console.log("═══════════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

createSecurePaymentWallet().catch((error) => {
  console.error("❌ Fatal error:", error);
  rl.close();
  process.exit(1);
});
