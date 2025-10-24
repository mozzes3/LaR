require("dotenv").config();
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { ethers } = require("ethers");

async function testAWSSecrets() {
  try {
    console.log("🔐 Testing AWS Secrets Manager Connection...\n");

    // Check credentials
    console.log("📋 Configuration:");
    console.log("   AWS Region:", process.env.AWS_REGION || "NOT SET");
    console.log(
      "   Access Key:",
      process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ NOT SET"
    );
    console.log(
      "   Secret Key:",
      process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ NOT SET"
    );
    console.log("   Active Network:", process.env.ACTIVE_NETWORK || "sepolia");
    console.log("");

    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const secretName = `payment-operator-${
      process.env.ACTIVE_NETWORK || "sepolia"
    }`;
    console.log("🔍 Fetching secret:", secretName);

    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    console.log("✅ Secret retrieved successfully\n");

    const secret = JSON.parse(response.SecretString);

    if (!secret.privateKey) {
      throw new Error("Private key not found in secret");
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_SEPOLIA ||
        "https://eth-sepolia.g.alchemy.com/v2/demo"
    );

    const wallet = new ethers.Wallet(secret.privateKey, provider);

    console.log("📍 Operator Wallet Information:");
    console.log("   Address:", wallet.address);
    console.log("   Expected:", process.env.OPERATOR_WALLET_ADDRESS);
    console.log(
      "   Match:",
      wallet.address === process.env.OPERATOR_WALLET_ADDRESS ? "✅" : "❌"
    );
    console.log("");

    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Wallet Balance:");
    console.log("   ETH:", ethers.formatEther(balance));
    console.log(
      "   Sufficient for gas:",
      Number(ethers.formatEther(balance)) > 0.001 ? "✅" : "⚠️  Low balance"
    );
    console.log("");

    console.log("═══════════════════════════════════════");
    console.log("✅ AWS SECRETS MANAGER WORKING");
    console.log("═══════════════════════════════════════");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);

    if (error.code === "ResourceNotFoundException") {
      console.error("\n💡 Solution: Create the secret in AWS:");
      console.error("   aws secretsmanager create-secret \\");
      console.error("     --name payment-operator-sepolia \\");
      console.error('     --secret-string \'{"privateKey":"0xYOUR_KEY"}\' \\');
      console.error("     --region us-east-1");
    } else if (error.code === "UnrecognizedClientException") {
      console.error("\n💡 Solution: Check AWS credentials in .env file");
    } else if (error.code === "AccessDeniedException") {
      console.error(
        "\n💡 Solution: Add SecretsManager permissions to payment-system-user"
      );
    }

    process.exit(1);
  }
}

testAWSSecrets();
