const mongoose = require("mongoose");
const PaymentToken = require("../models/PaymentToken");
require("dotenv").config();

async function addSepoliaUSDC() {
  await mongoose.connect(process.env.MONGODB_URI);

  const usdcToken = {
    // Token identification
    symbol: "USDC",
    name: "USD Coin",
    icon: "💵", // or use URL: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"

    // Blockchain configuration
    blockchain: "evm", // NOT "ethereum" - must be "evm" or "solana"
    chainId: 11155111,
    chainName: "Sepolia Testnet",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",

    // Token contract details
    contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
    decimals: 6,
    isNative: false,

    // Payment contract (use your wallet for testing)
    paymentContractAddress: "0xcb05D123A5ad24C09273698fC16aAEF3784717cf", // Replace with your address from Remix

    // Price oracle configuration
    isStablecoin: true,
    priceOracleType: "fixed", // Required field
    fixedUsdPrice: 1.0,

    // Status
    isActive: true,
    isEnabled: true,

    // Display settings
    displayOrder: 1,
    color: "#2775CA", // USDC blue
    badge: "Testnet",
  };

  try {
    const existingToken = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    if (existingToken) {
      console.log("⚠️  USDC already exists, updating...");
      await PaymentToken.findByIdAndUpdate(existingToken._id, usdcToken);
      console.log("✅ Sepolia USDC updated in database");
    } else {
      await PaymentToken.create(usdcToken);
      console.log("✅ Sepolia USDC added to database");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  process.exit(0);
}

addSepoliaUSDC().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
