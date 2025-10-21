// backend/services/ipfsService.js
const axios = require("axios");
const FormData = require("form-data");

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.pinataGateway =
      process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud";

    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn(
        "⚠️ PINATA credentials not configured - NFT minting will fail"
      );
    } else {
      console.log("✅ IPFS Service initialized with Pinata");
    }
  }

  /**
   * Upload image to IPFS
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - File name
   * @returns {Promise<{url: string, ipfsHash: string}>}
   */
  async uploadImage(imageBuffer, fileName) {
    try {
      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: fileName,
        contentType: "image/png",
      });

      const pinataMetadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          type: "certificate-image",
          uploadedAt: new Date().toISOString(),
        },
      });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append("pinataOptions", pinataOptions);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const url = `${this.pinataGateway}/ipfs/${ipfsHash}`;

      console.log(`✅ Image uploaded to IPFS: ${ipfsHash}`);

      return {
        url,
        ipfsHash,
        gateway: this.pinataGateway,
      };
    } catch (error) {
      console.error(
        "❌ IPFS image upload failed:",
        error.response?.data || error.message
      );
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param {object} metadata - NFT metadata object
   * @returns {Promise<{url: string, ipfsHash: string}>}
   */
  async uploadMetadata(metadata) {
    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}-metadata.json`,
            keyvalues: {
              type: "certificate-metadata",
              certificateNumber: metadata.attributes?.find(
                (a) => a.trait_type === "Certificate Number"
              )?.value,
              uploadedAt: new Date().toISOString(),
            },
          },
          pinataOptions: {
            cidVersion: 1,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const url = `${this.pinataGateway}/ipfs/${ipfsHash}`;

      console.log(`✅ Metadata uploaded to IPFS: ${ipfsHash}`);

      return {
        url,
        ipfsHash,
        gateway: this.pinataGateway,
      };
    } catch (error) {
      console.error(
        "❌ IPFS metadata upload failed:",
        error.response?.data || error.message
      );
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
  }

  /**
   * Pin existing IPFS hash
   * @param {string} ipfsHash - IPFS hash to pin
   * @param {string} name - Name for the pin
   */
  async pinByHash(ipfsHash, name) {
    try {
      await axios.post(
        "https://api.pinata.cloud/pinning/pinByHash",
        {
          hashToPin: ipfsHash,
          pinataMetadata: {
            name,
          },
        },
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      console.log(`✅ Pinned existing hash: ${ipfsHash}`);
    } catch (error) {
      console.error(
        "❌ Pin by hash failed:",
        error.response?.data || error.message
      );
      throw new Error(`Pin failed: ${error.message}`);
    }
  }

  /**
   * Unpin content from IPFS
   * @param {string} ipfsHash - IPFS hash to unpin
   */
  async unpin(ipfsHash) {
    try {
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
      });

      console.log(`✅ Unpinned: ${ipfsHash}`);
    } catch (error) {
      console.error("❌ Unpin failed:", error.response?.data || error.message);
    }
  }

  /**
   * Get pinned files list
   */
  async getPinnedFiles(filters = {}) {
    try {
      const response = await axios.get(
        "https://api.pinata.cloud/data/pinList",
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          params: filters,
        }
      );

      return response.data.rows;
    } catch (error) {
      console.error("❌ Get pinned files failed:", error.message);
      throw new Error(`Get files failed: ${error.message}`);
    }
  }

  /**
   * Test Pinata connection
   */
  async testConnection() {
    try {
      const response = await axios.get(
        "https://api.pinata.cloud/data/testAuthentication",
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      console.log("✅ Pinata connection successful:", response.data.message);
      return true;
    } catch (error) {
      console.error(
        "❌ Pinata connection failed:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

let ipfsServiceInstance = null;

function getIPFSService() {
  if (!ipfsServiceInstance) {
    ipfsServiceInstance = new IPFSService();
  }
  return ipfsServiceInstance;
}

module.exports = {
  getIPFSService,
  IPFSService,
};
