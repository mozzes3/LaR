require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
const { ethers } = require("ethers");

async function checkOwnership() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

  // Competency NFT
  const competencyAddress = process.env.COMPETENCY_NFT_CONTRACT_ADDRESS;
  const competencyABI = ["function owner() view returns (address)"];
  const competencyContract = new ethers.Contract(
    competencyAddress,
    competencyABI,
    provider
  );
  const competencyOwner = await competencyContract.owner();

  console.log("🔍 COMPETENCY NFT CONTRACT");
  console.log("Contract:", competencyAddress);
  console.log("Owner:", competencyOwner);
  console.log(
    "Current Wallet:",
    process.env.WALLET_FILE_PATH ? "Using local file" : "N/A"
  );
  console.log("");

  // Professional Certificate
  const profAddress = process.env.PROFESSIONAL_CERT_CONTRACT_ADDRESS;
  const profABI = [
    "function academy() view returns (address)",
    "function authorizedIssuers(address) view returns (bool)",
  ];
  const profContract = new ethers.Contract(profAddress, profABI, provider);
  const academy = await profContract.academy();

  console.log("🔍 PROFESSIONAL CERTIFICATE CONTRACT");
  console.log("Contract:", profAddress);
  console.log("Academy:", academy);

  // Load current wallet to check authorization
  const fs = require("fs");
  const encryptedJson = fs.readFileSync(process.env.WALLET_FILE_PATH, "utf8");
  const wallet = await ethers.Wallet.fromEncryptedJson(
    encryptedJson,
    process.env.WALLET_PASSWORD
  );

  const isAuthorized = await profContract.authorizedIssuers(wallet.address);
  console.log("Current Wallet:", wallet.address);
  console.log("Is Authorized:", isAuthorized ? "✅ YES" : "❌ NO");
}

checkOwnership().catch(console.error);
