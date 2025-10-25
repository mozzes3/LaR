const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const PaymentToken = require("../../modules/payment/models/PaymentToken");
const { ethers } = require("ethers");

async function verifyFinalSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔍 Verifying FINAL payment setup...\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const token = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    const EXPECTED_ESCROW = "0xef771cb25BAF2285409345914f3c0a671ea04968";
    const EXPECTED_REGISTRY = "0x8ad283e6f2DB1E31de1D3b1Cae59629698B4Fff7";

    console.log("\n1️⃣ DATABASE CHECK:");
    console.log("   Token Contract:", token.contractAddress);
    console.log("   Escrow Contract:", token.paymentContractAddress);
    console.log("   Registry Contract:", token.registryContractAddress);

    if (
      token.paymentContractAddress.toLowerCase() !==
      EXPECTED_ESCROW.toLowerCase()
    ) {
      console.error("\n❌ Wrong escrow in database!");
      process.exit(1);
    }

    if (
      token.registryContractAddress.toLowerCase() !==
      EXPECTED_REGISTRY.toLowerCase()
    ) {
      console.error("\n❌ Wrong registry in database!");
      process.exit(1);
    }

    console.log("   ✅ Database is correct");

    // Check registry on-chain
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_SEPOLIA
    );

    const registryABI = [
      "function verifyToken(string symbol, address tokenAddress, address escrowAddress, uint256 chainId) view returns (bool)",
      "function getToken(string symbol, uint256 chainId) view returns (tuple(address tokenAddress, address escrowAddress, uint256 chainId, bool isActive, uint256 addedAt, uint256 deactivatedAt))",
    ];

    console.log("\n2️⃣ TOKEN REGISTRY CHECK:");
    const registry = new ethers.Contract(
      EXPECTED_REGISTRY,
      registryABI,
      provider
    );

    const tokenInfo = await registry.getToken("USDC", 11155111);
    console.log("   Registry Token:", tokenInfo.tokenAddress);
    console.log("   Registry Escrow:", tokenInfo.escrowAddress);
    console.log("   Is Active:", tokenInfo.isActive);

    if (
      tokenInfo.escrowAddress.toLowerCase() !== EXPECTED_ESCROW.toLowerCase()
    ) {
      console.error("\n❌ Registry has wrong escrow!");
      process.exit(1);
    }

    if (!tokenInfo.isActive) {
      console.error("\n❌ Token is not active in registry!");
      process.exit(1);
    }

    const isValid = await registry.verifyToken(
      "USDC",
      token.contractAddress,
      EXPECTED_ESCROW,
      11155111
    );

    if (!isValid) {
      console.error("\n❌ Token verification failed!");
      process.exit(1);
    }

    console.log("   ✅ Registry is correct");

    // Check escrow contract
    console.log("\n3️⃣ ESCROW CONTRACT CHECK:");

    const code = await provider.getCode(EXPECTED_ESCROW);
    if (code === "0x") {
      console.error("   ❌ Escrow is not a contract!");
      process.exit(1);
    }

    console.log("   ✅ Escrow is deployed");

    const escrowABI = [
      "function OPERATOR_ROLE() view returns (bytes32)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
    ];

    const escrow = new ethers.Contract(EXPECTED_ESCROW, escrowABI, provider);

    const operatorRole = await escrow.OPERATOR_ROLE();
    const operatorWallet = process.env.OPERATOR_WALLET_ADDRESS;
    const hasRole = await escrow.hasRole(operatorRole, operatorWallet);

    console.log("\n4️⃣ OPERATOR ROLE CHECK:");
    console.log("   Operator Wallet:", operatorWallet);
    console.log("   Has OPERATOR_ROLE:", hasRole ? "✅ YES" : "❌ NO");

    if (!hasRole) {
      console.error("\n❌ Operator doesn't have required role!");
      process.exit(1);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅✅✅ ALL CHECKS PASSED! ✅✅✅");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎯 SYSTEM IS READY FOR TESTING!");
    console.log("\n📋 Summary:");
    console.log("   • New Escrow:", EXPECTED_ESCROW);
    console.log("   • New Registry:", EXPECTED_REGISTRY);
    console.log("   • Operator has role: YES");
    console.log("   • Token verified: YES");
    console.log("\n▶️  Restart backend and test purchase!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:");
    console.error("   Error:", error.message);
    process.exit(1);
  }
}

verifyFinalSetup();
