// backend/scripts/testBlockchain.js
require("dotenv").config();
const { getBlockchainService } = require("../services/blockchainService");

async function test() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔍 TESTING SOMNIA BLOCKCHAIN CONNECTION");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    console.log("🔧 Initializing blockchain service...");
    const service = getBlockchainService();

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("✅ Blockchain service initialized\n");

    // Check network
    console.log("📡 Network Information:");
    const networkInfo = await service.getNetworkInfo();
    console.log("   Name:", networkInfo.name);
    console.log("   Chain ID:", networkInfo.chainId);
    console.log("   Symbol:", networkInfo.symbol);

    // Check balance
    console.log("\n💰 Wallet Balance:");
    const balance = await service.getWalletBalance();
    console.log("   Balance:", balance, networkInfo.symbol);

    if (parseFloat(balance) < 0.01) {
      console.log(
        "   ⚠️  WARNING: Balance is low! Fund your wallet with testnet tokens."
      );
      console.log("   Get tokens from Somnia testnet faucet");
    } else {
      console.log("   ✅ Balance looks good!");
    }

    // Check gas price
    console.log("\n⛽ Gas Information:");
    const gasPrice = await service.getGasPrice();
    console.log("   Gas Price:", gasPrice, "gwei");

    // Estimate cost per certificate
    const estimatedGas = 180000;
    const gasPriceWei = parseFloat(gasPrice) * 1e9;
    const costPerCert = (estimatedGas * gasPriceWei) / 1e18;
    console.log(
      "   Estimated cost per certificate:",
      costPerCert.toFixed(8),
      networkInfo.symbol
    );

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ ALL CHECKS PASSED!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n📋 Summary:");
    console.log(
      "• Network:",
      networkInfo.name,
      "(Chain ID:",
      networkInfo.chainId + ")"
    );
    console.log("• Wallet Balance:", balance, networkInfo.symbol);
    console.log(
      "• Contract Address:",
      process.env.CERTIFICATE_CONTRACT_ADDRESS
    );
    console.log("• RPC URL:", process.env.BLOCKCHAIN_RPC_URL);

    console.log("\n🎉 Your blockchain integration is ready!");
    console.log(
      "Next step: Start your backend server and generate a test certificate.\n"
    );
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\n🔍 Troubleshooting:");
    console.error("1. Check .env file has all required values");
    console.error("2. Verify WALLET_PASSWORD is wrapped in quotes");
    console.error(
      "3. Check wallet file exists at:",
      process.env.WALLET_FILE_PATH
    );
    console.error("4. Ensure wallet is funded with STT tokens");
    console.error("5. Verify contract address is correct");
    console.error("6. Check RPC URL is accessible\n");

    if (error.message.includes("insufficient funds")) {
      console.error(
        "💡 TIP: Your wallet needs STT tokens. Use Somnia testnet faucet.\n"
      );
    }
    if (error.message.includes("incorrect password")) {
      console.error(
        "💡 TIP: Check WALLET_PASSWORD in .env (wrap in quotes if it has < or > characters)\n"
      );
    }

    process.exit(1);
  }
}

test();
