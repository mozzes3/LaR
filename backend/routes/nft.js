// backend/routes/nft.js
const express = require("express");
const router = express.Router();
const { authLimiter, criticalLimiter } = require("../middleware/rateLimits");
const { ethers } = require("ethers");

const CONTRACT_ADDRESS = "0x9094CFF8A9980b817fE5fa04fd3c9b44663d3e23";
const RPC_URL = "https://dream-rpc.somnia.network";

const ABI = [
  "function tokenURI(uint256 tokenId) external view returns (string)",
];

router.get("/:tokenId", authLimiter, async (req, res) => {
  try {
    const { tokenId } = req.params;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const metadataURI = await contract.tokenURI(tokenId);

    const response = await fetch(metadataURI);
    const metadata = await response.json();

    res.json({
      success: true,
      tokenId,
      metadataURI,
      ...metadata,
    });
  } catch (error) {
    console.error("NFT fetch error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
