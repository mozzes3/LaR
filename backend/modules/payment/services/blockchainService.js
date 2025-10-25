const { ethers } = require("ethers");
const fs = require("fs");
const crypto = require("crypto");
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");

// Contract ABI
const ESCROW_ABI = [
  "function createEscrowFromApproval(address student, address instructor, uint256 amount, bytes32 courseId, uint256 escrowPeriodDays, uint256 customPlatformFee) external returns (bytes32)",
  "function releaseEscrow(bytes32 escrowId) external",
  "function batchReleaseEscrows(bytes32[] escrowIds) external",
  "function refundEscrow(bytes32 escrowId) external",
  "function getEscrow(bytes32 escrowId) view returns (tuple(address student, address instructor, uint256 totalAmount, uint256 platformFee, uint256 instructorFee, uint256 revenueSplitAmount, uint256 releaseDate, bool isReleased, bool isRefunded, uint256 createdAt, bytes32 courseId))",
  "function studentCourseEscrow(address student, bytes32 courseId) view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "event PaymentReceived(bytes32 indexed escrowId, address indexed student, address indexed instructor, uint256 amount, bytes32 courseId)",
];
// ERC20 ABI (for approvals and balance checks)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

/**
 * @class PaymentBlockchainService
 * @description Military-grade secure blockchain service for payment operations
 */
class PaymentBlockchainService {
  constructor() {
    this.providers = new Map();
    this.wallets = new Map();
    this.contracts = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the service with payment token configuration
   * @param {Object} paymentToken - Payment token from database
   */
  async initialize(paymentToken) {
    try {
      if (!paymentToken) {
        throw new Error("Payment token configuration required");
      }

      const key = `${paymentToken.blockchain}_${paymentToken.chainId}`;

      // Skip if already initialized for this chain
      if (this.providers.has(key)) {
        return;
      }

      console.log(
        `🔧 Initializing payment service for ${paymentToken.symbol} on ${paymentToken.chainName}`
      );

      // Create provider
      const provider = new ethers.JsonRpcProvider(paymentToken.rpcUrl);
      this.providers.set(key, provider);

      // Initialize wallet
      const wallet = await this.initializeSecureWallet(provider);
      this.wallets.set(key, wallet);

      // Initialize escrow contract
      const escrowContract = new ethers.Contract(
        paymentToken.paymentContractAddress,
        ESCROW_ABI,
        wallet
      );
      this.contracts.set(`escrow_${key}`, escrowContract);

      // Initialize token contract
      const tokenContract = new ethers.Contract(
        paymentToken.contractAddress,
        ERC20_ABI,
        wallet
      );
      this.contracts.set(`token_${key}`, tokenContract);

      console.log(`✅ Payment service initialized for ${paymentToken.symbol}`);
      console.log(`   Escrow Contract: ${paymentToken.paymentContractAddress}`);
      console.log(`   Token Contract: ${paymentToken.contractAddress}`);
      console.log(`   Operator Wallet: ${wallet.address}`);

      // ✅ ADD THESE LINES HERE (inside try block, before initialized = true):
      this.currentBlockchain = paymentToken.blockchain;
      this.currentChainId = paymentToken.chainId;

      console.log("✅ Stored:", {
        blockchain: this.currentBlockchain,
        chainId: this.currentChainId,
      });

      this.initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize payment service:", error);
      throw error;
    }
    // ❌ REMOVE THE LINES FROM HERE - they were outside try-catch!
  }

  /**
   * Initialize wallet with military-grade security
   * @private
   */
  /**
   * Initialize wallet with military-grade security
   * @private
   */
  async initializeSecureWallet(provider) {
    try {
      const paymentMode = process.env.PAYMENT_MODE || "blockchain";

      // DUMMY MODE - For development/testing
      if (paymentMode === "dummy") {
        console.log("🔧 DUMMY MODE: Using test wallet");
        const dummyPrivateKey = "0x" + "1".repeat(64); // Dummy key
        return new ethers.Wallet(dummyPrivateKey, provider);
      }

      // BLOCKCHAIN MODE - Production with AWS Secrets Manager
      const awsSecretsEnabled = process.env.AWS_SECRETS_ENABLED === "true";
      const activeNetwork = process.env.ACTIVE_NETWORK || "sepolia";

      if (awsSecretsEnabled) {
        console.log(
          `🔐 Loading operator wallet from AWS Secrets Manager (${activeNetwork})`
        );

        const {
          SecretsManagerClient,
          GetSecretValueCommand,
        } = require("@aws-sdk/client-secrets-manager");

        const client = new SecretsManagerClient({
          region: process.env.AWS_REGION || "us-east-1",
        });

        const secretName = `payment-operator-${activeNetwork}`;

        try {
          const response = await client.send(
            new GetSecretValueCommand({
              SecretId: secretName,
            })
          );

          const secret = JSON.parse(response.SecretString);
          const wallet = new ethers.Wallet(secret.privateKey, provider);

          console.log(`✅ Operator wallet loaded: ${wallet.address}`);
          return wallet;
        } catch (error) {
          console.error("❌ Failed to load AWS secret:", error.message);
          throw new Error(`AWS Secrets Manager failed: ${error.message}`);
        }
      }

      // FALLBACK - Encrypted wallet file (RECOMMENDED for self-hosted)
      if (
        process.env.PAYMENT_WALLET_FILE_PATH &&
        process.env.PAYMENT_WALLET_PASSWORD
      ) {
        console.log("🔐 Loading encrypted payment wallet from file...");

        if (!fs.existsSync(process.env.PAYMENT_WALLET_FILE_PATH)) {
          throw new Error(
            `Wallet file not found: ${process.env.PAYMENT_WALLET_FILE_PATH}`
          );
        }

        const encryptedJson = fs.readFileSync(
          process.env.PAYMENT_WALLET_FILE_PATH,
          "utf8"
        );
        const wallet = await ethers.Wallet.fromEncryptedJson(
          encryptedJson,
          process.env.PAYMENT_WALLET_PASSWORD
        );

        return wallet.connect(provider);
      }

      // TESTING ONLY - Plain private key
      if (process.env.PAYMENT_WALLET_PRIVATE_KEY) {
        console.warn("⚠️  WARNING: Using unencrypted private key");
        console.warn("⚠️  This is NOT secure for production");

        const wallet = new ethers.Wallet(
          process.env.PAYMENT_WALLET_PRIVATE_KEY,
          provider
        );
        return wallet;
      }

      throw new Error(
        "No wallet configuration found. Set one of:\n" +
          "1. PAYMENT_MODE=dummy (for testing)\n" +
          "2. AWS_SECRETS_ENABLED=true + AWS_REGION + ACTIVE_NETWORK (production)\n" +
          "3. PAYMENT_WALLET_FILE_PATH + PAYMENT_WALLET_PASSWORD (self-hosted)\n" +
          "4. PAYMENT_WALLET_PRIVATE_KEY (testing only)"
      );
    } catch (error) {
      console.error("❌ Failed to initialize wallet:", error.message);
      throw error;
    }
  }

  /**
   * Get provider for specific chain
   */
  getProvider(blockchain, chainId) {
    const key = `${blockchain}_${chainId}`;
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`Provider not initialized for ${key}`);
    }
    return provider;
  }

  /**
   * Get wallet for specific chain
   */
  getWallet(blockchain, chainId) {
    const key = `${blockchain}_${chainId}`;
    const wallet = this.wallets.get(key);
    if (!wallet) {
      throw new Error(`Wallet not initialized for ${key}`);
    }
    return wallet;
  }

  /**
   * Get escrow contract for specific chain
   */
  getEscrowContract(blockchain, chainId) {
    const key = `escrow_${blockchain}_${chainId}`;
    const contract = this.contracts.get(key);
    if (!contract) {
      throw new Error(`Escrow contract not initialized for ${key}`);
    }
    return contract;
  }

  /**
   * Get token contract for specific chain
   */
  getTokenContract(blockchain, chainId) {
    const key = `token_${blockchain}_${chainId}`;
    const contract = this.contracts.get(key);
    if (!contract) {
      throw new Error(`Token contract not initialized for ${key}`);
    }
    return contract;
  }

  /**
   * Create escrow payment (called by backend after receiving payment)
   * @param {Object} params - Payment parameters
   * @returns {Object} Transaction result
   */
  async createEscrowPayment(params) {
    const {
      studentAddress,
      instructorAddress,
      amountInToken,
      courseId,
      escrowPeriodDays,
      customPlatformFee,
      blockchain,
      chainId,
    } = params;

    try {
      const escrowContract = this.getEscrowContract(blockchain, chainId);
      const courseIdBytes32 = ethers.id(courseId);

      // CHECK FOR EXISTING ESCROW ON BLOCKCHAIN
      console.log("🔍 Checking for existing on-chain escrow...");

      try {
        const existingEscrowId = await escrowContract.studentCourseEscrow(
          studentAddress,
          courseIdBytes32
        );

        if (existingEscrowId !== ethers.ZeroHash) {
          console.log("⚠️  Found existing escrow:", existingEscrowId);

          const escrowData = await escrowContract.getEscrow(existingEscrowId);

          if (!escrowData.isReleased && !escrowData.isRefunded) {
            console.log("⚠️  Existing escrow is still active");
            console.log(
              "   Release Date:",
              new Date(Number(escrowData.releaseDate) * 1000)
            );

            const canRelease =
              Date.now() / 1000 >= Number(escrowData.releaseDate);
            console.log("   Can release now:", canRelease);

            if (canRelease) {
              console.log("🔓 Auto-releasing old escrow...");
              const releaseTx = await escrowContract.releaseEscrow(
                existingEscrowId
              );
              await releaseTx.wait();
              console.log("✅ Old escrow released");
            } else {
              throw new Error(
                `You already have an active purchase for this course. ` +
                  `Wait until ${new Date(
                    Number(escrowData.releaseDate) * 1000
                  ).toLocaleString()} to purchase again.`
              );
            }
          } else {
            console.log("✅ Existing escrow already released/refunded");
          }
        } else {
          console.log("✅ No existing escrow found");
        }
      } catch (checkError) {
        if (checkError.message.includes("active purchase")) {
          throw checkError;
        }
        console.warn(
          "⚠️  Could not check existing escrow:",
          checkError.message
        );
      }

      // CREATE NEW ESCROW
      console.log("📝 Creating escrow via backend:", {
        student: studentAddress,
        instructor: instructorAddress,
        amount: amountInToken,
        courseId,
        escrowPeriodDays,
      });

      console.log("🔐 Backend calling createEscrowFromApproval...");
      console.log("   Contract:", await escrowContract.getAddress());
      console.log("   Student:", studentAddress);
      console.log("   Instructor:", instructorAddress);
      console.log("   Amount:", amountInToken);
      console.log("   Course ID (bytes32):", courseIdBytes32);
      console.log("   Escrow Period:", escrowPeriodDays, "days");
      console.log("   Custom Fee:", customPlatformFee || 0);

      const tx = await escrowContract.createEscrowFromApproval(
        studentAddress,
        instructorAddress,
        amountInToken,
        courseIdBytes32,
        escrowPeriodDays,
        customPlatformFee || 0
      );

      console.log("   Transaction sent:", tx.hash);
      console.log("   Waiting for confirmation...");

      const receipt = await tx.wait();

      console.log("   ✅ Confirmed in block:", receipt.blockNumber);

      const event = receipt.logs
        .map((log) => {
          try {
            return escrowContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "PaymentReceived");

      if (!event) {
        throw new Error("PaymentReceived event not found in transaction");
      }

      const escrowId = event.args.escrowId;

      console.log("✅ Escrow created successfully");
      console.log("   Escrow ID:", escrowId);
      console.log("   TX Hash:", tx.hash);

      return {
        success: true,
        escrowId: escrowId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Failed to create escrow:", error);
      console.error("   Error message:", error.message);
      console.error("   Error code:", error.code);

      if (error.message.includes("EscrowAlreadyExists")) {
        throw new Error("You have already purchased this course");
      }
      if (error.message.includes("active purchase")) {
        throw error;
      }
      if (error.message.includes("insufficient allowance")) {
        throw new Error(
          "Token approval insufficient. Please approve tokens first."
        );
      }
      if (error.message.includes("AccessControl")) {
        throw new Error(
          "Backend wallet lacks required permissions. Contact support."
        );
      }

      throw error;
    }
  }

  /**
   * Release escrow to instructor
   * @param {Object} params - Release parameters
   * @returns {Object} Transaction result
   */
  async releaseEscrow(params) {
    const { escrowId, blockchain, chainId } = params;

    try {
      console.log(`🔓 Releasing escrow: ${escrowId}`);

      const escrowContract = this.getEscrowContract(blockchain, chainId);

      // Check if can be released
      const canRelease = await escrowContract.canReleaseEscrow(escrowId);
      if (!canRelease) {
        throw new Error("Escrow conditions not met for release");
      }

      // Estimate gas
      const gasEstimate = await escrowContract.releaseEscrow.estimateGas(
        escrowId
      );

      // Execute transaction
      const tx = await escrowContract.releaseEscrow(escrowId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });

      console.log(`📤 Release transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Escrow released in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Failed to release escrow:", error);
      throw error;
    }
  }

  /**
   * Refund an escrow
   */

  /**
   * Process refund to student
   * @param {Object} params - Refund parameters
   * @returns {Object} Transaction result
   */
  async refundEscrow(params) {
    const { escrowId } = params;

    try {
      console.log("💸 Refunding escrow:", escrowId);

      // Get the initialized escrow contract
      const blockchain = this.currentBlockchain;
      const chainId = this.currentChainId;

      if (!blockchain || !chainId) {
        throw new Error(
          "Payment service not initialized. Call initialize() first."
        );
      }

      const contractKey = `escrow_${blockchain}_${chainId}`;
      const escrowContract = this.contracts.get(contractKey); // ✅ Use .get()

      if (!escrowContract) {
        console.error(
          "Available contracts:",
          Array.from(this.contracts.keys())
        );
        throw new Error(`Escrow contract not found: ${contractKey}`);
      }

      console.log("   Using contract:", await escrowContract.getAddress());
      console.log("   Refunding to student...");

      // Call refundEscrow on contract
      const tx = await escrowContract.refundEscrow(escrowId);
      console.log("   Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("   ✅ Confirmed in block:", receipt.blockNumber);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Refund escrow failed:", error);
      throw error;
    }
  }

  /**
   * Get escrow details from smart contract
   */
  async getEscrowDetails(escrowId, blockchain, chainId) {
    try {
      const escrowContract = this.getEscrowContract(blockchain, chainId);
      const escrow = await escrowContract.getEscrow(escrowId);

      return {
        student: escrow.student,
        instructor: escrow.instructor,
        totalAmount: escrow.totalAmount.toString(),
        platformFee: escrow.platformFee.toString(),
        instructorFee: escrow.instructorFee.toString(),
        revenueSplitAmount: escrow.revenueSplitAmount.toString(),
        releaseDate: new Date(Number(escrow.releaseDate) * 1000),
        isReleased: escrow.isReleased,
        isRefunded: escrow.isRefunded,
        createdAt: new Date(Number(escrow.createdAt) * 1000),
        courseId: escrow.courseId,
      };
    } catch (error) {
      console.error("❌ Failed to get escrow details:", error);
      throw error;
    }
  }

  /**
   * Batch release escrows (for automation)
   */
  async batchReleaseEscrows(escrowIds, blockchain, chainId) {
    try {
      console.log(`🔓 Batch releasing ${escrowIds.length} escrows`);

      const escrowContract = this.getEscrowContract(blockchain, chainId);

      const gasEstimate = await escrowContract.batchReleaseEscrows.estimateGas(
        escrowIds
      );

      const tx = await escrowContract.batchReleaseEscrows(escrowIds, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });

      const receipt = await tx.wait();

      console.log(`✅ Batch release completed in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        count: escrowIds.length,
      };
    } catch (error) {
      console.error("❌ Failed to batch release escrows:", error);
      throw error;
    }
  }
}

// Singleton instance
let paymentServiceInstance = null;

/**
 * Get payment service instance
 */
function getPaymentService() {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentBlockchainService();
  }
  return paymentServiceInstance;
}

// Add this method to your blockchainService class/module

module.exports = {
  PaymentBlockchainService,
  getPaymentService,
};
