// backend/scripts/createSecureWallet.js
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

function generateStrongPassword(length = 64) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

async function createSecureWallet() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔐 SECURE WALLET CREATION FOR LIZARD ACADEMY");
  console.log("═══════════════════════════════════════════════════════\n");

  // Auto-generate secure password
  const password = generateStrongPassword(64);
  console.log("✅ Generated secure 64-character password\n");
  console.log("⚠️  SAVE THIS PASSWORD - NEEDED TO START THE SERVER!\n");
  console.log("PASSWORD:", password);
  console.log("\n⚠️  Copy this password NOW and save it!\n");

  await question("Press Enter once you have saved the password...");

  console.log("\n📝 Creating new wallet...");

  // Create random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("\n✅ Wallet created!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("⚠️  CRITICAL: SAVE THIS INFORMATION");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Wallet Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("\nMnemonic (Backup Recovery Phrase):");
  console.log(wallet.mnemonic.phrase);
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n⚠️  Write down the mnemonic phrase on paper as backup!\n");

  await question("Press Enter once you have saved the mnemonic...");

  // Save in project directory (secure location)
  const savePath = path.join(__dirname, "../../secure/wallet.json");
  const dir = path.dirname(savePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n✅ Created directory: ${dir}`);
  }

  // Encrypt wallet - simpler approach without progress callback
  console.log("\n🔒 Encrypting wallet (takes 20-30 seconds)...");

  try {
    // Use just password, no options - simplest approach
    const encryptedJson = await wallet.encrypt(password);

    // Save encrypted wallet
    fs.writeFileSync(savePath, encryptedJson);

    console.log("\n✅ Encrypted wallet saved!");
    console.log("Location:", savePath);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 ADD TO YOUR backend/.env FILE:");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`WALLET_FILE_PATH=${savePath}`);
    console.log(`WALLET_PASSWORD=${password}`);
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📋 NEXT STEPS:");
    console.log("1. Add the above lines to backend/.env file");
    console.log("2. Fund this wallet with STT tokens:");
    console.log("   Wallet Address:", wallet.address);
    console.log("   Use Somnia testnet faucet");
    console.log("3. Add your contract address to .env:");
    console.log("   CERTIFICATE_CONTRACT_ADDRESS=0xYourContractAddress");
    console.log("4. Add Somnia configuration to .env:");
    console.log("   BLOCKCHAIN_NETWORK=testnet");
    console.log("   BLOCKCHAIN_RPC_URL=https://dream-rpc.somnia.network/");
    console.log("5. Start your backend server\n");

    console.log("⚠️  SECURITY REMINDERS:");
    console.log("• Password is shown above - copy it now!");
    console.log("• Mnemonic phrase should be on paper");
    console.log("• Never commit secure/ folder to git");
    console.log("• Never commit .env file to git");
    console.log("• Check .gitignore includes: .env and secure/\n");
  } catch (error) {
    console.error("\n❌ Encryption failed:", error.message);
    console.log("\n📝 Fallback: Creating unencrypted wallet JSON...");

    // Fallback: Save as simple JSON (for development only)
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    };

    const fallbackPath = path.join(
      __dirname,
      "../../secure/wallet-unencrypted.json"
    );
    fs.writeFileSync(fallbackPath, JSON.stringify(walletData, null, 2));

    console.log("✅ Unencrypted wallet saved to:", fallbackPath);
    console.log("\n⚠️  WARNING: This wallet is NOT encrypted!");
    console.log("⚠️  Only use for local testing, never in production!");
    console.log("\n📝 ADD TO YOUR backend/.env FILE:");
    console.log("BLOCKCHAIN_PRIVATE_KEY=" + wallet.privateKey);
    console.log(
      "\n⚠️  Use BLOCKCHAIN_PRIVATE_KEY instead of WALLET_FILE_PATH for now"
    );
  }

  rl.close();
  process.exit(0);
}

createSecureWallet().catch((error) => {
  console.error("❌ Error:", error);
  rl.close();
  process.exit(1);
});
