// backend/services/nftBlockchainService.js
const { ethers } = require("ethers");

const COMPETENCY_NFT_ABI = [
  "function mintCertificate(address student, string certificateNumber, string metadataURI) external returns (uint256)",
  "function batchMintCertificates(address[] students, string[] certificateNumbers, string[] metadataURIs) external",
  "function getCertificateByNumber(string certificateNumber) external view returns (uint256 tokenId, address student, string metadataURI, uint256 mintedAt)",
  "function getCertificatesByStudent(address student) external view returns (uint256[])",
  "function certificateExists(string certificateNumber) external view returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event CertificateMinted(uint256 indexed tokenId, string certificateNumber, address indexed student, string metadataURI, uint256 mintedAt)",
];

// NEW: Same ABI for Completion certificates
const COMPLETION_NFT_ABI = [
  "function mintCertificate(address student, string certificateNumber, string metadataURI) external returns (uint256)",
  "function batchMintCertificates(address[] students, string[] certificateNumbers, string[] metadataURIs) external",
  "function getCertificateByNumber(string certificateNumber) external view returns (uint256 tokenId, address student, string metadataURI, uint256 mintedAt)",
  "function getCertificatesByStudent(address student) external view returns (uint256[])",
  "function certificateExists(string certificateNumber) external view returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event CertificateMinted(uint256 indexed tokenId, string certificateNumber, address indexed student, string metadataURI, uint256 mintedAt)",
];

class NFTBlockchainService {
  constructor(blockchainService) {
    this.service = blockchainService;
    this.provider = blockchainService.provider;
    this.wallet = blockchainService.wallet;
    this.network = blockchainService.network;

    // EXISTING: Competency contract setup (unchanged)
    this.competencyContractAddress =
      process.env.COMPETENCY_NFT_CONTRACT_ADDRESS;

    if (!this.competencyContractAddress) {
      console.warn(
        "⚠️ COMPETENCY_NFT_CONTRACT_ADDRESS not set - NFT minting disabled"
      );
      this.competencyContract = null;
    } else {
      if (!this.wallet) {
        console.warn("⚠️ Wallet not initialized yet for NFT service");
        this.competencyContract = null;
      } else {
        this.competencyContract = new ethers.Contract(
          this.competencyContractAddress,
          COMPETENCY_NFT_ABI,
          this.wallet
        );
        console.log(
          "✅ Competency NFT Contract initialized:",
          this.competencyContractAddress
        );
      }
    }

    // NEW: Completion contract setup
    this.completionContractAddress =
      process.env.COMPLETION_NFT_CONTRACT_ADDRESS;

    if (!this.completionContractAddress) {
      console.warn(
        "⚠️ COMPLETION_NFT_CONTRACT_ADDRESS not set - Completion NFT minting disabled"
      );
      this.completionContract = null;
    } else {
      if (!this.wallet) {
        console.warn(
          "⚠️ Wallet not initialized yet for Completion NFT service"
        );
        this.completionContract = null;
      } else {
        this.completionContract = new ethers.Contract(
          this.completionContractAddress,
          COMPLETION_NFT_ABI,
          this.wallet
        );
        console.log(
          "✅ Completion NFT Contract initialized:",
          this.completionContractAddress
        );
      }
    }
  }

  async ensureContractReady() {
    // EXISTING: Competency contract delayed init (unchanged)
    if (!this.competencyContract && this.competencyContractAddress) {
      this.wallet = this.service.wallet;
      if (this.wallet) {
        this.competencyContract = new ethers.Contract(
          this.competencyContractAddress,
          COMPETENCY_NFT_ABI,
          this.wallet
        );
        console.log("✅ Competency NFT Contract initialized (delayed)");
      }
    }

    // NEW: Completion contract delayed init
    if (!this.completionContract && this.completionContractAddress) {
      this.wallet = this.service.wallet;
      if (this.wallet) {
        this.completionContract = new ethers.Contract(
          this.completionContractAddress,
          COMPLETION_NFT_ABI,
          this.wallet
        );
        console.log("✅ Completion NFT Contract initialized (delayed)");
      }
    }
  }

  /**
   * EXISTING: Mint Certificate of Competency NFT (UNCHANGED - your working version)
   */
  async mintCertificateNFT(certificateData, metadataURI) {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        throw new Error("Competency NFT contract not initialized");
      }

      const { studentWallet, certificateNumber } = certificateData;

      console.log(
        `🎨 Minting Certificate of Competency NFT: ${certificateNumber}`
      );
      console.log(`👤 Student wallet: ${studentWallet}`);
      console.log(`📎 Metadata URI: ${metadataURI}`);

      // Get gas estimate
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
      console.log(`⛽ Gas price: ${gasPriceGwei} gwei`);

      // Estimate gas
      const gasEstimate =
        await this.competencyContract.mintCertificate.estimateGas(
          studentWallet,
          certificateNumber,
          metadataURI
        );
      console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);

      // Mint NFT
      const tx = await this.competencyContract.mintCertificate(
        studentWallet,
        certificateNumber,
        metadataURI,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // 20% buffer
          gasPrice: gasPrice,
        }
      );

      console.log(`📝 NFT mint transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`✅ NFT minted in block ${receipt.blockNumber}`);

      // Extract tokenId from event
      const mintEvent = receipt.logs.find((log) => {
        try {
          const parsed = this.competencyContract.interface.parseLog(log);
          return parsed.name === "CertificateMinted";
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = this.competencyContract.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
        console.log(`🎫 Token ID: ${tokenId}`);
      }

      const explorerUrl = `https://shannon-explorer.somnia.network/tx/${tx.hash}`;

      return {
        success: true,
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        network: this.network,
      };
    } catch (error) {
      console.error("❌ NFT mint failed:", error);

      if (error.reason) {
        console.error("Error reason:", error.reason);
      }
      if (error.data) {
        console.error("Error data:", error.data);
      }

      throw new Error(`NFT mint failed: ${error.message}`);
    }
  }

  /**
   * NEW: Mint Certificate of Completion NFT
   */
  async mintCompletionCertificate(
    studentWallet,
    certificateNumber,
    metadataURI
  ) {
    try {
      await this.ensureContractReady();

      if (!this.completionContract) {
        throw new Error("Completion NFT contract not initialized");
      }

      if (!ethers.isAddress(studentWallet)) {
        throw new Error("Invalid student wallet address");
      }

      console.log(`🎨 Minting Completion NFT for ${studentWallet}`);
      console.log(`📋 Certificate: ${certificateNumber}`);
      console.log(`🔗 Metadata: ${metadataURI}`);

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
      console.log(`⛽ Gas price: ${gasPriceGwei} gwei`);

      const gasEstimate =
        await this.completionContract.mintCertificate.estimateGas(
          studentWallet,
          certificateNumber,
          metadataURI
        );
      console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);

      const tx = await this.completionContract.mintCertificate(
        studentWallet,
        certificateNumber,
        metadataURI,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // 20% buffer
          gasPrice: gasPrice,
        }
      );

      console.log(`📝 Completion NFT mint transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`✅ Completion NFT minted in block ${receipt.blockNumber}`);

      // Extract tokenId from event
      const mintEvent = receipt.logs.find((log) => {
        try {
          const parsed = this.completionContract.interface.parseLog(log);
          return parsed.name === "CertificateMinted";
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = this.completionContract.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
        console.log(`🎫 Token ID: ${tokenId}`);
      }

      const explorerUrl = `https://shannon-explorer.somnia.network/tx/${tx.hash}`;

      return {
        success: true,
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        network: this.network,
        contractAddress: this.completionContractAddress,
      };
    } catch (error) {
      console.error("❌ Completion NFT mint failed:", error);

      if (error.reason) {
        console.error("Error reason:", error.reason);
      }
      if (error.data) {
        console.error("Error data:", error.data);
      }

      throw new Error(`Completion NFT mint failed: ${error.message}`);
    }
  }

  /**
   * EXISTING: Batch mint multiple Competency NFTs (UNCHANGED)
   */
  async batchMintCertificates(certificates) {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        throw new Error("Competency NFT contract not initialized");
      }

      const students = certificates.map((c) => c.studentWallet);
      const certificateNumbers = certificates.map((c) => c.certificateNumber);
      const metadataURIs = certificates.map((c) => c.metadataURI);

      console.log(`🎨 Batch minting ${certificates.length} NFTs`);

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const gasEstimate =
        await this.competencyContract.batchMintCertificates.estimateGas(
          students,
          certificateNumbers,
          metadataURIs
        );

      const tx = await this.competencyContract.batchMintCertificates(
        students,
        certificateNumbers,
        metadataURIs,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
          gasPrice,
        }
      );

      console.log(`📝 Batch mint transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Batch minted in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        count: certificates.length,
      };
    } catch (error) {
      console.error("❌ Batch mint failed:", error);
      throw new Error(`Batch mint failed: ${error.message}`);
    }
  }

  /**
   * EXISTING: Get NFT details by certificate number (UNCHANGED)
   */
  async getCertificateNFT(certificateNumber) {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        return null;
      }

      const result = await this.competencyContract.getCertificateByNumber(
        certificateNumber
      );

      return {
        tokenId: result.tokenId.toString(),
        student: result.student,
        metadataURI: result.metadataURI,
        mintedAt: new Date(Number(result.mintedAt) * 1000),
      };
    } catch (error) {
      console.error("NFT lookup failed:", error);
      return null;
    }
  }

  /**
   * EXISTING: Get all NFTs owned by a student (UNCHANGED)
   */
  async getStudentNFTs(studentWallet) {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        return [];
      }

      const tokenIds = await this.competencyContract.getCertificatesByStudent(
        studentWallet
      );
      return tokenIds.map((id) => id.toString());
    } catch (error) {
      console.error("Get student NFTs failed:", error);
      return [];
    }
  }

  /**
   * EXISTING: Check if certificate NFT exists (UNCHANGED)
   */
  async nftExists(certificateNumber) {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        return false;
      }

      return await this.competencyContract.certificateExists(certificateNumber);
    } catch (error) {
      return false;
    }
  }

  /**
   * EXISTING: Get total NFTs minted (UNCHANGED)
   */
  async getTotalSupply() {
    try {
      await this.ensureContractReady();

      if (!this.competencyContract) {
        return "0";
      }

      const total = await this.competencyContract.totalSupply();
      return total.toString();
    } catch (error) {
      return "0";
    }
  }
}

let nftServiceInstance = null;

async function getNFTBlockchainService() {
  if (!nftServiceInstance) {
    const { getBlockchainService } = require("./blockchainService");
    const blockchainService = await getBlockchainService();
    nftServiceInstance = new NFTBlockchainService(blockchainService);
  }
  return nftServiceInstance;
}

module.exports = {
  getNFTBlockchainService,
  NFTBlockchainService,
};
