// backend/services/blockchainService.js
const { ethers } = require("ethers");

// ABI for certificate verification contract
const CERTIFICATE_ABI = [
  "function recordCertificate(string certificateNumber, string studentName, string studentWallet, string courseTitle, string instructor, uint256 completedDate, string grade, uint256 finalScore, uint256 totalHours, uint256 totalLessons) public returns (bytes32)",
  "event CertificateRecorded(bytes32 indexed certificateHash, string certificateNumber, address indexed student, uint256 timestamp)",
];

class BlockchainService {
  constructor() {
    // Initialize provider - using a public RPC or your own
    this.provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "https://polygon-rpc.com"
    );

    // Create wallet for backend signing
    this.wallet = new ethers.Wallet(
      process.env.BLOCKCHAIN_PRIVATE_KEY,
      this.provider
    );

    // Contract address (deploy your contract first)
    this.contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS;

    // Create contract instance
    this.contract = new ethers.Contract(
      this.contractAddress,
      CERTIFICATE_ABI,
      this.wallet
    );
  }

  /**
   * Record certificate on blockchain
   * Backend automatically signs and pays gas fees
   */
  async recordCertificate(certificateData) {
    try {
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
        `📝 Recording certificate on blockchain: ${certificateNumber}`
      );

      // Convert date to timestamp
      const timestamp = Math.floor(new Date(completedDate).getTime() / 1000);

      // Send transaction (backend pays gas)
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
        totalLessons
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Date.now(),
        explorerUrl: this.getExplorerUrl(tx.hash),
      };
    } catch (error) {
      console.error("❌ Blockchain recording error:", error);
      throw new Error(`Failed to record on blockchain: ${error.message}`);
    }
  }

  /**
   * Get blockchain explorer URL
   */
  getExplorerUrl(txHash) {
    const network = process.env.BLOCKCHAIN_NETWORK || "polygon";
    const explorers = {
      polygon: `https://polygonscan.com/tx/${txHash}`,
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
    };
    return explorers[network] || explorers.polygon;
  }

  /**
   * Verify certificate exists on blockchain
   */
  async verifyCertificate(certificateNumber) {
    try {
      // Query blockchain for certificate
      const hash = ethers.solidityPackedKeccak256(
        ["string"],
        [certificateNumber]
      );

      // This would require a view function in your smart contract
      // Just returning true for now - implement based on your contract
      return true;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice || 0, "gwei");
    } catch (error) {
      console.error("Gas price fetch error:", error);
      return "N/A";
    }
  }

  /**
   * Check wallet balance (for monitoring)
   */
  async getWalletBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Balance check error:", error);
      return "0";
    }
  }
}

// Singleton instance
let blockchainService = null;

const getBlockchainService = () => {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
  }
  return blockchainService;
};

module.exports = { getBlockchainService };
