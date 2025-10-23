// backend/modules/payment/controllers/testController.js
const { ethers } = require("ethers");
const PaymentToken = require("../models/PaymentToken");

exports.testConnection = async (req, res) => {
  try {
    // Step 1: Check database
    const token = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    if (!token) {
      return res.json({
        success: false,
        error: "Token not found in database",
      });
    }

    // Step 2: Simple RPC test
    const provider = new ethers.JsonRpcProvider(token.rpcUrl);
    const blockNumber = await provider.getBlockNumber();

    // Return simple success
    res.json({
      success: true,
      database: "connected",
      rpc: "connected",
      blockNumber,
      tokenConfig: {
        symbol: token.symbol,
        contract: token.paymentContractAddress,
        tokenAddress: token.contractAddress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.testContract = async (req, res) => {
  try {
    const token = await PaymentToken.findOne({
      symbol: "USDC",
      chainId: 11155111,
    });

    const provider = new ethers.JsonRpcProvider(token.rpcUrl);

    // Minimal contract ABI
    const abi = ["function platformWallet() view returns (address)"];
    const contract = new ethers.Contract(
      token.paymentContractAddress,
      abi,
      provider
    );

    const wallet = await contract.platformWallet();

    res.json({
      success: true,
      contractAddress: token.paymentContractAddress,
      platformWallet: wallet,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
