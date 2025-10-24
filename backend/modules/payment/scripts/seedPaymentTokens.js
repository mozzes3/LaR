require("dotenv").config();
const mongoose = require("mongoose");
const PaymentToken = require("../models/PaymentToken");

const SEPOLIA_USDC_TOKEN = {
  symbol: "USDC",
  name: "USD Coin",
  icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  blockchain: "evm",
  chainId: 11155111,
  chainName: "Sepolia Testnet",
  rpcUrl:
    process.env.ETHEREUM_RPC_SEPOLIA ||
    "https://eth-sepolia.g.alchemy.com/v2/lkDjfzyweZencyStM6rQ_",
  explorerUrl: "https://sepolia.etherscan.io",
  contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  decimals: 6,
  isNative: false,
  paymentContractAddress: "0xe63e052b7853ddbf80896e00e770be4d02412dd5",
  isStablecoin: true,
  priceOracleType: "fixed",
  fixedUsdPrice: 1.0,
  isActive: true,
  isEnabled: true,
  displayOrder: 1,
  color: "#2775CA",
  badge: "Testnet",
};

async function seedPaymentTokens() {
  try {
    console.log("🌱 Seeding payment tokens...");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    // Check if token already exists
    const existing = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    if (existing) {
      console.log("⚠️  USDC Sepolia token already exists, updating...");
      await PaymentToken.findByIdAndUpdate(existing._id, SEPOLIA_USDC_TOKEN);
      console.log("✅ Token updated");
    } else {
      await PaymentToken.create(SEPOLIA_USDC_TOKEN);
      console.log("✅ USDC Sepolia token created");
    }

    console.log("\n📋 Token Details:");
    console.log("   Symbol:", SEPOLIA_USDC_TOKEN.symbol);
    console.log("   Chain:", SEPOLIA_USDC_TOKEN.chainName);
    console.log("   Token Contract:", SEPOLIA_USDC_TOKEN.contractAddress);
    console.log(
      "   Escrow Contract:",
      SEPOLIA_USDC_TOKEN.paymentContractAddress
    );
    console.log("   RPC:", SEPOLIA_USDC_TOKEN.rpcUrl);

    await mongoose.disconnect();
    console.log("\n✅ Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedPaymentTokens();
