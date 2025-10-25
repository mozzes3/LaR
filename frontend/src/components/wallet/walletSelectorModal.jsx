import { useState, useEffect } from "react";
import { X, Loader, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const BLOCKCHAINS = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "⟠",
    gradient: "from-blue-500 to-purple-600",
    available: true,
    chainId: 1,
    chainIdHex: "0x1",
    rpcUrl: "https://ethereum.publicnode.com",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "◎",
    gradient: "from-purple-500 to-pink-600",
    available: false,
  },
];

const WalletSelectorModal = ({ isOpen, onClose, onConnect, isConnecting }) => {
  const [selectedBlockchain, setSelectedBlockchain] = useState("ethereum");
  const [detectedWallets, setDetectedWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWallets, setShowWallets] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedBlockchain === "ethereum") {
      detectWallets();
    }
  }, [isOpen, selectedBlockchain]);

  const detectWallets = () => {
    setDetecting(true);
    const wallets = [];
    const seenWallets = new Set();

    const addWallet = (info, provider) => {
      const identifier = info.rdns || info.uuid;
      if (!seenWallets.has(identifier)) {
        seenWallets.add(identifier);
        wallets.push({ info, provider, detected: true });
        setDetectedWallets([...wallets]);
      }
    };

    // EIP-6963: Universal wallet detection
    const handleAnnouncement = (event) => {
      const { info, provider } = event.detail;
      addWallet(info, provider);
    };

    window.addEventListener("eip6963:announceProvider", handleAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Give wallets time to announce (500ms)
    // Give wallets time to announce (500ms)
    setTimeout(() => {
      setDetecting(false);

      // Fallback: if no wallets detected via EIP-6963, check window.ethereum
      if (wallets.length === 0 && window.ethereum) {
        addWallet(
          {
            uuid: "default-provider",
            name: "Browser Wallet",
            icon: "💼",
            rdns: "browser.default",
          },
          window.ethereum
        );
      }

      // Sort: MetaMask always first
      wallets.sort((a, b) => {
        const aIsMetaMask = a.info.name?.toLowerCase().includes("metamask");
        const bIsMetaMask = b.info.name?.toLowerCase().includes("metamask");

        if (aIsMetaMask && !bIsMetaMask) return -1;
        if (!aIsMetaMask && bIsMetaMask) return 1;
        return 0;
      });

      setDetectedWallets([...wallets]);
    }, 500);

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnouncement
      );
    };
  };

  const verifyAndSwitchNetwork = async (provider) => {
    try {
      const blockchain = BLOCKCHAINS.find((b) => b.id === selectedBlockchain);
      if (!blockchain || !blockchain.chainId) return true;

      const chainId = await provider.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainId, 16);

      if (currentChainId === blockchain.chainId) {
        return true;
      }

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: blockchain.chainIdHex }],
        });
        toast.success(`Switched to ${blockchain.name}`);
        return true;
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: blockchain.chainIdHex,
                  chainName: blockchain.name,
                  nativeCurrency: {
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [blockchain.rpcUrl],
                  blockExplorerUrls: ["https://etherscan.io"],
                },
              ],
            });
            toast.success(`Added and switched to ${blockchain.name}`);
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

  const handleWalletSelect = async (wallet) => {
    if (!wallet.detected) return;
    setSelectedWallet(wallet.info.uuid);

    try {
      const networkOk = await verifyAndSwitchNetwork(wallet.provider);

      if (!networkOk) {
        setSelectedWallet(null);
        return;
      }

      await onConnect(wallet.provider);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Connection failed");
    } finally {
      setSelectedWallet(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white/10 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-blue-500/10 opacity-50" />

        <div className="relative flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {showWallets ? "Select Wallet" : "Select Network"}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {showWallets
                ? `${detectedWallets.length} detected`
                : "Choose blockchain"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="relative p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {!showWallets ? (
            <div className="space-y-2">
              {BLOCKCHAINS.map((bc) => (
                <button
                  key={bc.id}
                  onClick={() =>
                    bc.available &&
                    (setSelectedBlockchain(bc.id), setShowWallets(true))
                  }
                  disabled={!bc.available}
                  className={`group w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                    bc.available
                      ? "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
                      : "bg-white/20 dark:bg-white/5 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${bc.gradient} shadow-lg`}
                    >
                      {bc.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {bc.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {bc.available ? "Available" : "Soon"}
                      </div>
                    </div>
                  </div>
                  {bc.available && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowWallets(false)}
                className="mb-3 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back</span>
              </button>

              <div className="space-y-2">
                {detecting || detectedWallets.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {detecting
                        ? "Detecting wallets..."
                        : "No wallets detected"}
                    </p>
                  </div>
                ) : (
                  detectedWallets.map((wallet) => {
                    const isLoading =
                      selectedWallet === wallet.info.uuid && isConnecting;
                    return (
                      <button
                        key={wallet.info.uuid}
                        onClick={() => handleWalletSelect(wallet)}
                        disabled={isConnecting}
                        className="group w-full flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden">
                            {wallet.info.icon ? (
                              wallet.info.icon.startsWith("data:") ||
                              wallet.info.icon.startsWith("http") ? (
                                <img
                                  src={wallet.info.icon}
                                  alt={wallet.info.name}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML =
                                      '<span class="text-xl">💼</span>';
                                  }}
                                />
                              ) : wallet.info.icon.length <= 5 ? (
                                <span className="text-xl">
                                  {wallet.info.icon}
                                </span>
                              ) : (
                                <span className="text-xl">💼</span>
                              )
                            ) : (
                              <span className="text-xl">💼</span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {wallet.info.name}
                          </span>
                        </div>
                        {isLoading ? (
                          <Loader className="w-4 h-4 text-primary-400 animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default WalletSelectorModal;
