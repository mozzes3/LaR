require("dotenv").config();
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { ethers } = require("ethers");

async function testOperatorWallet() {
  try {
    console.log("🔐 Testing AWS Secrets Manager...\n");

    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    const secretName = `payment-operator-${
      process.env.ACTIVE_NETWORK || "sepolia"
    }`;
    console.log("📋 Secret Name:", secretName);

    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    const secret = JSON.parse(response.SecretString);
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_SEPOLIA
    );
    const wallet = new ethers.Wallet(secret.privateKey, provider);

    console.log("✅ Operator wallet loaded from AWS");
    console.log("📍 Address:", wallet.address);
    console.log("");

    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    console.log("");

    console.log("✅ AWS Secrets Manager working correctly");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

testOperatorWallet();
