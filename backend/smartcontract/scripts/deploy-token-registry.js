const hre = require("hardhat");

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🚀 DEPLOYING TOKEN REGISTRY CONTRACT");
  console.log("═══════════════════════════════════════════════════════\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );

  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // Deploy TokenRegistry
  console.log("\n📋 Deploying TokenRegistry...");
  const TokenRegistry = await hre.ethers.getContractFactory("TokenRegistry");
  const registry = await TokenRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ TokenRegistry deployed to:", registryAddress);

  // Verify deployer has admin role
  const ADMIN_ROLE = await registry.ADMIN_ROLE();
  const hasAdminRole = await registry.hasRole(ADMIN_ROLE, deployer.address);
  console.log("✅ Deployer has ADMIN_ROLE:", hasAdminRole);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📋 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Registry Address: ${registryAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Add this address to backend/.env:");
  console.log(
    `   TOKEN_REGISTRY_${network.name.toUpperCase()}=${registryAddress}`
  );
  console.log("\n2. Add approved tokens using multisig:");
  console.log(
    "   await registry.addToken('USDT', usdtAddress, escrowAddress, chainId)"
  );
  console.log("\n3. Verify contract on explorer:");
  console.log(
    `   npx hardhat verify --network ${network.name} ${registryAddress}`
  );
  const deployedCode = await hre.ethers.provider.getCode(registryAddress);
  const codeHash = hre.ethers.keccak256(deployedCode);

  console.log("\n🔐 CONTRACT VERIFICATION DATA:");
  console.log("═══════════════════════════════════════════════════════");
  console.log(
    "Add this to backend/modules/payment/config/registryAddresses.js:"
  );
  console.log(`
  ${network.chainId}: {
    address: "${registryAddress}",
    deploymentBlock: ${await hre.ethers.provider.getBlockNumber()},
    codeHash: "${codeHash}",
  },
`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
