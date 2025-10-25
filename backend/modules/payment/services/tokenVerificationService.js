const { ethers } = require("ethers");
const PaymentToken = require("../models/PaymentToken");
const { getRegistryAddress } = require("../config/registryAddresses");
const TOKEN_REGISTRY_ABI = [
  "function verifyToken(string symbol, address tokenAddress, address escrowAddress, uint256 chainId) view returns (bool)",
  "function getToken(string symbol, uint256 chainId) view returns (tuple(address tokenAddress, address escrowAddress, uint256 chainId, bool isActive, uint256 addedAt, uint256 deactivatedAt))",
];

const TOKEN_REGISTRY_ADDRESSES = {
  1: process.env.TOKEN_REGISTRY_MAINNET,
  11155111: process.env.TOKEN_REGISTRY_SEPOLIA,
  137: process.env.TOKEN_REGISTRY_POLYGON,
};

class TokenVerificationService {
  /**
   * CRITICAL: Verify registry contract hasn't been replaced
   */
  async verifyRegistryContract(provider, chainId) {
    try {
      const config = getRegistryAddress(chainId);

      // Skip verification if no code hash (dev override)
      if (!config.codeHash) {
        console.warn("⚠️  Skipping registry code verification (dev mode)");
        return { verified: true, warning: "Dev mode - no verification" };
      }

      // Get deployed contract code
      const deployedCode = await provider.getCode(config.address);

      if (deployedCode === "0x") {
        console.error("❌ CRITICAL: No contract at registry address!");
        return {
          verified: false,
          error: "Registry contract not found at address",
        };
      }

      // Hash the deployed code
      const deployedCodeHash = ethers.keccak256(deployedCode);

      // Compare with expected hash
      if (deployedCodeHash !== config.codeHash) {
        console.error("❌ CRITICAL: Registry contract code mismatch!");
        console.error(`   Expected: ${config.codeHash}`);
        console.error(`   Found:    ${deployedCodeHash}`);
        return {
          verified: false,
          error: "Registry contract code does not match expected hash",
        };
      }

      console.log("✅ Registry contract code verified");
      return { verified: true };
    } catch (error) {
      console.error("Registry verification error:", error);
      return {
        verified: false,
        error: "Failed to verify registry contract",
      };
    }
  }
  async verifyTokenAgainstRegistry(paymentToken) {
    try {
      const config = getRegistryAddress(paymentToken.chainId);
      const provider = new ethers.JsonRpcProvider(paymentToken.rpcUrl);

      // STEP 1: Verify registry contract itself
      const registryVerification = await this.verifyRegistryContract(
        provider,
        paymentToken.chainId
      );

      if (!registryVerification.verified) {
        console.error("❌ CRITICAL: Registry contract verification failed");
        // In production, this should HALT all payments
        if (process.env.NODE_ENV === "production") {
          // Alert admin immediately
          await this.alertAdmin("CRITICAL: Registry contract compromised", {
            chainId: paymentToken.chainId,
            error: registryVerification.error,
          });
        }
        return registryVerification;
      }

      // STEP 2: Verify token using registry
      const registry = new ethers.Contract(
        config.address,
        TOKEN_REGISTRY_ABI,
        provider
      );

      const isVerified = await registry.verifyToken(
        paymentToken.symbol,
        paymentToken.contractAddress,
        paymentToken.paymentContractAddress,
        paymentToken.chainId // ADD chainId parameter
      );

      if (!isVerified) {
        console.error("❌ TOKEN VERIFICATION FAILED");
        console.error(`Database token: ${paymentToken.contractAddress}`);
        console.error(`Registry mismatch for: ${paymentToken.symbol}`);

        return {
          verified: false,
          error: "Token addresses do not match on-chain registry",
        };
      }

      console.log(`✅ Token verified: ${paymentToken.symbol}`);
      return { verified: true };
    } catch (error) {
      console.error("Token verification error:", error);
      return {
        verified: false,
        error: "Failed to verify token",
      };
    }
  }

  async checkTokenAvailability(paymentToken) {
    const checks = {
      databaseActive: false,
      databaseEnabled: false,
      registryVerified: false,
      rpcConnected: false,
      contractExists: false,
    };

    try {
      checks.databaseActive = paymentToken.isActive;
      checks.databaseEnabled = paymentToken.isEnabled;

      if (!checks.databaseActive || !checks.databaseEnabled) {
        return {
          available: false,
          reason: "Token disabled",
          checks,
        };
      }

      const registryCheck = await this.verifyTokenAgainstRegistry(paymentToken);
      checks.registryVerified = registryCheck.verified;

      if (!registryCheck.verified) {
        return {
          available: false,
          reason: registryCheck.error,
          checks,
        };
      }

      try {
        const provider = new ethers.JsonRpcProvider(paymentToken.rpcUrl);
        await provider.getBlockNumber();
        checks.rpcConnected = true;
      } catch (error) {
        return {
          available: false,
          reason: "RPC not reachable",
          checks,
        };
      }

      try {
        const provider = new ethers.JsonRpcProvider(paymentToken.rpcUrl);
        const code = await provider.getCode(paymentToken.contractAddress);
        checks.contractExists = code !== "0x";

        if (!checks.contractExists) {
          return {
            available: false,
            reason: "Contract not found",
            checks,
          };
        }
      } catch (error) {
        return {
          available: false,
          reason: "Contract verification failed",
          checks,
        };
      }

      return {
        available: true,
        checks,
      };
    } catch (error) {
      console.error("Availability check error:", error);
      return {
        available: false,
        reason: "Availability check failed",
        checks,
      };
    }
  }

  async getAvailableTokensForInstructor(instructorAcceptedMethods) {
    try {
      const allTokens = await PaymentToken.find().lean();
      const availableTokens = [];

      for (const token of allTokens) {
        if (!instructorAcceptedMethods.includes(token.symbol.toLowerCase())) {
          continue;
        }

        const availability = await this.checkTokenAvailability(token);

        if (availability.available) {
          availableTokens.push({
            ...token,
            availabilityChecks: availability.checks,
          });
        } else {
          console.log(
            `⚠️ Token ${token.symbol} unavailable: ${availability.reason}`
          );
        }
      }

      return availableTokens;
    } catch (error) {
      console.error("Error getting available tokens:", error);
      throw error;
    }
  }
  async alertAdmin(message, details) {
    console.error("🚨 SECURITY ALERT:", message);
    console.error("Details:", JSON.stringify(details, null, 2));

    // TODO: Send to monitoring service (Sentry, PagerDuty, etc.)
    // TODO: Send email/SMS to admin
    // TODO: Pause all payments

    // For now, log to file
    const fs = require("fs").promises;
    const alertLog = {
      timestamp: new Date().toISOString(),
      message,
      details,
      environment: process.env.NODE_ENV,
    };

    await fs.appendFile(
      "logs/security-alerts.log",
      JSON.stringify(alertLog) + "\n"
    );
  }
}

module.exports = new TokenVerificationService();
