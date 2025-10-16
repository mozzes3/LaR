import { createContext, useContext, useState, useEffect } from "react";
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
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  // Auto-login if token exists
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          setProvider(provider);
          const signer = await provider.getSigner();
          setSigner(signer);
          setAccount(accounts[0].address);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect your wallet");
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);

      // Get nonce from backend
      const { data } = await api.post("/auth/nonce", {
        walletAddress: address,
      });

      // Sign message
      const signature = await signer.signMessage(data.message);

      // Verify signature and login
      const loginResponse = await api.post("/auth/verify", {
        walletAddress: address,
        signature,
      });

      setToken(loginResponse.data.token);
      setUser(loginResponse.data.user);
      localStorage.setItem("token", loginResponse.data.token);

      toast.success(
        loginResponse.data.isNewUser
          ? "Welcome to Founder Academy!"
          : "Welcome back!"
      );
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error(error.response?.data?.error || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    toast.success("Wallet disconnected");
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        disconnect();
      }
    }
  };

  const value = {
    account,
    provider,
    signer,
    user,
    token,
    isConnecting,
    isConnected: !!account,
    connectWallet,
    disconnect,
    refreshUser: fetchUser,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
