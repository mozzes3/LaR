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

    this.competencyContractAddress =
      process.env.COMPETENCY_NFT_CONTRACT_ADDRESS;
    this.completionContractAddress =
      process.env.COMPLETION_NFT_CONTRACT_ADDRESS;

    if (!this.competencyContractAddress) {
      console.warn(
        "⚠️ COMPETENCY_NFT_CONTRACT_ADDRESS not set - Competency NFT minting disabled"
      );
      this.competencyContract = null;
    } else {
      if (!this.wallet) {
        console.warn(
          "⚠️ Wallet not initialized yet for Competency NFT service"
        );
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

  async ensureContractsReady() {
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
   * Mint Certificate of Competency NFT
   */
  async mintCompetencyCertificate(
    studentWallet,
    certificateNumber,
    metadataURI
  ) {
    try {
      await this.ensureContractsReady();

      if (!this.competencyContract) {
        throw new Error("Competency NFT contract not initialized");
      }

      if (!ethers.isAddress(studentWallet)) {
        throw new Error("Invalid student wallet address");
      }

      console.log(`🎨 Minting Competency NFT for ${studentWallet}`);
      console.log(`📋 Certificate: ${certificateNumber}`);
      console.log(`🔗 Metadata: ${metadataURI}`);

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const gasEstimate =
        await this.competencyContract.mintCertificate.estimateGas(
          studentWallet,
          certificateNumber,
          metadataURI
        );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      const tx = await this.competencyContract.mintCertificate(
        studentWallet,
        certificateNumber,
        metadataURI,
        {
          gasLimit: (gasEstimate * 120n) / 100n,
          gasPrice: (gasPrice * 110n) / 100n,
        }
      );

      console.log(`⏳ NFT mint transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ NFT minted successfully!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);

      const event = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          this.competencyContract.interface.getEvent("CertificateMinted")
            .topicHash
      );

      let tokenId = null;
      if (event) {
        const decoded = this.competencyContract.interface.parseLog(event);
        tokenId = decoded.args.tokenId.toString();
        console.log(`🎫 Token ID: ${tokenId}`);
      }

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        tokenId: tokenId,
        contractAddress: this.competencyContractAddress,
        explorerUrl: `https://somnia.network/tx/${tx.hash}`,
      };
    } catch (error) {
      console.error("❌ NFT minting error:", error);
      throw error;
    }
  }

  /**
   * Mint Certificate of Completion NFT
   */
  async mintCompletionCertificate(
    studentWallet,
    certificateNumber,
    metadataURI
  ) {
    try {
      await this.ensureContractsReady();

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

      const gasEstimate =
        await this.completionContract.mintCertificate.estimateGas(
          studentWallet,
          certificateNumber,
          metadataURI
        );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      const tx = await this.completionContract.mintCertificate(
        studentWallet,
        certificateNumber,
        metadataURI,
        {
          gasLimit: (gasEstimate * 120n) / 100n,
          gasPrice: (gasPrice * 110n) / 100n,
        }
      );

      console.log(`⏳ NFT mint transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ NFT minted successfully!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);

      const event = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          this.completionContract.interface.getEvent("CertificateMinted")
            .topicHash
      );

      let tokenId = null;
      if (event) {
        const decoded = this.completionContract.interface.parseLog(event);
        tokenId = decoded.args.tokenId.toString();
        console.log(`🎫 Token ID: ${tokenId}`);
      }

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        tokenId: tokenId,
        contractAddress: this.completionContractAddress,
        explorerUrl: `https://somnia.network/tx/${tx.hash}`,
      };
    } catch (error) {
      console.error("❌ NFT minting error:", error);
      throw error;
    }
  }

  /**
   * Batch mint Competency NFTs
   */
  async batchMintCompetencyCertificates(
    students,
    certificateNumbers,
    metadataURIs
  ) {
    try {
      await this.ensureContractsReady();

      if (!this.competencyContract) {
        throw new Error("Competency NFT contract not initialized");
      }

      console.log(`🎨 Batch minting ${students.length} Competency NFTs`);

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const tx = await this.competencyContract.batchMintCertificates(
        students,
        certificateNumbers,
        metadataURIs,
        {
          gasPrice: (gasPrice * 110n) / 100n,
        }
      );

      console.log(`⏳ Batch mint transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Batch minted successfully!`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        count: students.length,
      };
    } catch (error) {
      console.error("❌ Batch minting error:", error);
      throw error;
    }
  }

  /**
   * Verify certificate NFT exists (Competency)
   */
  async verifyCompetencyCertificate(certificateNumber) {
    try {
      await this.ensureContractsReady();

      if (!this.competencyContract) {
        throw new Error("Competency NFT contract not initialized");
      }

      const exists = await this.competencyContract.certificateExists(
        certificateNumber
      );
      return exists;
    } catch (error) {
      console.error("❌ Certificate verification error:", error);
      return false;
    }
  }

  /**
   * Verify certificate NFT exists (Completion)
   */
  async verifyCompletionCertificate(certificateNumber) {
    try {
      await this.ensureContractsReady();

      if (!this.completionContract) {
        throw new Error("Completion NFT contract not initialized");
      }

      const exists = await this.completionContract.certificateExists(
        certificateNumber
      );
      return exists;
    } catch (error) {
      console.error("❌ Certificate verification error:", error);
      return false;
    }
  }
}

let nftBlockchainService = null;

const getNFTBlockchainService = async () => {
  if (!nftBlockchainService) {
    const { getBlockchainService } = require("./blockchainService");
    const baseService = await getBlockchainService();
    nftBlockchainService = new NFTBlockchainService(baseService);
  }
  return nftBlockchainService;
};

module.exports = {
  NFTBlockchainService,
  getNFTBlockchainService,
};
