const { ethers } = require("ethers");

/**
 * Verify wallet signature
 * @param {string} walletAddress - User's wallet address
 * @param {string} signature - Signed message
 * @param {string} message - Original message that was signed
 * @returns {boolean} - True if signature is valid
 */
const verifyWalletSignature = async (walletAddress, signature, message) => {
  try {
    // Recover the address from signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};

/**
 * Generate nonce message for signing
 * @param {string} walletAddress - User's wallet address
 * @param {string} nonce - Random nonce
 * @returns {string} - Message to sign
 */
const generateSignMessage = (walletAddress, nonce) => {
  return `Welcome to Founder Academy!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

/**
 * Generate random nonce
 * @returns {string} - Random nonce
 */
const generateNonce = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

module.exports = {
  verifyWalletSignature,
  generateSignMessage,
  generateNonce,
};
