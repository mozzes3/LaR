const hre = require("hardhat");

async function main() {
  const REGISTRY_ADDRESS = process.env.TOKEN_REGISTRY_MAINNET;

  // Token to add
  const TOKEN = {
    symbol: "DAI",
    tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    escrowAddress: "0x...",
    chainId: 1,
  };

  console.log("Preparing addToken transaction...");

  const TokenRegistry = await hre.ethers.getContractFactory("TokenRegistry");
  const registry = TokenRegistry.attach(REGISTRY_ADDRESS);

  // Generate transaction data (don't execute)
  const txData = registry.interface.encodeFunctionData("addToken", [
    TOKEN.symbol,
    TOKEN.tokenAddress,
    TOKEN.escrowAddress,
    TOKEN.chainId,
  ]);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📋 TRANSACTION DATA FOR GNOSIS SAFE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`To: ${REGISTRY_ADDRESS}`);
  console.log(`Data: ${txData}`);
  console.log(`Value: 0`);
  console.log("\nSteps:");
  console.log("1. Go to https://app.safe.global");
  console.log("2. Connect your Ledger");
  console.log("3. New Transaction → Contract Interaction");
  console.log("4. Paste above data");
  console.log("5. Sign with Ledger");
  console.log("6. Wait for other signers");
  console.log("7. Execute");
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch(console.error);
