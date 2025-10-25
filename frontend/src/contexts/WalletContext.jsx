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

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState(null);
  const fetchingUser = useRef(false);
  const lastRefreshAttempt = useRef(0);
  const REFRESH_COOLDOWN = 30000;

  const disconnect = useCallback(async () => {
    try {
      if (user) {
        await api.post("/auth/logout");
      }
    } catch (error) {
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

  const refreshAccessToken = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshAttempt.current < REFRESH_COOLDOWN) {
      return false;
    }
    lastRefreshAttempt.current = now;

    try {
      await api.post("/auth/refresh");
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      disconnect();
      toast.error("Session expired. Please reconnect your wallet.");
      return false;
    }
  }, [disconnect]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me", {
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200 && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  const connectWallet = useCallback(
    async (walletProvider = null) => {
      const ethereumProvider = walletProvider || window.ethereum;

      if (!ethereumProvider) {
        toast.error("No wallet detected");
        return false;
      }

      // SECURITY: Validate provider
      const requiredMethods = ["request", "on", "removeListener"];
      for (const method of requiredMethods) {
        if (typeof ethereumProvider[method] !== "function") {
          toast.error("Invalid wallet provider");
          return false;
        }
      }

      setIsConnecting(true);

      try {
        const provider = new ethers.BrowserProvider(ethereumProvider);
        await provider.send("eth_requestAccounts", []);

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setSigner(signer);
        setAccount(address);

        const { data: nonceData } = await api.post("/auth/nonce", {
          walletAddress: address,
        });

        const signature = await signer.signMessage(nonceData.message);

        const { data: loginData } = await api.post("/auth/verify", {
          walletAddress: address,
          signature,
        });

        setUser(loginData.user);
        // ✅ DEBUG LOGGING
        console.log("🔐 User logged in:", {
          username: loginData.user.username,
          role: loginData.user.role,
          roleRef: loginData.user.roleRef,
          isSuperAdmin: loginData.user.isSuperAdmin,
        });

        toast.success(
          loginData.isNewUser ? "Welcome to Lizard Academy!" : "Welcome back!"
        );

        return true;
      } catch (error) {
        console.error("Wallet connection error:", error);
        disconnect();

        if (error.response?.status === 429) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else if (error.code === 4001) {
          toast.error("Connection rejected");
        } else if (error.code === -32002) {
          toast.error("Please check your wallet");
        } else {
          toast.error(
            error.response?.data?.error || "Failed to connect wallet"
          );
        }

        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    [disconnect]
  );

  const initializeWallet = useCallback(async () => {
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
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    }
  }, []);
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      if (accounts.length === 0) {
        disconnect();
        return;
      }

      const newAddress = accounts[0];

      if (
        user &&
        user.walletAddress.toLowerCase() !== newAddress.toLowerCase()
      ) {
        toast.error("Wallet changed. Please sign in with the new wallet.");
        disconnect();
      } else {
        setAccount(newAddress);
      }
    },
    [user, disconnect]
  );

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshAccessToken();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, refreshAccessToken]);

  useEffect(() => {
    const initialize = async () => {
      if (fetchingUser.current) return;
      fetchingUser.current = true;

      try {
        await fetchUser();
      } catch (error) {
        console.error("No active session");
      }

      await initializeWallet();

      fetchingUser.current = false;
    };

    initialize();
  }, [fetchUser, initializeWallet]);

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
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

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

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
