// backend/services/professionalCertificateBlockchainService.js
const { ethers } = require("ethers");
const fs = require("fs").promises;
const path = require("path");

const PROFESSIONAL_CERT_ABI = [
  "function recordCertificate(string certificateNumber, string certificateType, string studentName, address studentWallet, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate) returns (uint256)",
  "function verifyCertificate(string certificateNumber) view returns (bool valid, string studentName, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate)",
  "function getCertificateByNumber(string certificateNumber) view returns (tuple(string certificateNumber, string certificateType, string studentName, address studentWallet, string certificationTitle, string category, string grade, uint256 score, uint256 completedDate, uint256 issuedDate, uint256 recordedAt, bool revoked, string metadataURI))",
  "function isCertificateValid(string certificateNumber) view returns (bool)",
  "function certificateToTokenId(string) view returns (uint256)",
  "function authorizedIssuers(address) view returns (bool)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
];

class ProfessionalCertificateBlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = process.env.PROFESSIONAL_CERT_CONTRACT_ADDRESS;
    this.network = "testnet";
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize provider
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
      if (!rpcUrl) {
        throw new Error("BLOCKCHAIN_RPC_URL not configured");
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log("✅ Provider initialized:", rpcUrl);

      // Load wallet from encrypted file
      const walletPath = process.env.WALLET_FILE_PATH;
      const walletPassword = process.env.WALLET_PASSWORD;

      if (!walletPath || !walletPassword) {
        throw new Error("Wallet configuration missing");
      }

      const encryptedJson = await fs.readFile(walletPath, "utf8");
      this.wallet = await ethers.Wallet.fromEncryptedJson(
        encryptedJson,
        walletPassword
      );
      this.wallet = this.wallet.connect(this.provider);

      console.log("✅ Wallet loaded:", this.wallet.address);

      // Initialize contract
      if (!this.contractAddress) {
        console.warn("⚠️ PROFESSIONAL_CERT_CONTRACT_ADDRESS not set");
        return;
      }

      this.contract = new ethers.Contract(
        this.contractAddress,
        PROFESSIONAL_CERT_ABI,
        this.wallet
      );

      console.log(
        "✅ Professional Certificate Contract initialized:",
        this.contractAddress
      );
      this.initialized = true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize ProfessionalCertificateBlockchainService:",
        error
      );
      throw error;
    }
  }

  async recordProfessionalCertificate(certificateData) {
    try {
      await this.initialize();

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

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
      console.log(`⛽ Gas price: ${gasPriceGwei} gwei`);

      const completedTimestamp = Math.floor(
        new Date(completedDate).getTime() / 1000
      );
      const issuedTimestamp = Math.floor(new Date(issuedDate).getTime() / 1000);

      const gasEstimate = await this.contract.recordCertificate.estimateGas(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet,
        certificationTitle,
        category,
        grade,
        score,
        completedTimestamp,
        issuedTimestamp
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await this.contract.recordCertificate(
        certificateNumber,
        certificateType,
        studentName,
        studentWallet,
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
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // EXTRACT TOKEN ID from event logs
      console.log(`🔍 Parsing logs for tokenId...`);
      console.log(`📋 Total logs: ${receipt.logs.length}`);

      let tokenId = null;

      // Try to parse logs
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          console.log(`📝 Found event: ${parsed.name}`);

          if (parsed.name === "CertificateRecorded") {
            tokenId = parsed.args.tokenId.toString();
            console.log(`✅ Token ID extracted from event: ${tokenId}`);
            break;
          }
        } catch (error) {
          // Skip logs that can't be parsed (from other contracts)
          continue;
        }
      }

      // FALLBACK: Query contract directly if event parsing failed
      if (!tokenId) {
        console.log(`⚠️ Event parsing failed, querying contract directly...`);
        try {
          const contractTokenId = await this.contract.certificateToTokenId(
            certificateNumber
          );
          if (contractTokenId && contractTokenId.toString() !== "0") {
            tokenId = contractTokenId.toString();
            console.log(`✅ Token ID from contract query: ${tokenId}`);
          }
        } catch (queryError) {
          console.error(`❌ Failed to query tokenId:`, queryError.message);
        }
      }

      if (!tokenId) {
        console.error(`❌ WARNING: Could not extract tokenId!`);
      } else {
        console.log(`🎨 Final Token ID: ${tokenId}`);
      }

      const explorerUrl = `https://shannon-explorer.somnia.network/tx/${tx.hash}`;

      return {
        success: true,
        hash: tx.hash,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        tokenId,
        contractAddress: this.contractAddress,
        network: this.network,
      };
    } catch (error) {
      console.error(
        "❌ Professional certificate blockchain recording failed:",
        error
      );
      throw new Error(`Blockchain recording failed: ${error.message}`);
    }
  }

  async verifyProfessionalCertificate(certificateNumber) {
    try {
      await this.initialize();

      if (!this.contract) {
        throw new Error("Professional certificate contract not initialized");
      }

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

  async isCertificateValid(certificateNumber) {
    try {
      await this.initialize();

      if (!this.contract) {
        return false;
      }

      return await this.contract.isCertificateValid(certificateNumber);
    } catch (error) {
      console.error("Certificate validation error:", error);
      return false;
    }
  }

  async getCertificateDetails(certificateNumber) {
    try {
      await this.initialize();

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

// Singleton
let professionalCertBlockchainService = null;

const getProfessionalCertBlockchainService = async () => {
  if (!professionalCertBlockchainService) {
    professionalCertBlockchainService =
      new ProfessionalCertificateBlockchainService();
    await professionalCertBlockchainService.initialize();
  }
  return professionalCertBlockchainService;
};

module.exports = {
  ProfessionalCertificateBlockchainService,
  getProfessionalCertBlockchainService,
};
