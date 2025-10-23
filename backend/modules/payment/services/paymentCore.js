const { ethers } = require("ethers");
const AWS = require("aws-sdk");

class PaymentCore {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.isDummy = process.env.PAYMENT_MODE === "dummy";

    // Only initialize AWS in production
    if (this.isProduction && !this.isDummy) {
      this.secretsManager = new AWS.SecretsManager({
        region: "us-east-1",
      });
    }
  }

  async getOperatorWallet() {
    if (this.isDummy) {
      return null; // No wallet needed for dummy mode
    }

    // Get from AWS Secrets Manager
    const secret = await this.secretsManager
      .getSecretValue({
        SecretId: "payment-operator-sepolia",
      })
      .promise();

    const data = JSON.parse(secret.SecretString);
    const provider = new ethers.JsonRpcProvider(
      "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
    );

    return new ethers.Wallet(data.privateKey, provider);
  }
}

module.exports = PaymentCore;
