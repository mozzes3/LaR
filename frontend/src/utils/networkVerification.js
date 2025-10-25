import toast from "react-hot-toast";
import { getExpectedRegistry } from "@config/registryAddresses";

export const verifyAndSwitchNetwork = async (provider, paymentToken) => {
  if (!provider || !paymentToken) {
    toast.error("Invalid provider or payment token");
    return false;
  }

  try {
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);
    const requiredChainId = paymentToken.chainId;

    console.log(`🔍 Current: ${currentChainId}, Required: ${requiredChainId}`);

    if (currentChainId === requiredChainId) {
      console.log("✅ Correct network");
      return true;
    }

    const chainIdHex = `0x${requiredChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });

      toast.success(`Switched to ${paymentToken.chainName}`);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: paymentToken.chainName,
                nativeCurrency: {
                  name:
                    paymentToken.blockchain === "ethereum"
                      ? "Ethereum"
                      : "Token",
                  symbol:
                    paymentToken.blockchain === "ethereum" ? "ETH" : "TOKEN",
                  decimals: 18,
                },
                rpcUrls: [paymentToken.rpcUrl],
                blockExplorerUrls: [paymentToken.explorerUrl],
              },
            ],
          });

          toast.success(`Added ${paymentToken.chainName}`);
          return true;
        } catch (addError) {
          toast.error("Failed to add network");
          return false;
        }
      } else if (switchError.code === 4001) {
        toast.error("Network switch rejected");
        return false;
      } else {
        toast.error("Failed to switch network");
        return false;
      }
    }
  } catch (error) {
    console.error("Network verification error:", error);
    toast.error("Network verification failed");
    return false;
  }
};

export const verifyRegistryAddress = (paymentToken) => {
  const expectedRegistry = getExpectedRegistry(paymentToken.chainId);

  if (!expectedRegistry) {
    console.warn(`No registry configured for chain ${paymentToken.chainId}`);
    return true; // Allow if not configured
  }

  // Frontend check: Does backend's registry match our hardcoded one?
  if (
    paymentToken.registryAddress?.toLowerCase() !==
    expectedRegistry.toLowerCase()
  ) {
    console.error("❌ CRITICAL: Registry address mismatch!");
    console.error(`Expected: ${expectedRegistry}`);
    console.error(`Backend returned: ${paymentToken.registryAddress}`);

    toast.error("Security verification failed. Payment blocked.");
    return false;
  }

  return true;
};

export const verifyTokenContract = async (
  provider,
  tokenAddress,
  paymentToken
) => {
  try {
    if (
      tokenAddress.toLowerCase() !== paymentToken.contractAddress.toLowerCase()
    ) {
      console.error("❌ Token address mismatch");
      toast.error("Token contract mismatch. Payment aborted.");
      return false;
    }

    console.log("✅ Token contract verified");
    return true;
  } catch (error) {
    console.error("Token verification error:", error);
    toast.error("Failed to verify token");
    return false;
  }
};
