import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Shield,
  Info,
  Award,
  Sparkles,
  Trophy,
  Zap,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader,
  Wallet,
  Check,
  X as XIcon,
} from "lucide-react";
import { courseApi, purchaseApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const CheckoutPage = () => {
  console.log("🚀 CheckoutPage MOUNTED");
  console.log("📍 Slug from params:", useParams());

  const { slug } = useParams();

  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, account: walletAddress, connectWallet } = useWallet();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(
    location.state?.paymentMethod || "usdt"
  );
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  // Mock crypto prices
  const cryptoPrices = {
    eth: 3500,
    btc: 65000,
    sol: 140,
    usdt: 1,
    usdc: 1,
    fdr: 0.85,
  };

  const calculateCryptoPrice = (usdPrice, crypto) => {
    const amount = usdPrice / cryptoPrices[crypto];
    return crypto === "btc" ? amount.toFixed(4) : amount.toFixed(2);
  };

  // All available payment options
  const allPaymentOptions = [
    {
      id: "usdt",
      name: "USDT",
      fullName: "Tether USD",
      icon: "₮",
      color: "bg-green-500",
      amount: "299.00",
      isStable: true,
      network: "Ethereum (ERC-20)",
      chainId: 1,
    },
    {
      id: "usdc",
      name: "USDC",
      fullName: "USD Coin",
      icon: "$",
      color: "bg-blue-500",
      amount: "299.00",
      isStable: true,
      network: "Ethereum (ERC-20)",
      chainId: 1,
    },
    {
      id: "eth",
      name: "ETH",
      fullName: "Ethereum",
      icon: "Ξ",
      color: "bg-gradient-to-br from-purple-500 to-blue-500",
      amount: calculateCryptoPrice(299, "eth"),
      isStable: false,
      network: "Ethereum Mainnet",
      chainId: 1,
    },
    {
      id: "btc",
      name: "BTC",
      fullName: "Bitcoin",
      icon: "₿",
      color: "bg-orange-500",
      amount: calculateCryptoPrice(299, "btc"),
      isStable: false,
      network: "Bitcoin Network",
      chainId: null,
    },
    {
      id: "sol",
      name: "SOL",
      fullName: "Solana",
      icon: "S",
      color: "bg-gradient-to-br from-purple-500 to-green-400",
      amount: calculateCryptoPrice(299, "sol"),
      isStable: false,
      network: "Solana Mainnet",
      chainId: null,
    },
    {
      id: "fdr",
      name: "$FDR",
      fullName: "Founder Token",
      icon: "F",
      color: "bg-gradient-to-br from-primary-400 to-primary-600",
      amount: "299",
      isStable: true,
      network: "Polygon Network",
      chainId: 137,
      badge: "Save 10%",
    },
  ];

  const mockCourse = {
    id: 1,
    slug: "nft-marketing-masterclass",
    title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
    subtitle: "Learn proven strategies to grow your NFT community from zero",
    instructor: {
      username: "CryptoMaverick",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      verified: true,
      badge: "KOL",
      badgeColor: "purple",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      acceptedPayments: ["usdt", "usdc", "eth", "fdr"],
    },
    thumbnail:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
    price: { usd: 299 },
    duration: "12h 30m",
    totalLessons: 47,
    totalDuration: 750,
    level: "Intermediate",
    escrowSettings: {
      refundPeriodDays: 14,
      minWatchPercentage: 20,
      maxWatchTime: 120,
    },
  };

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);

        console.log("🔍 Frontend: Loading course with slug:", slug);

        // Real API call to get course details
        const response = await courseApi.getBySlug(slug);

        console.log("✅ Frontend: API response received:", response);
        console.log("📦 Frontend: Response data:", response.data);

        const courseData = {
          ...response.data.course,
          id: response.data.course._id,
          students: response.data.course.enrollmentCount || 0,
          rating: response.data.course.averageRating || 0,
          price: response.data.course.price || { usd: 299 },
          duration: response.data.course.duration || "12h 30m",
          totalLessons: response.data.course.totalLessons || 0,
          instructor: {
            ...response.data.course.instructor,
            acceptedPayments: ["usdt", "usdc", "eth", "fdr"],
            verified:
              response.data.course.instructor?.instructorVerified || false,
            badge:
              response.data.course.instructor?.expertise?.[0] || "Instructor",
            badgeColor: "purple",
          },
          escrowSettings: response.data.course.escrowSettings || {
            refundPeriodDays: 14,
            minWatchPercentage: 20,
            maxWatchTime: 120,
          },
        };

        console.log("🎯 Frontend: Transformed course data:", courseData);

        setCourse(courseData);
        setLoading(false);

        console.log("✅ Frontend: Course set successfully");
      } catch (error) {
        console.error("❌ Frontend: Error loading course:", error);
        console.error("❌ Frontend: Error response:", error.response?.data);

        toast.error("Failed to load course");
        setCourse(mockCourse); // Use mock as fallback
        setLoading(false);
      }
    };

    if (slug) {
      loadCourse();
    }
  }, [slug, navigate]);

  // Second useEffect stays the same - it's correct!
  useEffect(() => {
    if (
      course &&
      course.instructor?.acceptedPayments && // ← Add optional chaining for safety
      !course.instructor.acceptedPayments.includes(selectedPayment)
    ) {
      setSelectedPayment(course.instructor.acceptedPayments[0]);
    }
  }, [course, selectedPayment]);

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "save10") {
      setAppliedPromo({ code: "SAVE10", discount: 10 });
      toast.success("Promo code applied! 10% discount");
    } else {
      toast.error("Invalid promo code");
    }
  };

  const calculateTotal = () => {
    if (!course) return 0;
    const basePrice = course.price.usd;
    const discount = appliedPromo
      ? (basePrice * appliedPromo.discount) / 100
      : 0;
    return basePrice - discount;
  };

  const handleSmartContractPayment = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to terms and conditions");
      return;
    }

    try {
      setProcessing(true);

      // Real API call to record purchase
      toast.loading("Processing payment...");

      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTransactionHash(mockTxHash);

      // Send to backend API
      const response = await purchaseApi.purchase({
        courseId: course.id,
        paymentMethod: selectedPayment,
        transactionHash: mockTxHash,
      });

      toast.dismiss();
      toast.success("Purchase successful! 🎉");

      setProcessing(false);

      // Redirect to course learning page
      setTimeout(() => {
        navigate(`/courses/${course.slug}/learn`);
      }, 2000);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.error || "Purchase failed. Please try again."
      );
      setProcessing(false);
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "KOL":
        return <Sparkles className="w-3 h-3" />;
      case "Professional":
        return <Shield className="w-3 h-3" />;
      case "Expert":
        return <Trophy className="w-3 h-3" />;
      case "Creator":
        return <Zap className="w-3 h-3" />;
      default:
        return <Award className="w-3 h-3" />;
    }
  };

  const getBadgeColors = (color) => {
    switch (color) {
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "green":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "pink":
        return "bg-pink-500/10 text-pink-400 border-pink-500/30";
      default:
        return "bg-primary-400/10 text-primary-400 border-primary-400/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <Link
            to="/courses"
            className="text-primary-400 hover:text-primary-500"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const paymentOptions = allPaymentOptions.filter((opt) =>
    course?.instructor.acceptedPayments.includes(opt.id)
  );
  const selectedOption = paymentOptions.find((p) => p.id === selectedPayment);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <div className="container-custom">
        <div className="mb-8">
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-400 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Course</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Secure Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Payment secured by smart contract escrow
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!isConnected ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Connect your wallet to proceed with secure smart contract
                      payment
                    </p>
                    <button
                      onClick={connectWallet}
                      className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-lg transition inline-flex items-center space-x-2"
                    >
                      <Wallet className="w-5 h-5" />
                      <span>Connect Wallet</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Connected Wallet
                      </div>
                      <div className="font-mono font-medium text-gray-900 dark:text-white">
                        {walletAddress?.slice(0, 6)}...
                        {walletAddress?.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <button className="text-sm text-primary-400 hover:text-primary-500 font-medium">
                    Change
                  </button>
                </div>
              </div>
            )}
            <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                    Smart Contract Escrow Protection
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your payment is secured by a smart contract. Funds are held
                    in escrow and automatically released based on these
                    conditions:
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Auto-Release Timer
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Payment released to instructor after{" "}
                    <span className="font-bold text-blue-500">
                      {course.escrowSettings.refundPeriodDays} days
                    </span>
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Refund Eligibility
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Full refund if watched less than{" "}
                    <span className="font-bold text-green-500">
                      {course.escrowSettings.minWatchPercentage}%
                    </span>{" "}
                    or under{" "}
                    <span className="font-bold text-green-500">
                      {course.escrowSettings.maxWatchTime} mins
                    </span>
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Secure Transfer
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Payment sent directly to instructor via smart contract
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Fully Automated
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    One-click payment - smart contract handles everything
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Accepted by instructor
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                  className="w-full p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 rounded-xl border-2 border-primary-400/30 hover:border-primary-400 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pay with
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        showPaymentDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-14 h-14 ${selectedOption?.color} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                      >
                        {selectedOption?.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {selectedOption?.fullName}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedOption?.amount} {selectedOption?.name}
                        </div>
                        {!selectedOption?.isStable && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ≈ ${course.price.usd} USD
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {selectedOption?.network}
                        </div>
                      </div>
                    </div>
                    {selectedOption?.badge && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 text-sm font-bold rounded-lg">
                        {selectedOption.badge}
                      </span>
                    )}
                  </div>
                </button>
                {showPaymentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-20 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="px-2 py-1">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Stablecoins
                        </div>
                      </div>
                      {paymentOptions
                        .filter((opt) => opt.isStable)
                        .map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSelectedPayment(option.id);
                              setShowPaymentDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                              selectedPayment === option.id
                                ? "bg-primary-400/10 border-2 border-primary-400/30"
                                : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-white font-bold shadow-md`}
                              >
                                {option.icon}
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-gray-900 dark:text-white">
                                  {option.amount} {option.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {option.network}
                                </div>
                              </div>
                            </div>
                            {option.badge && (
                              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded">
                                {option.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      {paymentOptions.filter((opt) => !opt.isStable).length >
                        0 && (
                        <>
                          <div className="px-2 py-1 mt-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                              Cryptocurrencies
                            </div>
                          </div>
                          {paymentOptions
                            .filter((opt) => !opt.isStable)
                            .map((option) => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setSelectedPayment(option.id);
                                  setShowPaymentDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                                  selectedPayment === option.id
                                    ? "bg-primary-400/10 border-2 border-primary-400/30"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-white font-bold shadow-md`}
                                  >
                                    {option.icon}
                                  </div>
                                  <div className="text-left">
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {option.amount} {option.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ≈ ${course.price.usd} USD •{" "}
                                      {option.network}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Promo Code
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-primary-400 transition"
                >
                  Apply
                </button>
              </div>
              {appliedPromo && (
                <div className="mt-3 flex items-center space-x-2 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Promo code "{appliedPromo.code}" applied (
                    {appliedPromo.discount}% off)
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-primary-400 focus:ring-primary-400 mt-0.5"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-primary-400 hover:text-primary-500"
                  >
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link
                    to="/privacy"
                    className="text-primary-400 hover:text-primary-500"
                  >
                    Privacy Policy
                  </Link>
                  , and understand that payment will be held in a smart contract
                  escrow with automatic release conditions.
                </span>
              </label>
            </div>
            {transactionHash && (
              <div className="bg-green-500/5 border-2 border-green-500/20 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-500 mb-2">
                      Payment Successful!
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Your payment is now held in escrow. You have instant
                      access to the course.
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Transaction:
                      </span>
                      <code className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded">
                        {transactionHash.slice(0, 10)}...
                        {transactionHash.slice(-8)}
                      </code>
                      <a
                        href={`https://etherscan.io/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-500"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Order Summary
                  </h3>
                  <div className="flex space-x-4 mb-6">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white line-clamp-2">
                        {course.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span>{course.totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {course.instructor.username}
                        </span>
                        {course.instructor.verified && (
                          <Award className="w-3 h-3 text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                      <div
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-bold border ${getBadgeColors(
                          course.instructor.badgeColor
                        )}`}
                      >
                        {getBadgeIcon(course.instructor.badge)}
                        <span>{course.instructor.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Course Price
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${course.price.usd}
                      </span>
                    </div>
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-500">
                          Discount ({appliedPromo.discount}%)
                        </span>
                        <span className="font-medium text-green-500">
                          -$
                          {(
                            (course.price.usd * appliedPromo.discount) /
                            100
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">
                          Total
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${calculateTotal()}
                          </div>
                          <div className="text-xs text-gray-500">
                            ≈ {selectedOption?.amount} {selectedOption?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-primary-400/5 border border-primary-400/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-primary-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        You'll earn{" "}
                        <span className="font-bold text-primary-400">
                          {Math.floor(calculateTotal())} $FDR
                        </span>{" "}
                        cashback
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleSmartContractPayment}
                    disabled={!isConnected || !agreeToTerms || processing}
                    className="w-full py-4 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary-400/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Complete Purchase</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Smart contract handles approval & payment automatically
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
                <h4 className="font-bold mb-4 text-gray-900 dark:text-white">
                  What you'll get:
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Instant course access
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Smart contract protection
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {course.escrowSettings.refundPeriodDays}-day refund window
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Certificate of completion
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ${Math.floor(calculateTotal())} FDR cashback
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
                <h4 className="font-bold mb-4 text-gray-900 dark:text-white">
                  Accepted by instructor:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 ${
                        selectedPayment === option.id
                          ? "border-primary-400 bg-primary-400/10"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 ${option.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
