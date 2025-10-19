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
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  );

  // Auto-refresh token before expiration (every 10 minutes, token expires in 15)
  useEffect(() => {
    if (refreshToken) {
      const interval = setInterval(() => {
        refreshAccessToken();
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearInterval(interval);
    }
  }, [refreshToken]);

  // Check connection and sync wallet on mount
  useEffect(() => {
    initializeWallet();
  }, []);

  // Listen for account and network changes
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

  // Auto-login if token exists
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token]);

  const initializeWallet = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0 && token) {
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setAccount(address);

        // Verify the connected wallet matches the logged-in user
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
      // User disconnected wallet from MetaMask
      disconnect();
      return;
    }

    const newAddress = accounts[0];

    if (user && user.walletAddress.toLowerCase() !== newAddress.toLowerCase()) {
      // User switched to different wallet
      toast.error("Wallet changed. Please sign in with the new wallet.");
      disconnect();
    } else {
      // Same wallet, just update
      setAccount(newAddress);
    }
  };

  const handleChainChanged = () => {
    // Reload page on network change
    window.location.reload();
  };

  const handleDisconnect = () => {
    console.log("Wallet disconnected");
    disconnect();
  };

  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) return;

      const { data } = await api.post("/auth/refresh", {
        refreshToken: storedRefreshToken,
      });

      setToken(data.token);
      localStorage.setItem("token", data.token);

      // Update axios default header
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout
      disconnect();
      toast.error("Session expired. Please reconnect your wallet.");
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
        // Try to refresh token
        await refreshAccessToken();
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

      setToken(loginData.token);
      setRefreshToken(loginData.refreshToken);
      setUser(loginData.user);

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      localStorage.setItem("connectedWallet", address.toLowerCase());

      // Set default axios header
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${loginData.token}`;

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

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);
    setToken(null);
    setRefreshToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("connectedWallet");

    delete api.defaults.headers.common["Authorization"];

    toast.success("Wallet disconnected");
  }, []);

  const value = {
    account,
    walletAddress: account,
    provider,
    signer,
    user,
    token,
    isConnecting,
    isConnected: !!account && !!token && !!user,
    connectWallet,
    disconnect,
    refreshUser: fetchUser,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
