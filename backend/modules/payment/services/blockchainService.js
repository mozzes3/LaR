const { ethers } = require("ethers");
const fs = require("fs");
const crypto = require("crypto");
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");

// Contract ABI
const ESCROW_ABI = [
  "function createEscrowPayment(address student, address instructor, uint256 amount, bytes32 courseId, uint256 escrowPeriodDays, uint256 customPlatformFee) external returns (bytes32)",
  "function releaseEscrow(bytes32 escrowId) external",
  "function processRefund(bytes32 escrowId) external",
  "function batchReleaseEscrows(bytes32[] calldata escrowIds) external",
  "function getEscrow(bytes32 escrowId) external view returns (tuple(address student, address instructor, uint256 totalAmount, uint256 platformFee, uint256 instructorFee, uint256 revenueSplitAmount, uint256 releaseDate, bool isReleased, bool isRefunded, uint256 createdAt, bytes32 courseId))",
  "function canReleaseEscrow(bytes32 escrowId) external view returns (bool)",
  "function escrows(bytes32) external view returns (address student, address instructor, uint256 totalAmount, uint256 platformFee, uint256 instructorFee, uint256 revenueSplitAmount, uint256 releaseDate, bool isReleased, bool isRefunded, uint256 createdAt, bytes32 courseId)",
  "function studentCourseEscrow(address student, bytes32 courseId) external view returns (bytes32)",
  "event PaymentReceived(bytes32 indexed escrowId, address indexed student, address indexed instructor, uint256 amount, bytes32 courseId)",
  "event EscrowReleased(bytes32 indexed escrowId, address indexed student, address indexed instructor, uint256 instructorAmount, uint256 platformAmount, uint256 revenueSplitAmount)",
  "event RefundProcessed(bytes32 indexed escrowId, address indexed student, uint256 amount)",
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

      this.initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize payment service:", error);
      throw error;
    }
  }

  /**
   * Initialize wallet with military-grade security
   * @private
   */
  async initializeSecureWallet(provider) {
    try {
      // Method 1: Encrypted wallet file (RECOMMENDED for production)
      if (
        process.env.PAYMENT_WALLET_FILE_PATH &&
        process.env.PAYMENT_WALLET_PASSWORD
      ) {
        console.log("🔐 Loading encrypted payment wallet...");

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

      // Method 2: Environment variable encrypted key (Backup method)
      if (process.env.PAYMENT_WALLET_ENCRYPTED_KEY) {
        console.log("🔐 Loading encrypted payment wallet from ENV...");

        const encrypted = process.env.PAYMENT_WALLET_ENCRYPTED_KEY;
        const password = process.env.PAYMENT_WALLET_PASSWORD;

        if (!password) {
          throw new Error("PAYMENT_WALLET_PASSWORD required");
        }

        // Decrypt the key
        const decipher = crypto.createDecipher("aes-256-cbc", password);
        let privateKey = decipher.update(encrypted, "hex", "utf8");
        privateKey += decipher.final("utf8");

        const wallet = new ethers.Wallet(privateKey, provider);
        return wallet;
      }

      // Method 3: Plain private key (ONLY FOR TESTING - NOT PRODUCTION)
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
          "1. PAYMENT_WALLET_FILE_PATH + PAYMENT_WALLET_PASSWORD (recommended)\n" +
          "2. PAYMENT_WALLET_ENCRYPTED_KEY + PAYMENT_WALLET_PASSWORD\n" +
          "3. PAYMENT_WALLET_PRIVATE_KEY (testing only)"
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
      console.log("📝 Creating escrow payment:", {
        student: studentAddress,
        instructor: instructorAddress,
        amount: amountInToken,
        courseId,
        escrowPeriodDays,
      });

      const escrowContract = this.getEscrowContract(blockchain, chainId);

      // Convert course ID to bytes32
      const courseIdBytes32 = ethers.id(courseId);

      // Estimate gas
      const gasEstimate = await escrowContract.createEscrowPayment.estimateGas(
        studentAddress,
        instructorAddress,
        amountInToken,
        courseIdBytes32,
        escrowPeriodDays,
        customPlatformFee || 0
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Execute transaction
      const tx = await escrowContract.createEscrowPayment(
        studentAddress,
        instructorAddress,
        amountInToken,
        courseIdBytes32,
        escrowPeriodDays,
        customPlatformFee || 0,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // 20% buffer
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract escrow ID from event
      const event = receipt.logs.find((log) => {
        try {
          const parsed = escrowContract.interface.parseLog(log);
          return parsed.name === "PaymentReceived";
        } catch {
          return false;
        }
      });

      let escrowId = null;
      if (event) {
        const parsed = escrowContract.interface.parseLog(event);
        escrowId = parsed.args[0];
      }

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        escrowId,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Failed to create escrow payment:", error);
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
   * Process refund to student
   * @param {Object} params - Refund parameters
   * @returns {Object} Transaction result
   */
  async processRefund(params) {
    const { escrowId, blockchain, chainId } = params;

    try {
      console.log(`💸 Processing refund: ${escrowId}`);

      const escrowContract = this.getEscrowContract(blockchain, chainId);

      // Estimate gas
      const gasEstimate = await escrowContract.processRefund.estimateGas(
        escrowId
      );

      // Execute transaction
      const tx = await escrowContract.processRefund(escrowId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });

      console.log(`📤 Refund transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Refund processed in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Failed to process refund:", error);
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
