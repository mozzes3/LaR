const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

class AWSAdminService {
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.secretName = "admin-wallets";
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 5 * 60 * 1000;
  }

  async getAdminWallets() {
    if (this.cache && Date.now() - this.cacheTimestamp < this.cacheTTL) {
      return this.cache;
    }

    const response = await this.client.send(
      new GetSecretValueCommand({ SecretId: this.secretName })
    );

    const secret = JSON.parse(response.SecretString);
    const wallets = secret.adminWallets.map((w) => w.toLowerCase());

    this.cache = wallets;
    this.cacheTimestamp = Date.now();
    return wallets;
  }

  async isAdminWallet(walletAddress) {
    if (!walletAddress) return false;
    const adminWallets = await this.getAdminWallets();
    return adminWallets.includes(walletAddress.toLowerCase());
  }
}

module.exports = new AWSAdminService();
