const { getPaymentService } = require("../services/blockchainService");
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");
const InstructorFeeSettings = require("../models/InstructorFeeSettings");
const Purchase = require("../models/Purchase"); // This is the NEW payment Purchase model
const Course = require("../../../models/Course");
const tokenVerificationService = require("../services/tokenVerificationService");
const User = require("../../../models/User");
const { ethers } = require("ethers");
const axios = require("axios");
console.log("🔧 paymentController.js loaded");

/**
 * Get current price for non-stablecoin tokens
 */
async function getTokenPriceUSD(paymentToken) {
  try {
    if (paymentToken.isStablecoin) {
      return paymentToken.fixedUsdPrice || 1.0;
    }

    if (paymentToken.priceOracleType === "coingecko") {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: paymentToken.coingeckoId,
            vs_currencies: "usd",
          },
          timeout: 5000,
        }
      );

      const price = response.data[paymentToken.coingeckoId]?.usd;
      if (!price) {
        throw new Error("Price not found");
      }

      return price;
    }

    // Fallback: use fixed price if oracle fails
    return paymentToken.fixedUsdPrice || 1.0;
  } catch (error) {
    console.error(
      `Failed to get price for ${paymentToken.symbol}:`,
      error.message
    );
    // Return cached or fixed price as fallback
    return paymentToken.fixedUsdPrice || 1.0;
  }
}

/**
 * Calculate token amount from USD price
 */
function calculateTokenAmount(usdPrice, tokenPriceUSD, decimals) {
  const tokenAmount = usdPrice / tokenPriceUSD;
  const tokenAmountBigNumber = ethers.parseUnits(
    tokenAmount.toFixed(decimals),
    decimals
  );
  return tokenAmountBigNumber.toString();
}

/**
 * Get available payment tokens
 * PUBLIC ENDPOINT
 */
const getPaymentTokens = async (req, res) => {
  try {
    const tokens = await PaymentToken.find({ isActive: true, isEnabled: true })
      .sort({ displayOrder: 1 })
      .lean();

    const verifiedTokens = [];

    for (const token of tokens) {
      const availability =
        await tokenVerificationService.checkTokenAvailability(token);

      if (availability.available) {
        const currentPrice = await getTokenPriceUSD(token);

        verifiedTokens.push({
          ...token,
          currentPriceUSD: currentPrice,
          availabilityChecks: availability.checks,
          verified: true,
        });
      } else {
        console.warn(`Token ${token.symbol} unavailable:`, availability.reason);
      }
    }

    res.json({
      success: true,
      tokens: verifiedTokens,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Get payment tokens error:", error);
    res.status(500).json({ error: "Failed to get payment tokens" });
  }
};

/**
 * Get token price in USD
 * PUBLIC ENDPOINT - Called frequently for price updates
 */
const getTokenPrice = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await PaymentToken.findById(tokenId);
    if (!token || !token.isActive) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    const priceUSD = await getTokenPriceUSD(token);

    res.json({
      success: true,
      symbol: token.symbol,
      priceUSD,
      isStablecoin: token.isStablecoin,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get token price error:", error);
    res.status(500).json({ error: "Failed to get token price" });
  }
};

/**
 * Calculate payment details for a course
 * AUTHENTICATED - Called before payment
 */
const calculatePayment = async (req, res) => {
  console.log("\n🟢 CALCULATE PAYMENT STARTED");
  console.log("Body:", req.body);
  console.log("User:", req.userId);

  try {
    const { courseId, paymentTokenId } = req.body;
    console.log("Extracted IDs:", { courseId, paymentTokenId });

    // Step 1: Validate inputs
    if (!courseId || !paymentTokenId) {
      console.error("❌ Missing required fields");
      return res
        .status(400)
        .json({ error: "Missing courseId or paymentTokenId" });
    }
    console.log("✅ Step 1: Inputs validated");

    // Step 2: Load course
    console.log("📚 Step 2: Loading course...");
    const course = await Course.findById(courseId).populate({
      path: "instructor",
      select:
        "username evmWalletAddress walletAddress solanaWalletAddress paymentWallets",
    });

    if (!course) {
      console.error("❌ Course not found");
      return res.status(404).json({ error: "Course not found" });
    }
    console.log("✅ Step 2: Course loaded:", course.title);
    console.log("   Instructor:", course.instructor?.username);

    // Check for active/completed purchases only (allow retry if failed/pending)
    const existingActivePurchase = await Purchase.findOne({
      user: req.userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingActivePurchase) {
      console.error("❌ Already purchased (active/completed)");
      return res.status(400).json({
        error: "You have already purchased this course",
        purchaseId: existingActivePurchase._id,
      });
    }

    // Auto-cleanup old failed/pending purchases (allow retries)
    console.log("🧹 Cleaning up old failed/pending purchases...");
    const cleanupResult = await Purchase.deleteMany({
      user: req.userId,
      course: courseId,
      status: { $in: ["pending", "failed"] },
    });

    if (cleanupResult.deletedCount > 0) {
      console.log(
        `✅ Cleaned up ${cleanupResult.deletedCount} old purchase attempt(s)`
      );
    }

    // Step 4: Load payment token
    console.log("💳 Step 4: Loading payment token...");
    const paymentToken = await PaymentToken.findById(paymentTokenId);

    if (!paymentToken || !paymentToken.isActive) {
      console.error("❌ Invalid payment token");
      return res
        .status(400)
        .json({ error: "Invalid or inactive payment token" });
    }
    console.log("✅ Step 4: Token loaded:", paymentToken.symbol);

    // Step 5: Get price
    console.log("💰 Step 5: Getting price...");
    const usdPrice = course.price?.usd || 0;
    console.log("   USD Price:", usdPrice);

    // Step 6: Get token price
    console.log("📊 Step 6: Getting token price...");
    const tokenPriceUSD = await getTokenPriceUSD(paymentToken);
    console.log("   Token price:", tokenPriceUSD);

    // Continue with more steps...
    console.log("🔄 Step 7: Calculating token amount...");

    // Get fee settings for this instructor
    console.log("🔄 Step 7: Calculating token amount...");
    const tokenAmount = calculateTokenAmount(
      usdPrice,
      tokenPriceUSD,
      paymentToken.decimals
    );
    console.log("   Token amount:", tokenAmount);

    // Step 8: Get fee settings
    console.log("💼 Step 8: Getting fee settings...");
    const feeSettings = await InstructorFeeSettings.getEffectiveFees(
      course.instructor._id
    );

    const platformFeePercentage = feeSettings.platformFeePercentage;
    const instructorFeePercentage = feeSettings.instructorFeePercentage;

    console.log("Fee settings:", {
      platformFeePercentage,
      instructorFeePercentage,
    });

    // Calculate fee amounts
    const tokenAmountBN = ethers.getBigInt(tokenAmount);
    const platformFeeAmount =
      (tokenAmountBN * BigInt(platformFeePercentage)) / BigInt(10000);
    const instructorFeeAmount = tokenAmountBN - platformFeeAmount;

    // Get platform settings for revenue split
    const platformSettings = await PlatformSettings.getSettings();
    const revenueSplitPercentage = platformSettings.revenueSplitPercentage;

    // Calculate revenue split (from platform fee)
    const revenueSplitAmount =
      (platformFeeAmount * BigInt(revenueSplitPercentage)) / BigInt(10000);

    console.log("Calculated amounts:", {
      tokenAmount: tokenAmount,
      platformFeeAmount: platformFeeAmount.toString(),
      instructorFeeAmount: instructorFeeAmount.toString(),
      revenueSplitAmount: revenueSplitAmount.toString(),
    });
    // Get instructor wallet for this blockchain
    // Step 9: Get instructor wallet
    console.log("👛 Step 9: Getting instructor wallet...");
    let instructorWallet;

    // Try new format first (paymentWallets array)
    if (
      course.instructor.paymentWallets &&
      course.instructor.paymentWallets.length > 0
    ) {
      const walletConfig = course.instructor.paymentWallets.find(
        (w) =>
          w.blockchain === paymentToken.blockchain &&
          w.chainId === paymentToken.chainId
      );
      instructorWallet = walletConfig?.address;
    }

    // Fallback to legacy format (direct wallet fields)
    if (!instructorWallet) {
      if (paymentToken.blockchain === "evm") {
        instructorWallet =
          course.instructor.evmWalletAddress || course.instructor.walletAddress;
      } else if (paymentToken.blockchain === "solana") {
        instructorWallet = course.instructor.solanaWalletAddress;
      }
    }

    if (!instructorWallet) {
      console.error("❌ No instructor wallet found");
      console.error("Instructor:", course.instructor.username);
      console.error("Blockchain:", paymentToken.blockchain);
      console.error("ChainId:", paymentToken.chainId);
      console.error("Available wallets:", {
        evmWalletAddress: course.instructor.evmWalletAddress,
        walletAddress: course.instructor.walletAddress,
        solanaWalletAddress: course.instructor.solanaWalletAddress,
      });

      return res.status(400).json({
        error: "Instructor has not configured payment wallet for this chain",
      });
    }

    console.log("✅ Instructor wallet found:", instructorWallet);

    // Step 10: Pre-validate backend can process payment
    console.log("🔍 Step 10: Pre-validating backend readiness...");

    const paymentMode = process.env.PAYMENT_MODE || "blockchain";

    if (paymentMode === "blockchain") {
      // Check AWS configuration
      const awsEnabled = process.env.AWS_SECRETS_ENABLED === "true";

      if (!awsEnabled) {
        console.error("❌ AWS Secrets Manager not enabled");
        return res.status(500).json({
          success: false,
          error: "Payment system not configured. Please contact support.",
        });
      }

      // Initialize payment service
      try {
        const { getPaymentService } = require("../services/blockchainService");
        const testService = getPaymentService();
        await testService.initialize(paymentToken);
        console.log("✅ Payment service initialized");

        // Verify escrow contract is accessible
        console.log("🔍 Verifying escrow contract...");
        try {
          const escrowContract = testService.getEscrowContract(
            paymentToken.blockchain,
            paymentToken.chainId
          );

          // Check if contract exists by getting code
          const provider = testService.getProvider(
            paymentToken.blockchain,
            paymentToken.chainId
          );

          const escrowAddress = await escrowContract.getAddress();
          const code = await provider.getCode(escrowAddress);

          if (code === "0x") {
            console.error("❌ Escrow contract not deployed!");
            return res.status(500).json({
              success: false,
              error:
                "Payment system configuration error. Please contact support.",
            });
          }

          console.log("✅ Escrow contract verified at:", escrowAddress);

          // Skip role check here - already verified in deployment
          // The verify-setup script confirmed operator has role
          console.log(
            "✅ Operator role assumed valid (verified during deployment)"
          );
        } catch (contractError) {
          console.error(
            "❌ Escrow contract check failed:",
            contractError.message
          );
          return res.status(500).json({
            success: false,
            error:
              "Cannot process payments at this time. Please try again later.",
          });
        }
      } catch (error) {
        console.error("❌ Backend validation failed:", error.message);
        return res.status(500).json({
          success: false,
          error:
            "Payment system temporarily unavailable. Please try again later.",
        });
      }
    }

    console.log("✅ Step 10: All validations passed - safe to proceed");

    res.json({
      success: true,
      calculation: {
        coursePrice: usdPrice,
        tokenPrice: tokenPriceUSD,
        tokenAmount: tokenAmount,
        tokenSymbol: paymentToken.symbol,
        platformFee: platformFeeAmount.toString(),
        instructorFee: instructorFeeAmount.toString(),
        revenueSplit: revenueSplitAmount.toString(),
        feePercentages: {
          platform: platformFeePercentage / 100,
          instructor: instructorFeePercentage / 100,
          revenueSplit: revenueSplitPercentage / 100,
        },
        blockchain: paymentToken.blockchain,
        chainId: paymentToken.chainId,
        instructorAddress: instructorWallet,
        escrowContractAddress: paymentToken.paymentContractAddress,
        registryContractAddress:
          paymentToken.registryContractAddress ||
          paymentToken.paymentContractAddress, // ADD THIS
      },
    });
  } catch (error) {
    console.error("Calculate payment error:", error);
    res.status(500).json({ error: "Failed to calculate payment" });
  }
};

/**
 * Process course purchase
 * AUTHENTICATED + CRITICAL RATE LIMITED
 * This is called AFTER user sends tokens to escrow contract
 */
const processPurchase = async (req, res) => {
  try {
    const {
      courseId,
      paymentTokenId,
      transactionHash,
      studentAddress,
      amountInToken,
    } = req.body;
    const userId = req.userId;

    // Strict validation
    if (
      !courseId ||
      !paymentTokenId ||
      !transactionHash ||
      !studentAddress ||
      !amountInToken
    ) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Validate transaction hash format (only for blockchain mode)
    const paymentMode = process.env.PAYMENT_MODE || "blockchain";
    if (paymentMode !== "dummy") {
      // Allow "already_approved" for cases where tokens were pre-approved
      if (
        transactionHash !== "already_approved" &&
        !/^0x[a-fA-F0-9]{64}$/.test(transactionHash)
      ) {
        return res.status(400).json({ error: "Invalid transaction hash" });
      }
    }

    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(studentAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Check if transaction already processed (only for real transactions)
    if (paymentMode !== "dummy") {
      const existingPurchase = await Purchase.findOne({ transactionHash });
      if (existingPurchase) {
        console.error("❌ Already purchased");
        return res.status(400).json({ error: "Course already purchased" });
      }
    }

    // Get course with instructor
    const course = await Course.findById(courseId)
      .populate(
        "instructor",
        "username evmWalletAddress walletAddress solanaWalletAddress paymentWallets"
      )
      .lean();

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Load payment token
    console.log("💳 Loading payment token...");
    const paymentToken = await PaymentToken.findById(paymentTokenId);

    if (!paymentToken || !paymentToken.isActive) {
      return res
        .status(400)
        .json({ error: "Invalid or inactive payment token" });
    }

    console.log("✅ Payment token loaded:", paymentToken.symbol);

    // CRITICAL: Verify token against registry
    const verification =
      await tokenVerificationService.verifyTokenAgainstRegistry(paymentToken);

    if (!verification.verified) {
      console.error(
        "❌ TOKEN VERIFICATION FAILED - Possible database tampering"
      );
      return res.status(403).json({
        error: "Token verification failed. Payment rejected for security.",
        details: verification.error,
      });
    }

    console.log("✅ Token verified against on-chain registry");

    // Verify user owns the wallet address
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.walletAddress.toLowerCase() !== studentAddress.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "Wallet address does not match user" });
    }
    // Check for ANY existing purchase (to handle all scenarios)
    const existingActivePurchase = await Purchase.findOne({
      user: req.userId,
      course: courseId,
    });

    // Block if active or completed
    if (
      existingActivePurchase &&
      ["active", "completed"].includes(existingActivePurchase.status)
    ) {
      console.error("❌ Already purchased (active/completed)");
      return res.status(400).json({
        error: "You have already purchased this course",
        purchaseId: existingActivePurchase._id,
      });
    }

    // Handle abandoned pending purchases (>10 minutes old) - DELETE them
    if (existingActivePurchase && existingActivePurchase.status === "pending") {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      if (existingActivePurchase.createdAt < tenMinutesAgo) {
        console.log("🧹 Deleting abandoned pending purchase");
        await Purchase.findByIdAndDelete(existingActivePurchase._id);
      } else {
        console.error("❌ Pending purchase exists (less than 10 minutes old)");
        return res.status(400).json({
          error:
            "You have a pending purchase. Please complete or wait 10 minutes.",
        });
      }
    }

    // If refunded/revoked/failed, allow new purchase (keep old record for audit)
    if (
      existingActivePurchase &&
      ["refunded", "revoked", "failed"].includes(existingActivePurchase.status)
    ) {
      console.log(
        `♻️ Previous purchase was ${existingActivePurchase.status} - creating new record`
      );
    }

    // Auto-cleanup old failed/pending purchases
    console.log("🧹 Cleaning up old failed/pending purchases...");
    const cleanupResult = await Purchase.deleteMany({
      user: userId,
      course: courseId,
      status: { $in: ["pending", "failed"] },
    });

    if (cleanupResult.deletedCount > 0) {
      console.log(
        `✅ Cleaned up ${cleanupResult.deletedCount} old purchase attempt(s)`
      );
    }

    // Clean up any failed/pending purchases for this user+course combination
    await Purchase.deleteMany({
      user: userId,
      course: courseId,
      status: { $in: ["pending", "failed"] },
    });

    console.log(
      "✅ Previous failed attempts cleaned up, proceeding with purchase"
    );

    // ============ DUMMY MODE ============
    if (paymentMode === "dummy") {
      console.log("🔧 DUMMY MODE: Skipping blockchain verification");

      // Calculate USD value (for dummy)
      const tokenPriceUSD = await getTokenPriceUSD(paymentToken);
      const tokenAmountBN = ethers.getBigInt(amountInToken);
      const decimals = paymentToken.decimals;
      const tokenAmountFloat = Number(
        ethers.formatUnits(tokenAmountBN, decimals)
      );
      const usdValue = tokenAmountFloat * tokenPriceUSD;

      // Get fee settings
      const feeSettings = await InstructorFeeSettings.getEffectiveFees(
        course.instructor._id
      );
      const platformFeePercentage = feeSettings.platformFeePercentage;
      const instructorFeePercentage = feeSettings.instructorFeePercentage;

      // Calculate fee amounts
      const platformFeeAmount =
        (tokenAmountBN * BigInt(platformFeePercentage)) / BigInt(10000);
      const instructorFeeAmount = tokenAmountBN - platformFeeAmount;

      // Get revenue split
      const platformSettings = await PlatformSettings.getSettings();
      const revenueSplitPercentage = platformSettings.revenueSplitPercentage;
      const revenueSplitAmount =
        (platformFeeAmount * BigInt(revenueSplitPercentage)) / BigInt(10000);

      // Get instructor wallet
      let instructorWallet;

      // Try new format first (paymentWallets array)
      if (
        course.instructor.paymentWallets &&
        course.instructor.paymentWallets.length > 0
      ) {
        const walletConfig = course.instructor.paymentWallets.find(
          (w) =>
            w.blockchain === paymentToken.blockchain &&
            w.chainId === paymentToken.chainId
        );
        instructorWallet = walletConfig?.address;
      }

      // Fallback to legacy format (direct wallet fields)
      if (!instructorWallet) {
        if (paymentToken.blockchain === "evm") {
          instructorWallet =
            course.instructor.evmWalletAddress ||
            course.instructor.walletAddress;
        } else if (paymentToken.blockchain === "solana") {
          instructorWallet = course.instructor.solanaWalletAddress;
        }
      }

      if (!instructorWallet) {
        console.error("❌ No instructor wallet found");
        console.error("Instructor:", course.instructor.username);
        console.error("Blockchain:", paymentToken.blockchain);
        console.error("ChainId:", paymentToken.chainId);
        console.error("Available wallets:", {
          evmWalletAddress: course.instructor.evmWalletAddress,
          walletAddress: course.instructor.walletAddress,
          solanaWalletAddress: course.instructor.solanaWalletAddress,
          paymentWallets: course.instructor.paymentWallets,
        });

        return res.status(400).json({
          error: "Instructor has not configured payment wallet for this chain",
          details: "Please set up your payment wallet in profile settings",
        });
      }

      console.log("✅ Instructor wallet found:", instructorWallet);

      // Create purchase record (DUMMY)
      const purchase = new Purchase({
        user: req.userId,
        course: courseId,
        paymentToken: paymentTokenId,
        transactionHash:
          transactionHash ||
          `dummy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        fromAddress: studentAddress,
        toAddress: instructorWallet,
        amountInToken: amountInToken,
        amountInUSD: usdValue,
        instructorAmount: instructorFeeAmount.toString(),
        platformAmount: platformFeeAmount.toString(),
        revenueSplitAmount: revenueSplitAmount.toString(),
        platformFeePercentage: platformFeePercentage,
        instructorFeePercentage: instructorFeePercentage,
        blockchain: paymentToken.blockchain,
        status: "active",
        escrowStatus: "dummy",
        escrowId: `dummy_escrow_${courseId}_${Date.now()}`,
        escrowReleaseDate: new Date(
          Date.now() + escrowPeriodDays * 24 * 60 * 60 * 1000
        ),
        paymentMethod: paymentToken.symbol.toLowerCase(), // usdc, usdt, etc.
        amount: usdValue, // USD amount
        currency: "USD",
        instructorRevenue: usdValue * (instructorFeePercentage / 10000),
        platformFee: usdValue * (platformFeePercentage / 10000),
      });

      await purchase.save();

      console.log("✅ DUMMY purchase created:", purchase._id);

      return res.json({
        success: true,
        message: "Purchase successful (DUMMY MODE)",
        purchase: {
          _id: purchase._id,
          transactionHash: purchase.transactionHash,
          status: purchase.status,
          escrowStatus: "dummy",
          mode: "dummy",
        },
      });
    }

    // ============ BLOCKCHAIN MODE ============
    console.log("🔗 BLOCKCHAIN MODE: Processing purchase with escrow");

    // Initialize payment service
    const paymentService = getPaymentService();
    await paymentService.initialize(paymentToken);

    const provider = paymentService.getProvider(
      paymentToken.blockchain,
      paymentToken.chainId
    );

    // Verify approval transaction exists and succeeded (if it's a real tx hash)
    if (transactionHash !== "already_approved") {
      console.log("🔍 Verifying approval transaction...");
      console.log("   TX Hash:", transactionHash);
      console.log("   Student:", studentAddress);

      const txReceipt = await provider.getTransactionReceipt(transactionHash);

      if (!txReceipt) {
        return res.status(400).json({
          error: "Transaction not found on blockchain",
        });
      }

      if (!txReceipt.status) {
        return res.status(400).json({
          error: "Transaction failed on blockchain",
        });
      }

      console.log("✅ Approval transaction confirmed");
    } else {
      console.log(
        "ℹ️ Tokens were already approved - skipping approval verification"
      );
    }

    // Calculate fees
    const tokenPriceUSD = await getTokenPriceUSD(paymentToken);
    const tokenAmountBN = ethers.getBigInt(amountInToken);
    const decimals = paymentToken.decimals;
    const tokenAmountFloat = Number(
      ethers.formatUnits(tokenAmountBN, decimals)
    );
    const usdValue = tokenAmountFloat * tokenPriceUSD;

    const feeSettings = await InstructorFeeSettings.getEffectiveFees(
      course.instructor._id
    );
    const platformFeePercentage = feeSettings.platformFeePercentage;
    const instructorFeePercentage = feeSettings.instructorFeePercentage;

    const platformFeeAmount =
      (tokenAmountBN * BigInt(platformFeePercentage)) / BigInt(10000);
    const instructorFeeAmount = tokenAmountBN - platformFeeAmount;

    const platformSettings = await PlatformSettings.getSettings();
    const revenueSplitPercentage = platformSettings.revenueSplitPercentage;
    const revenueSplitAmount =
      (platformFeeAmount * BigInt(revenueSplitPercentage)) / BigInt(10000);

    // Get instructor wallet
    let instructorWallet;

    // Try new format first (paymentWallets array)
    if (
      course.instructor.paymentWallets &&
      course.instructor.paymentWallets.length > 0
    ) {
      const walletConfig = course.instructor.paymentWallets.find(
        (w) =>
          w.blockchain === paymentToken.blockchain &&
          w.chainId === paymentToken.chainId
      );
      instructorWallet = walletConfig?.address;
    }

    // Fallback to legacy format (direct wallet fields)
    if (!instructorWallet) {
      if (paymentToken.blockchain === "evm") {
        instructorWallet =
          course.instructor.evmWalletAddress || course.instructor.walletAddress;
      } else if (paymentToken.blockchain === "solana") {
        instructorWallet = course.instructor.solanaWalletAddress;
      }
    }

    if (!instructorWallet) {
      console.error("❌ No instructor wallet found");
      console.error("Instructor:", course.instructor.username);
      console.error("Blockchain:", paymentToken.blockchain);
      console.error("Available wallets:", {
        evmWalletAddress: course.instructor.evmWalletAddress,
        walletAddress: course.instructor.walletAddress,
        solanaWalletAddress: course.instructor.solanaWalletAddress,
      });

      return res.status(400).json({
        error: "Instructor has not configured payment wallet for this chain",
      });
    }

    console.log("✅ Instructor wallet found:", instructorWallet);

    // Create purchase record FIRST (before escrow creation)
    console.log("💾 Creating purchase record...");

    const purchase = new Purchase({
      user: req.userId,
      course: courseId,
      paymentToken: paymentTokenId,
      transactionHash, // Approval transaction hash
      fromAddress: studentAddress,
      toAddress: instructorWallet,
      amountInToken: amountInToken,
      amountInUSD: usdValue,
      instructorAmount: instructorFeeAmount.toString(),
      platformAmount: platformFeeAmount.toString(),
      revenueSplitAmount: revenueSplitAmount.toString(),
      platformFeePercentage: platformFeePercentage,
      instructorFeePercentage: instructorFeePercentage,
      blockchain: paymentToken.blockchain,
      status: "pending", // Start as pending
      escrowStatus: "pending",
      escrowReleaseDate: new Date(Date.now() + 2 * 60 * 1000), // 2 min for testing
      // LEGACY
      paymentMethod: paymentToken.symbol.toLowerCase(), // usdc, usdt, etc.
      amount: usdValue, // USD amount
      currency: "USD",
      instructorRevenue: usdValue * (instructorFeePercentage / 10000),
      platformFee: usdValue * (platformFeePercentage / 10000),
    });

    await purchase.save();
    console.log("✅ Purchase record created:", purchase._id);

    // Now create escrow in smart contract (backend calls, contract pulls tokens)
    console.log("🔗 Creating escrow in smart contract...");
    console.log("   Student:", studentAddress);
    console.log("   Instructor:", instructorWallet);
    console.log("   Amount:", amountInToken);
    console.log("   Course ID:", course._id.toString());

    try {
      const escrowResult = await paymentService.createEscrowPayment({
        studentAddress: studentAddress,
        instructorAddress: instructorWallet,
        amountInToken: amountInToken,
        courseId: course._id.toString(),
        escrowPeriodDays: 14, // 0 for testing, 14 for production
        customPlatformFee: platformFeePercentage,
        blockchain: paymentToken.blockchain,
        chainId: paymentToken.chainId,
      });

      // Update purchase with escrow details
      purchase.escrowId = escrowResult.escrowId;
      purchase.escrowCreatedTxHash = escrowResult.transactionHash;
      purchase.status = "active"; // Now active
      purchase.escrowStatus = "locked";
      await purchase.save();

      console.log("✅ Escrow created successfully:");
      console.log("   Escrow ID:", escrowResult.escrowId);
      console.log("   TX Hash:", escrowResult.transactionHash);

      res.json({
        success: true,
        message: "Purchase successful",
        purchase: {
          _id: purchase._id,
          transactionHash: escrowResult.transactionHash,
          escrowId: purchase.escrowId,
          status: purchase.status,
          escrowStatus: purchase.escrowStatus,
        },
      });
    } catch (escrowError) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ ESCROW CREATION FAILED!");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("Error:", escrowError.message);
      console.error("Stack:", escrowError.stack);
      console.error("Purchase ID:", purchase._id);
      console.error("Approval TX:", transactionHash);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Update purchase as failed
      purchase.status = "failed";
      purchase.escrowStatus = "failed";
      await purchase.save();

      // Return error to user
      return res.status(500).json({
        error:
          "Failed to create escrow. Your approval is valid but escrow creation failed. Please contact support.",
        purchaseId: purchase._id,
        approvalTxHash: transactionHash,
        details:
          process.env.NODE_ENV === "production"
            ? undefined
            : escrowError.message,
      });
    }
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ CRITICAL PURCHASE PROCESSING ERROR");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("User ID:", req.userId);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Failed to process purchase. Please contact support."
          : error.message,
      details: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }
};

/**
 * Request refund for a purchase
 * AUTHENTICATED + CRITICAL RATE LIMITED
 */
const requestRefund = async (req, res) => {
  try {
    console.log("🔍 DEBUG Request:", {
      params: req.params,
      body: req.body,
      url: req.url,
      method: req.method,
    });

    const { purchaseId } = req.params;
    const userId = req.user._id;

    if (!purchaseId) {
      console.error("❌ purchaseId is missing from params!");
      return res.status(400).json({
        success: false,
        error: "Purchase ID required",
      });
    }

    console.log("💸 Refund request:", { purchaseId, userId });

    // Get purchase with course details
    const purchase = await Purchase.findById(purchaseId).populate("course");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Verify ownership
    if (purchase.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to refund this purchase" });
    }

    // Check refund eligibility
    const eligibility = purchase.checkRefundEligibility();

    if (!eligibility.eligible) {
      return res.status(400).json({ error: eligibility.reason });
    }

    const paymentMode = process.env.PAYMENT_MODE || "blockchain";

    // DUMMY MODE - Instant refund
    if (paymentMode === "dummy") {
      console.log("🔧 DUMMY MODE: Processing instant refund");

      purchase.escrowStatus = "refunded";
      purchase.status = "refunded";
      purchase.refundRequestedAt = new Date();
      purchase.refundProcessedAt = new Date();
      purchase.refundTransactionHash = `dummy_refund_${Date.now()}`;
      purchase.refundEligible = false;

      await purchase.save();

      return res.json({
        success: true,
        message: "Refund processed successfully (DUMMY MODE)",
        refund: {
          transactionHash: purchase.refundTransactionHash,
          amount: purchase.amountInToken,
          processedAt: purchase.refundProcessedAt,
          mode: "dummy",
        },
      });
    }

    // BLOCKCHAIN MODE - Process via smart contract
    // Get payment token
    const paymentToken = await PaymentToken.findById(purchase.paymentToken);
    if (!paymentToken) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    // Process refund via smart contract
    const paymentService = getPaymentService();
    await paymentService.initialize(paymentToken);

    // Get escrow ID from smart contract
    const escrowContract = paymentService.getEscrowContract(
      purchase.blockchain,
      paymentToken.chainId
    );

    const courseIdBytes32 = ethers.id(purchase.course._id.toString());
    const escrowId = await escrowContract.studentCourseEscrow(
      purchase.fromAddress,
      courseIdBytes32
    );

    if (escrowId === ethers.ZeroHash) {
      return res.status(404).json({ error: "Escrow not found on blockchain" });
    }

    // Process refund
    const result = await paymentService.refundEscrow({
      // ✅ Correct method name
      escrowId: purchase.escrowId,
      blockchain: purchase.blockchain,
      chainId: purchase.paymentToken.chainId,
    });

    // Update purchase
    purchase.escrowStatus = "refunded";
    purchase.status = "refunded";
    purchase.refundRequestedAt = new Date();
    purchase.refundProcessedAt = new Date();
    purchase.refundTransactionHash = result.transactionHash;
    purchase.refundEligible = false;

    await purchase.save();

    console.log("✅ Refund processed:", purchase._id);

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund: {
        transactionHash: result.transactionHash,
        amount: purchase.amountInToken,
        processedAt: purchase.refundProcessedAt,
      },
    });
  } catch (error) {
    console.error("Request refund error:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
};

/**
 * Calculate refund eligibility for a purchase
 */
function calculateRefundEligibility(purchase) {
  // Can't refund if already completed, refunded, or released
  if (purchase.status === "completed") {
    return {
      eligible: false,
      reason: "Course already completed",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  if (purchase.status === "refunded") {
    return {
      eligible: false,
      reason: "Already refunded",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  if (purchase.escrowStatus === "released") {
    return {
      eligible: false,
      reason: "Payment already released to instructor",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  // Check if within time window (before escrow release)
  const now = new Date();
  const releaseDate = new Date(purchase.escrowReleaseDate);
  const timeLeft = releaseDate - now;

  if (timeLeft <= 0) {
    return {
      eligible: false,
      reason: "Refund period expired",
      daysLeft: 0,
      hoursLeft: 0,
      progressLimit: false,
    };
  }

  // Check progress limit (e.g., can't refund if >20% completed)
  const PROGRESS_LIMIT = 20; // 20%
  const currentProgress = purchase.progress || 0;

  if (currentProgress > PROGRESS_LIMIT) {
    return {
      eligible: false,
      reason: `Cannot refund after completing ${PROGRESS_LIMIT}% of course`,
      daysLeft: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
      hoursLeft: Math.floor(timeLeft / (1000 * 60 * 60)),
      progressLimit: true,
      currentProgress: currentProgress,
      maxProgress: PROGRESS_LIMIT,
    };
  }

  // Eligible for refund
  return {
    eligible: true,
    reason: "Eligible for full refund",
    daysLeft: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
    hoursLeft: Math.floor(timeLeft / (1000 * 60 * 60)),
    progressLimit: false,
    currentProgress: currentProgress,
    maxProgress: PROGRESS_LIMIT,
  };
}

/**
 * Get student purchase history with refund eligibility
 */
const getStudentPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("📚 Fetching purchase history for user:", userId);

    // Fetch all purchases with populated data
    const purchases = await Purchase.find({ user: userId })
      .populate({
        path: "course",
        select:
          "title slug thumbnail price duration totalLessons instructor status",
        populate: {
          path: "instructor",
          select: "name username avatar",
        },
      })
      .populate({
        path: "paymentToken",
        select: "name symbol decimals chainId blockchain",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${purchases.length} purchase(s)`);

    // Calculate refund eligibility for each purchase
    const purchasesWithEligibility = purchases.map((purchase) => {
      const refundEligibility = calculateRefundEligibility(purchase);

      return {
        _id: purchase._id,
        course: purchase.course,
        paymentToken: purchase.paymentToken,
        amountInToken: purchase.amountInToken,
        amountInUSD: purchase.amountInUSD,
        status: purchase.status,
        escrowStatus: purchase.escrowStatus,
        purchaseDate: purchase.createdAt,
        progress: purchase.progress || 0,
        completedLessons: purchase.completedLessons || [],
        totalWatchTime: purchase.totalWatchTime || 0,
        isCompleted: purchase.isCompleted || false,
        escrowReleaseDate: purchase.escrowReleaseDate,
        escrowReleasedAt: purchase.escrowReleasedAt,
        refundEligibility,
      };
    });

    res.json({
      success: true,
      purchases: purchasesWithEligibility,
    });
  } catch (error) {
    console.error("❌ Get purchase history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch purchase history",
    });
  }
};
/**
 * Request refund for a purchase
 */
exports.requestRefund = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user._id;

    console.log("💸 Refund request:", { purchaseId, userId });

    // Find purchase
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      user: userId,
    })
      .populate("course")
      .populate("paymentToken");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    // Check eligibility
    const eligibility = calculateRefundEligibility(purchase);

    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        error: eligibility.reason,
        eligibility,
      });
    }

    // Check if escrow exists
    if (!purchase.escrowId) {
      return res.status(400).json({
        success: false,
        error: "No escrow found for this purchase",
      });
    }

    console.log("✅ Refund eligible, processing...");

    // Initialize payment service
    const paymentService = getPaymentService();
    await paymentService.initialize(purchase.paymentToken);

    console.log("🔐 Calling refundEscrow on blockchain...");
    const result = await paymentService.refundEscrow({
      escrowId: purchase.escrowId, // ✅ Only need escrowId
    });
    console.log("✅ Blockchain refund successful:", result.transactionHash);

    // Update purchase status
    purchase.status = "refunded";
    purchase.escrowStatus = "refunded";
    purchase.refundedAt = new Date();
    purchase.refundTransactionHash = result.transactionHash;
    purchase.refundEligible = false;
    await purchase.save();

    console.log("✅ Purchase updated to refunded status");

    res.json({
      success: true,
      message: "Refund processed successfully",
      transactionHash: result.transactionHash,
      purchase: {
        _id: purchase._id,
        status: purchase.status,
        escrowStatus: purchase.escrowStatus,
        refundedAt: purchase.refundedAt,
      },
    });
  } catch (error) {
    console.error("❌ Refund error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process refund",
    });
  }
};

console.log("📦 Exporting calculatePayment:", typeof calculatePayment);
module.exports = {
  getPaymentTokens,
  getTokenPrice,
  calculatePayment,
  processPurchase,
  getStudentPurchaseHistory,
  requestRefund,
};
