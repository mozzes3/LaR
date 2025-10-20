// backend/services/professionalCertificateBlockchainService.js
const { ethers } = require("ethers");

// Professional Certificate ABI
const PROFESSIONAL_CERT_ABI = [
  "function recordCertificate(string certificateNumber, string certificateType, string studentName, string studentWallet, string certificationTitle, string category, string level, uint256 score, string grade, uint16 totalQuestions, uint16 correctAnswers, uint16 attemptNumber, uint256 completedDate, uint256 issuedDate) public returns (bytes32)",
  "function verifyCertificate(string certificateNumber) public view returns (bool exists, bool revoked, string studentName, string certificationTitle, string category, string level, uint256 score, string grade, uint16 correctAnswers, uint16 totalQuestions, uint256 completedDate, uint256 issuedDate)",
  "function isCertificateValid(string certificateNumber) public view returns (bool)",
  "function getCertificateByNumber(string certificateNumber) public view returns (tuple(string certificateNumber, string certificateType, string studentName, string studentWallet, string certificationTitle, string category, string level, uint256 score, string grade, uint16 totalQuestions, uint16 correctAnswers, uint16 attemptNumber, uint256 completedDate, uint256 issuedDate, uint256 recordedAt, bool exists, bool revoked, string revokedReason))",
  "event CertificateRecorded(bytes32 indexed certificateHash, string certificateNumber, string studentName, string certificationTitle, uint256 score, string grade, uint256 timestamp)",
];

/**
 * Extend existing BlockchainService with professional certificate methods
 */
class ProfessionalCertificateBlockchainService {
  constructor(blockchainService) {
    this.service = blockchainService;
    this.provider = blockchainService.provider;
    this.wallet = blockchainService.wallet;
    this.contractAddress = process.env.PROFESSIONAL_CERT_CONTRACT_ADDRESS;
    this.network = blockchainService.network;

    if (!this.contractAddress) {
      console.warn(
        "⚠️ PROFESSIONAL_CERT_CONTRACT_ADDRESS not set - professional certificates will not be recorded on blockchain"
      );
      this.contract = null;
    } else {
      this.contract = new ethers.Contract(
        this.contractAddress,
        PROFESSIONAL_CERT_ABI,
        this.wallet
      );
      console.log(
        "✅ Professional Certificate Contract initialized:",
        this.contractAddress
      );
    }
  }

  /**
   * Record professional certificate on blockchain
   * Gas optimized with proper uint16 handling
   */
  async recordProfessionalCertificate(certificateData) {
    try {
      if (!this.contract) {
        throw new Error("Professional certificate contract not initialized");
      }

      const {
        certificateNumber,
        certificateType,
        studentName,
        studentWallet,
        certificationTitle,
        category,
        level,
        score,
        grade,
        totalQuestions,
        correctAnswers,
        attemptNumber,
        completedDate,
        issuedDate,
      } = certificateData;

      console.log(
        `📝 Recording professional certificate: ${certificateNumber}`
      );

      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
      console.log(`⛽ Gas price: ${gasPriceGwei} gwei`);

      // Convert dates to timestamps
      const completedTimestamp = Math.floor(
        new Date(completedDate).getTime() / 1000
      );
      const issuedTimestamp = Math.floor(new Date(issuedDate).getTime() / 1000);

      // Estimate gas
      const gasEstimate = await this.contract.recordCertificate.estimateGas(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet || "Not Connected",
        certificationTitle,
        category,
        level,
        Math.floor(score), // uint256
        grade,
        totalQuestions, // uint16
        correctAnswers, // uint16
        attemptNumber, // uint16
        completedTimestamp,
        issuedTimestamp
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Add 20% buffer for safety
      const gasLimit = gasEstimate + (gasEstimate * 20n) / 100n;

      // Send transaction
      const tx = await this.contract.recordCertificate(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet || "Not Connected",
        certificationTitle,
        category,
        level,
        Math.floor(score),
        grade,
        totalQuestions,
        correctAnswers,
        attemptNumber,
        completedTimestamp,
        issuedTimestamp,
        {
          gasLimit,
          gasPrice,
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      // Calculate actual cost
      const gasCost = receipt.gasUsed * gasPrice;
      const gasCostEth = ethers.formatEther(gasCost);
      console.log(
        `💰 Transaction cost: ${gasCostEth} ${
          this.network === "mainnet" ? "STT" : "testnet STT"
        }`
      );

      // Get explorer URL
      const explorerBaseUrl =
        this.network === "mainnet"
          ? "https://somniascan.io"
          : "https://testnet.somniascan.io";
      const explorerUrl = `${explorerBaseUrl}/tx/${tx.hash}`;

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        network: this.network,
      };
    } catch (error) {
      console.error(
        "❌ Professional certificate blockchain recording failed:",
        error
      );

      // Parse error for better logging
      if (error.reason) {
        console.error("Error reason:", error.reason);
      }
      if (error.data) {
        console.error("Error data:", error.data);
      }

      throw new Error(`Blockchain recording failed: ${error.message}`);
    }
  }

  /**
   * Verify professional certificate on blockchain
   */
  async verifyProfessionalCertificate(certificateNumber) {
    try {
      if (!this.contract) {
        throw new Error("Professional certificate contract not initialized");
      }

      console.log(
        `🔍 Verifying professional certificate: ${certificateNumber}`
      );

      const result = await this.contract.verifyCertificate(certificateNumber);

      return {
        exists: result.exists,
        revoked: result.revoked,
        studentName: result.studentName,
        certificationTitle: result.certificationTitle,
        category: result.category,
        level: result.level,
        score: Number(result.score),
        grade: result.grade,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        completedDate: new Date(Number(result.completedDate) * 1000),
        issuedDate: new Date(Number(result.issuedDate) * 1000),
      };
    } catch (error) {
      console.error("Certificate verification error:", error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Check if certificate is valid (exists and not revoked)
   */
  async isCertificateValid(certificateNumber) {
    try {
      if (!this.contract) {
        return false;
      }

      const isValid = await this.contract.isCertificateValid(certificateNumber);
      return isValid;
    } catch (error) {
      console.error("Certificate validation error:", error);
      return false;
    }
  }

  /**
   * Get full certificate details from blockchain
   */
  async getCertificateDetails(certificateNumber) {
    try {
      if (!this.contract) {
        throw new Error("Professional certificate contract not initialized");
      }

      const cert = await this.contract.getCertificateByNumber(
        certificateNumber
      );

      return {
        certificateNumber: cert.certificateNumber,
        certificateType: cert.certificateType,
        studentName: cert.studentName,
        studentWallet: cert.studentWallet,
        certificationTitle: cert.certificationTitle,
        category: cert.category,
        level: cert.level,
        score: Number(cert.score),
        grade: cert.grade,
        totalQuestions: cert.totalQuestions,
        correctAnswers: cert.correctAnswers,
        attemptNumber: cert.attemptNumber,
        completedDate: new Date(Number(cert.completedDate) * 1000),
        issuedDate: new Date(Number(cert.issuedDate) * 1000),
        recordedAt: new Date(Number(cert.recordedAt) * 1000),
        exists: cert.exists,
        revoked: cert.revoked,
        revokedReason: cert.revokedReason,
      };
    } catch (error) {
      console.error("Get certificate details error:", error);
      throw new Error(`Failed to get certificate: ${error.message}`);
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      if (!this.contract) {
        return null;
      }

      const stats = await this.contract.getStats();

      return {
        totalIssued: Number(stats.totalIssued),
        totalRevoked: Number(stats.totalRevoked),
        totalActive: Number(stats.totalActive),
        isPaused: stats.isPaused,
      };
    } catch (error) {
      console.error("Get contract stats error:", error);
      return null;
    }
  }
}

// Singleton instance
let professionalCertBlockchainService = null;

const getProfessionalCertBlockchainService = () => {
  if (!professionalCertBlockchainService) {
    const { getBlockchainService } = require("./blockchainService");
    const baseService = getBlockchainService();
    professionalCertBlockchainService =
      new ProfessionalCertificateBlockchainService(baseService);
  }
  return professionalCertBlockchainService;
};

module.exports = {
  ProfessionalCertificateBlockchainService,
  getProfessionalCertBlockchainService,
};
