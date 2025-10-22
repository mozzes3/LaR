import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  const fetchingUser = useRef(false);
  const lastRefreshAttempt = useRef(0);
  const REFRESH_COOLDOWN = 30000;

  // Auto-refresh token before expiration (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshAccessToken();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Initialize wallet and fetch user ONCE on mount
  useEffect(() => {
    const initialize = async () => {
      if (fetchingUser.current) return;
      fetchingUser.current = true;

      try {
        // Try to fetch user first (check if already logged in)
        await fetchUser();
      } catch (error) {
        console.error("No active session");
      }

      // Initialize wallet connection
      await initializeWallet();

      fetchingUser.current = false;
    };

    initialize();
  }, []);

  // Handle wallet events
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
    // Debounce: prevent multiple refresh attempts within cooldown period
    const now = Date.now();
    if (now - lastRefreshAttempt.current < REFRESH_COOLDOWN) {
      console.log("⏳ Token refresh on cooldown");
      return false;
    }
    lastRefreshAttempt.current = now;

    try {
      const response = await api.post("/auth/refresh");
      await api.post("/auth/refresh");
    } catch (error) {
      console.error("Token refresh failed:", error);
      disconnect();
      toast.error("Session expired. Please reconnect your wallet.");
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me", {
        validateStatus: (status) => status < 500, // Accept any status < 500
      });

      // Only set user if response is successful
      if (response.status === 200 && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      // Silently fail - user not logged in
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

      toast.success(
        loginData.isNewUser ? "Welcome to Lizard Academy!" : "Welcome back!"
      );
    } catch (error) {
      console.error("Wallet connection error:", error);
      disconnect();

      if (error.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.response?.data?.error || "Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(async () => {
    try {
      // Only call logout if user is logged in
      if (user) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      // Silently fail - user might already be logged out
      if (error.response?.status !== 401) {
        console.error("Logout error:", error);
      }
    }

    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);

    toast.success("Wallet disconnected");
  }, [user]);

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
