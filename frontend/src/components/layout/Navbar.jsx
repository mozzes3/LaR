import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Wallet,
  LogOut,
  Settings,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    isConnected,
    account,
    user,
    connectWallet,
    disconnect,
    isConnecting,
  } = useWallet();
  const navigate = useNavigate();

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnect();
    setUserMenuOpen(false);
    navigate("/");
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="navbar">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center font-bold text-black transform group-hover:scale-110 transition">
              FA
            </div>
            <span className="text-xl font-bold hidden sm:block">
              Founder Academy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/courses"
              className="text-sm font-medium hover:text-primary-400 transition"
            >
              Courses
            </Link>
            <Link
              to="/become-instructor"
              className="text-sm font-medium hover:text-primary-400 transition"
            >
              Become Instructor
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:text-primary-400 transition"
              >
                My Learning
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Search */}
            <button className="hidden md:block p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            {isConnected && (
              <button className="hidden md:block p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-400 text-black text-xs rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              </button>
            )}

            {/* Wallet / User Menu */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-lg font-medium hover:shadow-glow transition"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{truncateAddress(account)}</span>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl z-50 animate-scale-in">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center font-bold text-black">
                            {user?.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium">{user?.username}</div>
                            <div className="text-xs text-gray-500">
                              {truncateAddress(account)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="text-sm">Dashboard</span>
                        </Link>

                        {user?.isInstructor && (
                          <Link
                            to="/instructor"
                            className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm">
                              Instructor Dashboard
                            </span>
                          </Link>
                        )}

                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                        <button
                          onClick={handleDisconnect}
                          className="flex items-center space-x-3 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-red-500"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Disconnect</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-lg font-medium hover:shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <div className="container-custom py-4 space-y-3">
            <Link
              to="/courses"
              className="block py-2 text-sm font-medium hover:text-primary-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              to="/become-instructor"
              className="block py-2 text-sm font-medium hover:text-primary-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Become Instructor
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className="block py-2 text-sm font-medium hover:text-primary-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Learning
              </Link>
            )}

            {!isConnected && (
              <button
                onClick={() => {
                  handleConnect();
                  setMobileMenuOpen(false);
                }}
                disabled={isConnecting}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-lg font-medium disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
