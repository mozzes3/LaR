const hre = require("hardhat");

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🚀 DEPLOYING COURSE PAYMENT ESCROW CONTRACT");
  console.log("═══════════════════════════════════════════════════════\n");

  // Configuration - CHANGE THESE VALUES
  const config = {
    // Token configuration
    paymentToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
    tokenSymbol: "USDT",

    // Platform wallets
    platformWallet: "0xYourPlatformWalletAddress", // CHANGE THIS
    revenueSplitWallet: "0xYourRevenueSplitWalletAddress", // CHANGE THIS

    // Fee percentages (in basis points: 2000 = 20%)
    platformFeePercentage: 2000, // 20%
    revenueSplitPercentage: 2000, // 20% of platform fee
  };

  console.log("📋 Configuration:");
  console.log(`   Token: ${config.tokenSymbol} (${config.paymentToken})`);
  console.log(`   Platform Wallet: ${config.platformWallet}`);
  console.log(`   Revenue Split Wallet: ${config.revenueSplitWallet}`);
  console.log(
    `   Platform Fee: ${config.platformFeePercentage / 100}%`
  );
  console.log(
    `   Revenue Split: ${config.revenueSplitPercentage / 100}% of platform fee\n`
  );

  // Validate configuration
  if (
    config.platformWallet === "0xYourPlatformWalletAddress" ||
    config.revenueSplitWallet === "0xYourRevenueSplitWalletAddress"
  ) {
    console.error("❌ ERROR: Please configure wallet addresses in the script!");
    process.exit(1);
  }

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(
    "💰 Account balance:",
    hre.ethers.formatEther(balance),
    "ETH\n"
  );

  if (balance === 0n) {
    console.error("❌ ERROR: Deployer account has no ETH for gas!");
    process.exit(1);
  }

  // Deploy contract
  console.log("🔄 Deploying CoursePaymentEscrow...");

  const CoursePaymentEscrow = await hre.ethers.getContractFactory(
    "CoursePaymentEscrow"
  );

  const escrow = await CoursePaymentEscrow.deploy(
    config.paymentToken,
    config.platformWallet,
    config.revenueSplitWallet,
    config.platformFeePercentage,
    config.revenueSplitPercentage
  );

  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();

  console.log("✅ Contract deployed at:", escrowAddress);
  console.log("📦 Transaction hash:", escrow.deploymentTransaction().hash);
  console.log(
    "🏗️  Block number:",
    escrow.deploymentTransaction().blockNumber,
    "\n"
  );

  // Get operator role hash
  const operatorRole = await escrow.OPERATOR_ROLE();
  const adminRole = await escrow.ADMIN_ROLE();

  console.log("🔑 Role Hashes:");
  console.log(`   OPERATOR_ROLE: ${operatorRole}`);
  console.log(`   ADMIN_ROLE: ${adminRole}\n`);

  // Wait for block confirmations
  console.log("⏳ Waiting for 5 block confirmations...");
  await escrow.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!\n");

  // Verify contract on Etherscan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [
          config.paymentToken,
          config.platformWallet,
          config.revenueSplitWallet,
          config.platformFeePercentage,
          config.revenueSplitPercentage,
        ],
      });
      console.log("✅ Contract verified on Etherscan!\n");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later\n");
    }
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📋 NEXT STEPS:\n");

  console.log("1. Add this contract to your backend database:");
  console.log("   POST /api/admin/payment/tokens");
  console.log("   {");
  console.log(`     "symbol": "${config.tokenSymbol}",`);
  console.log(`     "paymentContractAddress": "${escrowAddress}",`);
  console.log("     ... other token fields");
  console.log("   }\n");

  console.log("2. Grant OPERATOR_ROLE to your backend wallet:");
  console.log(`   escrow.grantRole("${operatorRole}", "0xBackendWallet");\n`);

  console.log("3. Fund the backend wallet with ETH for gas\n");

  console.log("4. Test the payment flow:");
  console.log("   • Small test purchase");
  console.log("   • Verify escrow creation");
  console.log("   • Test refund");
  console.log("   • Test escrow release\n");

  console.log("5. Monitor the contract:");
  console.log(`   Explorer: https://etherscan.io/address/${escrowAddress}`);
  console.log("   • Watch for events");
  console.log("   • Track total locked funds");
  console.log("   • Monitor gas usage\n");

  console.log("⚠️  SECURITY CHECKLIST:");
  console.log("   □ Smart contract audited");
  console.log("   □ Backend wallet encrypted and secured");
  console.log("   □ Platform wallets controlled by multisig");
  console.log("   □ Rate limiting enabled on API");
  console.log("   □ Monitoring and alerts set up");
  console.log("   □ Emergency pause plan in place\n");

  console.log("═══════════════════════════════════════════════════════");
  console.log(`📋 Contract Address: ${escrowAddress}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
