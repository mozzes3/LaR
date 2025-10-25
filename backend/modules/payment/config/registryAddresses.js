/**
 * CRITICAL: Registry addresses are HARDCODED and committed to git
 * .env variables are ONLY used for local development overrides
 * Production ALWAYS uses these addresses
 */

const REGISTRY_ADDRESSES = Object.freeze({
  // ONE registry per network (each registry can handle multiple tokens on that network)
  1: {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    deploymentBlock: 12345678,
    codeHash: "0xabc123...",
    network: "Ethereum Mainnet",
  },
  11155111: {
    address: "0x206b33C964E95D987cFc45613FCE20fE14844E17",
    deploymentBlock: 9482591,
    codeHash:
      "0x5dc1d99a1129d1f9556b6e552c70d364357804a8b4b17c4cfd01e3cd6b870170",
    network: "Sepolia Testnet",
  },
  137: {
    address: "0x...",
    deploymentBlock: 12345678,
    codeHash: "0x...",
    network: "Polygon",
  },
});

/**
 * Get registry address with security checks
 */
function getRegistryAddress(chainId) {
  const config = REGISTRY_ADDRESSES[chainId];

  if (!config) {
    throw new Error(`No registry configured for chain ${chainId}`);
  }

  // In production: NEVER use env variables
  if (process.env.NODE_ENV === "production") {
    console.log(
      `🔒 Using HARDCODED registry for chain ${chainId}: ${config.address}`
    );
    return config;
  }

  // In development: Allow env override BUT log warning
  const envKey = `TOKEN_REGISTRY_${getNetworkName(chainId)}`;
  const envAddress = process.env[envKey];

  if (envAddress && envAddress !== config.address) {
    console.warn("⚠️  WARNING: Using .env registry override in development");
    console.warn(`   Hardcoded: ${config.address}`);
    console.warn(`   Override:  ${envAddress}`);
    return {
      address: envAddress,
      deploymentBlock: config.deploymentBlock,
      codeHash: null, // Skip verification for dev override
    };
  }

  return config;
}

function getNetworkName(chainId) {
  const names = {
    1: "MAINNET",
    11155111: "SEPOLIA",
    137: "POLYGON",
  };
  return names[chainId] || "UNKNOWN";
}

module.exports = {
  REGISTRY_ADDRESSES,
  getRegistryAddress,
};
