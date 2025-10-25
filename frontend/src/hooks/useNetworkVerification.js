import { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

// Chain configurations
const CHAIN_CONFIGS = {
  1: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  137: {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  56: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
};

export const useNetworkVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyAndSwitchNetwork = async (provider, requiredChainId) => {
    if (!provider) {
      toast.error("No wallet connected");
      return false;
    }

    setIsVerifying(true);

    try {
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Already on correct network
      if (currentChainId === requiredChainId) {
        return true;
      }

      // Request network switch
      const chainConfig = CHAIN_CONFIGS[requiredChainId];
      if (!chainConfig) {
        toast.error(`Unsupported network: Chain ID ${requiredChainId}`);
        return false;
      }

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainConfig.chainId }],
        });

        toast.success(`Switched to ${chainConfig.chainName}`);
        return true;
      } catch (switchError) {
        // Network not added to wallet, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [chainConfig],
            });

            toast.success(`Added and switched to ${chainConfig.chainName}`);
            return true;
          } catch (addError) {
            toast.error("Failed to add network");
            return false;
          }
        } else {
          toast.error("Failed to switch network");
          return false;
        }
      }
    } catch (error) {
      console.error("Network verification error:", error);
      toast.error("Network verification failed");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return { verifyAndSwitchNetwork, isVerifying };
};
