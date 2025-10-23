const { getPaymentService } = require("../services/blockchainService");
const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");
const InstructorFeeSettings = require("../models/InstructorFeeSettings");
const Purchase = require("../models/Purchase");
const Course = require("../../../models/Course"); // ✅ CORRECT - go up 3 levels
const User = require("../../../models/User");
const { ethers } = require("ethers");
const axios = require("axios");

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

    // Get current prices for non-stablecoins
    const tokensWithPrices = await Promise.all(
      tokens.map(async (token) => {
        const currentPrice = await getTokenPriceUSD(token);
        return {
          ...token,
          currentPriceUSD: currentPrice,
        };
      })
    );

    res.json({
      success: true,
      tokens: tokensWithPrices,
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
  try {
    const { courseId, paymentTokenId } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!courseId || !paymentTokenId) {
      return res
        .status(400)
        .json({ error: "Course ID and payment token required" });
    }

    // Get course
    const course = await Course.findById(courseId)
      .populate("instructor", "paymentWallets")
      .lean();

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.status !== "published") {
      return res.status(400).json({ error: "Course is not available" });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "Course already purchased" });
    }

    // Get payment token
    const paymentToken = await PaymentToken.findById(paymentTokenId);
    if (!paymentToken || !paymentToken.isActive) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    // Get token price
    const tokenPriceUSD = await getTokenPriceUSD(paymentToken);

    // Get course price in USD
    const coursePrice = course.price.usd;

    // Calculate amount in tokens
    const tokenAmount = calculateTokenAmount(
      coursePrice,
      tokenPriceUSD,
      paymentToken.decimals
    );

    // Get fee settings
    const feeSettings = await InstructorFeeSettings.getEffectiveFees(
      course.instructor._id
    );

    // Calculate fees
    const platformFeePercentage = feeSettings.platformFeePercentage;
    const instructorFeePercentage = feeSettings.instructorFeePercentage;

    // Get platform settings for revenue split
    const platformSettings = await PlatformSettings.getSettings();
    const revenueSplitPercentage = platformSettings.revenueSplitPercentage;

    // Calculate escrow period
    const escrowPeriodDays =
      course.escrowSettings?.refundPeriodDays ||
      platformSettings.defaultEscrowPeriodDays;

    // Calculate instructor wallet address
    const instructorWallet =
      course.instructor.paymentWallets?.get(paymentToken.blockchain) || null;

    if (!instructorWallet) {
      return res.status(400).json({
        error: "Instructor has not set up payment wallet for this blockchain",
      });
    }

    res.json({
      success: true,
      payment: {
        courseId: course._id,
        courseName: course.title,
        coursePrice: coursePrice,
        paymentToken: {
          id: paymentToken._id,
          symbol: paymentToken.symbol,
          name: paymentToken.name,
          contractAddress: paymentToken.contractAddress,
          blockchain: paymentToken.blockchain,
          chainId: paymentToken.chainId,
          decimals: paymentToken.decimals,
          isNative: paymentToken.isNative,
        },
        tokenPriceUSD,
        tokenAmount,
        platformFeePercentage,
        instructorFeePercentage,
        revenueSplitPercentage,
        escrowPeriodDays,
        instructorAddress: instructorWallet,
        escrowContractAddress: paymentToken.paymentContractAddress,
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

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({ error: "Invalid transaction hash" });
    }

    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(studentAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Check if transaction already processed
    const existingPurchase = await Purchase.findOne({ transactionHash });
    if (existingPurchase) {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    // Get course with instructor
    const course = await Course.findById(courseId)
      .populate("instructor", "paymentWallets")
      .lean();

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get payment token
    const paymentToken = await PaymentToken.findById(paymentTokenId);
    if (!paymentToken || !paymentToken.isActive) {
      return res.status(404).json({ error: "Payment token not found" });
    }

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

    // Verify transaction on blockchain
    const paymentService = getPaymentService();
    await paymentService.initialize(paymentToken);

    const provider = paymentService.getProvider(
      paymentToken.blockchain,
      paymentToken.chainId
    );

    const txReceipt = await provider.getTransactionReceipt(transactionHash);

    if (!txReceipt) {
      return res
        .status(400)
        .json({ error: "Transaction not found on blockchain" });
    }

    if (!txReceipt.status) {
      return res.status(400).json({ error: "Transaction failed" });
    }

    // Verify transaction is to escrow contract
    if (
      txReceipt.to.toLowerCase() !==
      paymentToken.paymentContractAddress.toLowerCase()
    ) {
      return res
        .status(400)
        .json({ error: "Transaction not sent to escrow contract" });
    }

    // Get token price
    const tokenPriceUSD = await getTokenPriceUSD(paymentToken);

    // Calculate USD value
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

    // Calculate fee amounts in tokens
    const platformFeeAmount =
      (tokenAmountBN * BigInt(platformFeePercentage)) / BigInt(10000);
    const instructorFeeAmount = tokenAmountBN - platformFeeAmount;

    // Get revenue split percentage
    const platformSettings = await PlatformSettings.getSettings();
    const revenueSplitPercentage = platformSettings.revenueSplitPercentage;
    const revenueSplitAmount =
      (platformFeeAmount * BigInt(revenueSplitPercentage)) / BigInt(10000);

    // Calculate escrow release date
    const escrowPeriodDays =
      course.escrowSettings?.refundPeriodDays ||
      platformSettings.defaultEscrowPeriodDays;

    const escrowReleaseDate = new Date();
    escrowReleaseDate.setDate(escrowReleaseDate.getDate() + escrowPeriodDays);

    // Create purchase record
    const purchase = new Purchase({
      user: userId,
      course: courseId,
      paymentToken: paymentTokenId,
      amount: tokenAmountFloat,
      amountInToken: amountInToken,
      priceUSD: usdValue,
      transactionHash,
      blockchain: paymentToken.blockchain,
      blockNumber: txReceipt.blockNumber,
      fromAddress: studentAddress,
      platformFeeAmount: platformFeeAmount.toString(),
      instructorFeeAmount: instructorFeeAmount.toString(),
      revenueSplitAmount: revenueSplitAmount.toString(),
      platformFeePercentage,
      instructorFeePercentage,
      escrowStatus: "pending",
      escrowReleaseDate,
      refundEligible: true,
      status: "active",
      smartContractData: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    await purchase.save();

    console.log("✅ Purchase created:", purchase._id);

    res.json({
      success: true,
      message: "Purchase processed successfully",
      purchase: {
        id: purchase._id,
        transactionHash: purchase.transactionHash,
        escrowReleaseDate: purchase.escrowReleaseDate,
        refundEligibleUntil: purchase.escrowReleaseDate,
      },
    });
  } catch (error) {
    console.error("Process purchase error:", error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
};

/**
 * Request refund
 * AUTHENTICATED + CRITICAL RATE LIMITED
 */
/**
 * Request refund
 * AUTHENTICATED + CRITICAL RATE LIMITED
 */
const requestRefund = async (req, res) => {
  try {
    const { purchaseId } = req.body;
    const userId = req.userId;

    if (!purchaseId) {
      return res.status(400).json({ error: "Purchase ID required" });
    }

    // Get purchase
    const purchase = await Purchase.findById(purchaseId).populate("course");

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Verify ownership
    if (purchase.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to refund this purchase" });
    }

    // Check refund eligibility
    const eligibility = purchase.checkRefundEligibility();

    if (!eligibility.eligible) {
      return res.status(400).json({ error: eligibility.reason });
    }

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
    const result = await paymentService.processRefund({
      escrowId,
      blockchain: purchase.blockchain,
      chainId: paymentToken.chainId,
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

// ← ADD THIS EXPORT SECTION
module.exports = {
  getPaymentTokens,
  getTokenPrice,
  calculatePayment,
  processPurchase,
  requestRefund,
};
