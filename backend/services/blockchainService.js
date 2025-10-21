// backend/services/blockchainService.js
const { ethers } = require("ethers");
const fs = require("fs");

// ABI for certificate verification contract
const CERTIFICATE_ABI = [
  "function recordCertificate(string certificateNumber, string studentName, string studentWallet, string courseTitle, string instructor, uint256 completedDate, string grade, uint256 finalScore, uint256 totalHours, uint256 totalLessons) public returns (bytes32)",
  "function verifyCertificate(string certificateNumber) public view returns (bool exists, string studentName, string courseTitle, string instructor, uint256 completedDate, string grade, uint256 finalScore)",
  "event CertificateRecorded(bytes32 indexed certificateHash, string certificateNumber, string studentName, string courseTitle, uint256 timestamp)",
];

class BlockchainService {
  constructor() {
    // Somnia RPC URLs
    const rpcUrls = {
      mainnet: "https://api.infra.mainnet.somnia.network/",
      testnet: "https://dream-rpc.somnia.network/",
    };

    const network = process.env.BLOCKCHAIN_NETWORK || "testnet";
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || rpcUrls[network];

    console.log("🌐 Connecting to Somnia:", network);
    console.log("🔗 RPC URL:", rpcUrl);

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = null;
    this.contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS;
    this.contract = null;
    this.network = network;

    // Initialize wallet
    this.initializeWallet();
  }

  async initializeWallet() {
    try {
      // Check which wallet method to use
      if (process.env.WALLET_FILE_PATH && process.env.WALLET_PASSWORD) {
        console.log("🔐 Loading encrypted wallet from file...");
        console.log("📁 Wallet file:", process.env.WALLET_FILE_PATH);

        // Check if file exists
        if (!fs.existsSync(process.env.WALLET_FILE_PATH)) {
          throw new Error(
            `Wallet file not found: ${process.env.WALLET_FILE_PATH}`
          );
        }

        const encryptedJson = fs.readFileSync(
          process.env.WALLET_FILE_PATH,
          "utf8"
        );

        console.log("🔓 Decrypting wallet...");
        this.wallet = await ethers.Wallet.fromEncryptedJson(
          encryptedJson,
          process.env.WALLET_PASSWORD
        );

        this.wallet = this.wallet.connect(this.provider);
        console.log("✅ Wallet loaded from encrypted file");
        console.log("📍 Wallet address:", this.wallet.address);
      } else if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        console.warn("⚠️  WARNING: Using direct private key");
        console.warn("⚠️  This is NOT secure for production");

        this.wallet = new ethers.Wallet(
          process.env.BLOCKCHAIN_PRIVATE_KEY,
          this.provider
        );
        console.log("📍 Wallet address:", this.wallet.address);
      } else {
        throw new Error(
          "No wallet configuration found. Set either:\n" +
            "1. WALLET_FILE_PATH and WALLET_PASSWORD (recommended)\n" +
            "2. BLOCKCHAIN_PRIVATE_KEY (testing only)"
        );
      }

      // Initialize contract
      if (!this.contractAddress) {
        throw new Error("CERTIFICATE_CONTRACT_ADDRESS not set in .env");
      }

      this.contract = new ethers.Contract(
        this.contractAddress,
        CERTIFICATE_ABI,
        this.wallet
      );

      console.log("✅ Contract initialized:", this.contractAddress);
      console.log("🌐 Network:", this.network);
    } catch (error) {
      console.error("❌ Failed to initialize wallet:", error.message);
      throw error;
    }
  }

  async recordCertificate(certificateData) {
    try {
      if (!this.wallet || !this.contract) {
        await this.initializeWallet();
      }

      const {
        certificateNumber,
        studentName,
        studentWallet,
        courseTitle,
        instructor,
        completedDate,
        grade,
        finalScore,
        totalHours,
        totalLessons,
      } = certificateData;

      console.log(
        `📝 Recording certificate on Somnia blockchain: ${certificateNumber}`
      );

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");

      console.log(`⛽ Current gas price: ${gasPriceGwei} gwei`);

      const timestamp = Math.floor(new Date(completedDate).getTime() / 1000);

      const gasEstimate = await this.contract.recordCertificate.estimateGas(
        certificateNumber,
        studentName,
        studentWallet || "Not Connected",
        courseTitle,
        instructor,
        timestamp,
        grade,
        Math.floor(finalScore),
        Math.floor(totalHours),
        totalLessons
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      const estimatedCost = gasPrice * gasEstimate;
      const costInSomi = ethers.formatEther(estimatedCost);
      console.log(`💰 Estimated cost: ${costInSomi} SOMI`);

      const tx = await this.contract.recordCertificate(
        certificateNumber,
        studentName,
        studentWallet || "Not Connected",
        courseTitle,
        instructor,
        timestamp,
        grade,
        Math.floor(finalScore),
        Math.floor(totalHours),
        totalLessons,
        {
          gasLimit: (gasEstimate * 120n) / 100n,
        }
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      console.log(`🔗 View on explorer: ${this.getExplorerUrl(tx.hash)}`);

      const receipt = await tx.wait();

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      const actualCost = receipt.gasUsed * (receipt.gasPrice || gasPrice);
      const actualCostSomi = ethers.formatEther(actualCost);
      console.log(`💰 Actual cost: ${actualCostSomi} SOMI`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPriceGwei: gasPriceGwei,
        costSomi: actualCostSomi,
        timestamp: Date.now(),
        explorerUrl: this.getExplorerUrl(tx.hash),
        network: this.network,
      };
    } catch (error) {
      console.error("❌ Blockchain recording error:", error);

      if (error.message.includes("insufficient funds")) {
        console.error("❌ Wallet has insufficient SOMI for gas fees");
        const balance = await this.getWalletBalance();
        console.error(`Current balance: ${balance} SOMI`);
      }

      throw new Error(`Failed to record on blockchain: ${error.message}`);
    }
  }

  getExplorerUrl(txHash) {
    const explorers = {
      mainnet: `https://explorer.somnia.network/tx/${txHash}`,
      testnet: `https://shannon-explorer.somnia.network/tx/${txHash}`,
    };
    return explorers[this.network] || explorers.testnet;
  }

  async verifyCertificate(certificateNumber) {
    try {
      const result = await this.contract.verifyCertificate(certificateNumber);

      return {
        exists: result[0],
        studentName: result[1],
        courseTitle: result[2],
        instructor: result[3],
        completedDate: new Date(Number(result[4]) * 1000),
        grade: result[5],
        finalScore: Number(result[6]),
      };
    } catch (error) {
      console.error("Verification error:", error);
      return { exists: false };
    }
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice || 0, "gwei");
    } catch (error) {
      console.error("Gas price fetch error:", error);
      return "N/A";
    }
  }

  async getWalletBalance() {
    try {
      if (!this.wallet) {
        await this.initializeWallet();
      }
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Balance check error:", error);
      return "0";
    }
  }

  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      return {
        name: this.network,
        chainId: network.chainId.toString(),
        symbol: this.network === "mainnet" ? "SOMI" : "STT",
      };
    } catch (error) {
      console.error("Network info error:", error);
      return null;
    }
  }
}

let blockchainService = null;
let initPromise = null;

const getBlockchainService = async () => {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
    initPromise = blockchainService.initializeWallet();
  }

  // Wait for wallet to be ready
  if (initPromise) {
    await initPromise;
    initPromise = null;
  }

  return blockchainService;
};

module.exports = {
  BlockchainService,
  getBlockchainService,
};
