import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import api from "@services/api";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ REMOVED: No more token state

  // Auto-refresh token before expiration (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    initializeWallet();
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [user]);

  // ✅ Auto-fetch user on mount (token in cookie)
  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, []);

  const initializeWallet = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setAccount(address);

        // Verify wallet matches user
        if (
          user &&
          user.walletAddress.toLowerCase() !== address.toLowerCase()
        ) {
          console.warn("Wallet mismatch detected");
          toast.error("Wallet address mismatch. Please reconnect.");
          disconnect();
        }
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    console.log("Account changed:", accounts);

    if (accounts.length === 0) {
      disconnect();
      return;
    }

    const newAddress = accounts[0];

    if (user && user.walletAddress.toLowerCase() !== newAddress.toLowerCase()) {
      toast.error("Wallet changed. Please sign in with the new wallet.");
      disconnect();
    } else {
      setAccount(newAddress);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleDisconnect = () => {
    console.log("Wallet disconnected");
    disconnect();
  };

  const refreshAccessToken = async () => {
    try {
      // ✅ Just call refresh - new token set as cookie automatically
      await api.post("/auth/refresh");
    } catch (error) {
      console.error("Token refresh failed:", error);
      disconnect();
      toast.error("Session expired. Please reconnect your wallet.");
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      // ✅ REMOVED: No localStorage storage
    } catch (error) {
      console.error("Error fetching user:", error);
      // User not logged in - this is OK
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect your wallet");
      return;
    }

    setIsConnecting(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);

      // Get nonce
      const { data: nonceData } = await api.post("/auth/nonce", {
        walletAddress: address,
      });

      // Sign message
      const signature = await signer.signMessage(nonceData.message);

      // Verify signature and login
      const { data: loginData } = await api.post("/auth/verify", {
        walletAddress: address,
        signature,
      });

      setUser(loginData.user);

      // ✅ REMOVED: No localStorage operations
      // Tokens are now in httpOnly cookies

      toast.success(
        loginData.isNewUser ? "Welcome to Lizard Academy!" : "Welcome back!"
      );
    } catch (error) {
      console.error("Wallet connection error:", error);
      disconnect();
      toast.error(error.response?.data?.error || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(async () => {
    try {
      // Call backend to clear cookies
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }

    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);

    // ✅ REMOVED: No localStorage to clear

    toast.success("Wallet disconnected");
  }, []);

  const value = {
    account,
    walletAddress: account,
    provider,
    signer,
    user,
    isConnecting,
    isConnected: !!account && !!user,
    connectWallet,
    disconnect,
    refreshAccessToken,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
