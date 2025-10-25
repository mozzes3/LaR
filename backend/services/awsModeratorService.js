const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

class AWSModeratorService {
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.cache = {
      adminWallets: null,
      moderatorWallets: null,
      lastUpdate: 0,
    };
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async getSecretWallets(secretName) {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      const secret = JSON.parse(response.SecretString);

      // Support both array formats
      if (secret.adminWallets) {
        return secret.adminWallets.map((w) => w.toLowerCase());
      }
      if (secret.moderatorWallets) {
        return secret.moderatorWallets.map((w) => w.toLowerCase());
      }
      if (secret.wallets) {
        return secret.wallets.map((w) => w.toLowerCase());
      }

      return [];
    } catch (error) {
      console.error(`❌ Failed to fetch ${secretName}:`, error.message);
      return [];
    }
  }

  async getAdminWallets() {
    if (
      this.cache.adminWallets &&
      Date.now() - this.cache.lastUpdate < this.cacheTTL
    ) {
      return this.cache.adminWallets;
    }

    const wallets = await this.getSecretWallets("admin-wallets");
    this.cache.adminWallets = wallets;
    this.cache.lastUpdate = Date.now();
    return wallets;
  }

  async getModeratorWallets() {
    if (
      this.cache.moderatorWallets &&
      Date.now() - this.cache.lastUpdate < this.cacheTTL
    ) {
      return this.cache.moderatorWallets;
    }

    const wallets = await this.getSecretWallets("moderator-wallets");
    this.cache.moderatorWallets = wallets;
    this.cache.lastUpdate = Date.now();
    return wallets;
  }

  async isAdminWallet(walletAddress) {
    if (!walletAddress) return false;
    const adminWallets = await this.getAdminWallets();
    return adminWallets.includes(walletAddress.toLowerCase());
  }

  async isModeratorWallet(walletAddress) {
    if (!walletAddress) return false;
    const moderatorWallets = await this.getModeratorWallets();
    return moderatorWallets.includes(walletAddress.toLowerCase());
  }

  async getWalletRole(walletAddress) {
    if (!walletAddress) return null;

    const isAdmin = await this.isAdminWallet(walletAddress);
    if (isAdmin) return "admin";

    const isModerator = await this.isModeratorWallet(walletAddress);
    if (isModerator) return "moderator";

    return null;
  }

  clearCache() {
    this.cache = {
      adminWallets: null,
      moderatorWallets: null,
      lastUpdate: 0,
    };
  }
}

module.exports = new AWSModeratorService();
