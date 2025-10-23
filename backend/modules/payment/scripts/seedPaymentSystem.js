const mongoose = require("mongoose");
require("dotenv").config();
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");

async function seedPaymentSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("🌱 SEEDING PAYMENT SYSTEM");
    console.log("═══════════════════════════════════════════════════════\n");

    // Clear existing data
    await PaymentToken.deleteMany({});
    console.log("🗑️  Cleared existing payment tokens\n");

    // Sample payment tokens (UPDATE WITH YOUR DEPLOYED CONTRACT ADDRESSES)
    const tokens = [
      {
        symbol: "USDT",
        name: "Tether USD",
        icon: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        blockchain: "evm",
        chainId: 1,
        chainName: "Ethereum Mainnet",
        rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
        explorerUrl: "https://etherscan.io",
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        isNative: false,
        paymentContractAddress: "0x0000000000000000000000000000000000000000", // UPDATE THIS
        isStablecoin: true,
        priceOracleType: "fixed",
        fixedUsdPrice: 1.0,
        isActive: true,
        isEnabled: true,
        displayOrder: 1,
        color: "#26A17B",
        badge: "Most Popular",
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        blockchain: "evm",
        chainId: 1,
        chainName: "Ethereum Mainnet",
        rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
        explorerUrl: "https://etherscan.io",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        isNative: false,
        paymentContractAddress: "0x0000000000000000000000000000000000000000", // UPDATE THIS
        isStablecoin: true,
        priceOracleType: "fixed",
        fixedUsdPrice: 1.0,
        isActive: true,
        isEnabled: true,
        displayOrder: 2,
        color: "#2775CA",
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        blockchain: "evm",
        chainId: 1,
        chainName: "Ethereum Mainnet",
        rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
        explorerUrl: "https://etherscan.io",
        contractAddress: "0x0000000000000000000000000000000000000000", // Native ETH wrapped
        decimals: 18,
        isNative: true,
        paymentContractAddress: "0x0000000000000000000000000000000000000000", // UPDATE THIS
        isStablecoin: false,
        priceOracleType: "coingecko",
        coingeckoId: "ethereum",
        fixedUsdPrice: 2000, // Fallback price
        isActive: false, // Disable until contract deployed
        isEnabled: false,
        displayOrder: 3,
        color: "#627EEA",
      },
    ];

    // Insert tokens
    const insertedTokens = await PaymentToken.insertMany(tokens);
    console.log(`✅ Created ${insertedTokens.length} payment tokens:\n`);

    for (const token of insertedTokens) {
      console.log(`   ${token.symbol} (${token.name})`);
      console.log(`   • Blockchain: ${token.blockchain} (Chain ID: ${token.chainId})`);
      console.log(`   • Contract: ${token.contractAddress}`);
      console.log(`   • Escrow: ${token.paymentContractAddress}`);
      console.log(`   • Active: ${token.isActive}\n`);
    }

    // Initialize platform settings
    const settings = await PlatformSettings.getSettings();
    
    // Update with initial values
    settings.defaultPlatformFeePercentage = 20;
    settings.defaultInstructorFeePercentage = 80;
    settings.revenueSplitPercentage = 20;
    settings.defaultEscrowPeriodDays = 14;
    settings.defaultMinWatchPercentage = 20;
    settings.defaultMaxWatchTimeMinutes = 30;

    // Set default wallets (UPDATE THESE)
    settings.platformWallets.set("evm", "0x0000000000000000000000000000000000000000"); // UPDATE
    settings.revenueSplitWallets.set("evm", "0x0000000000000000000000000000000000000000"); // UPDATE

    await settings.save();

    console.log("✅ Platform settings initialized:\n");
    console.log(`   Platform Fee: ${settings.defaultPlatformFeePercentage}%`);
    console.log(`   Instructor Fee: ${settings.defaultInstructorFeePercentage}%`);
    console.log(`   Revenue Split: ${settings.revenueSplitPercentage}% of platform fee`);
    console.log(`   Escrow Period: ${settings.defaultEscrowPeriodDays} days`);
    console.log(`   Min Watch %: ${settings.defaultMinWatchPercentage}%`);
    console.log(`   Max Watch Time: ${settings.defaultMaxWatchTimeMinutes} minutes\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ PAYMENT SYSTEM SEEDED");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("⚠️  NEXT STEPS:\n");
    console.log("1. Deploy escrow smart contracts for each token");
    console.log("2. Update paymentContractAddress in database");
    console.log("3. Update platformWallets and revenueSplitWallets");
    console.log("4. Set isActive: true for tokens once contracts deployed");
    console.log("5. Test payment flow with small amounts\n");

    console.log("Update tokens via API:");
    console.log("PUT /api/admin/payment/tokens/:tokenId");
    console.log("{\n  \"paymentContractAddress\": \"0x...\",\n  \"isActive\": true\n}\n");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedPaymentSystem();
