// backend/services/professionalCertificateBlockchainService.js
const { ethers } = require("ethers");

// UPDATED ABI - Matches simplified contract (no uint16 fields, no level, no revoked)
const PROFESSIONAL_CERT_ABI = [
  "function recordCertificate(string certificateNumber, string certificateType, string studentName, string studentWallet, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate) public returns (bytes32)",
  "function verifyCertificate(string certificateNumber) public view returns (bool exists, string studentName, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate)",
  "function isCertificateValid(string certificateNumber) public view returns (bool)",
  "function getCertificateByNumber(string certificateNumber) public view returns (tuple(string certificateNumber, string certificateType, string studentName, string studentWallet, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate, uint256 recordedAt, bool exists))",
  "event CertificateRecorded(bytes32 indexed certificateHash, string certificateNumber, string studentName, string certificationTitle, uint256 timestamp)",
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
   * UPDATED: Matches simplified contract (10 parameters)
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
        score,
        grade,
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

      console.log("📋 Certificate data:", {
        certificateNumber,
        certificateType,
        studentName,
        certificationTitle,
        category,
        score,
        grade,
      });

      // Estimate gas
      const gasEstimate = await this.contract.recordCertificate.estimateGas(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet || "Not Connected",
        certificationTitle,
        category,
        grade,
        score,
        completedTimestamp,
        issuedTimestamp
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Send transaction with 20% gas buffer
      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await this.contract.recordCertificate(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet || "Not Connected",
        certificationTitle,
        category,
        grade,
        score,
        completedTimestamp,
        issuedTimestamp,
        {
          gasLimit: gasLimit,
          gasPrice: gasPrice,
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(
        `⛽ Gas used: ${receipt.gasUsed.toString()} (${
          this.network === "mainnet" ? "STT" : "testnet STT"
        })`
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
        studentName: result.studentName,
        certificationTitle: result.certificationTitle,
        category: result.category,
        grade: result.grade,
        score: Number(result.score),
        completedDate: new Date(Number(result.completedDate) * 1000),
        issuedDate: new Date(Number(result.issuedDate) * 1000),
      };
    } catch (error) {
      console.error("Certificate verification error:", error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Check if certificate is valid
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
        grade: cert.grade,
        score: Number(cert.score),
        completedDate: new Date(Number(cert.completedDate) * 1000),
        issuedDate: new Date(Number(cert.issuedDate) * 1000),
        recordedAt: new Date(Number(cert.recordedAt) * 1000),
        exists: cert.exists,
      };
    } catch (error) {
      console.error("Get certificate details error:", error);
      throw new Error(`Failed to get certificate: ${error.message}`);
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
