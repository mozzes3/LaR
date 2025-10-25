const hre = require("hardhat");

// CONFIGURATION - UPDATE THESE
const REGISTRY_ADDRESS = process.env.TOKEN_REGISTRY_MAINNET || "0x...";

const TOKENS = [
  {
    symbol: "USDT",
    tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
    escrowAddress: "0x...", // Your escrow contract
    chainId: 1,
  },
  {
    symbol: "USDC",
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet USDC
    escrowAddress: "0x...", // Your escrow contract
    chainId: 1,
  },
  // Add more tokens here
];

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔐 ADDING TOKENS TO REGISTRY");
  console.log("═══════════════════════════════════════════════════════\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  const TokenRegistry = await hre.ethers.getContractFactory("TokenRegistry");
  const registry = TokenRegistry.attach(REGISTRY_ADDRESS);

  console.log("Registry address:", REGISTRY_ADDRESS);

  // Verify signer has admin role
  const ADMIN_ROLE = await registry.ADMIN_ROLE();
  const hasAdminRole = await registry.hasRole(ADMIN_ROLE, signer.address);

  if (!hasAdminRole) {
    console.error("❌ Signer does not have ADMIN_ROLE");
    process.exit(1);
  }

  console.log("✅ Signer has ADMIN_ROLE\n");

  // Add each token
  for (const token of TOKENS) {
    console.log(`📝 Adding ${token.symbol}...`);
    console.log(`   Token: ${token.tokenAddress}`);
    console.log(`   Escrow: ${token.escrowAddress}`);
    console.log(`   Chain: ${token.chainId}`);

    try {
      const tx = await registry.addToken(
        token.symbol,
        token.tokenAddress,
        token.escrowAddress,
        token.chainId // Now required parameter
      );

      console.log(`   TX: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ ${token.symbol} added successfully\n`);
    } catch (error) {
      if (error.message.includes("Token exists")) {
        console.log(`   ⚠️  ${token.symbol} already exists\n`);
      } else {
        console.error(
          `   ❌ Failed to add ${token.symbol}:`,
          error.message,
          "\n"
        );
      }
    }
  }

  // Verify all tokens
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔍 VERIFYING TOKENS");
  console.log("═══════════════════════════════════════════════════════\n");

  for (const token of TOKENS) {
    const isVerified = await registry.verifyToken(
      token.symbol,
      token.tokenAddress,
      token.escrowAddress
    );
    console.log(`${token.symbol}: ${isVerified ? "✅ VERIFIED" : "❌ FAILED"}`);
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ ALL TOKENS PROCESSED");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
