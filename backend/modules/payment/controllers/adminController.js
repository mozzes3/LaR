const PaymentToken = require("../models/PaymentToken");
const PlatformSettings = require("../models/PlatformSettings");
const InstructorFeeSettings = require("../models/InstructorFeeSettings");
const User = require("../../../models/User");

/**
 * Get all payment tokens (admin)
 */
const getPaymentTokensAdmin = async (req, res) => {
  try {
    const tokens = await PaymentToken.find().sort({ displayOrder: 1 });

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error("Get payment tokens admin error:", error);
    res.status(500).json({ error: "Failed to get payment tokens" });
  }
};

/**
 * Create payment token
 */
const createPaymentToken = async (req, res) => {
  try {
    const tokenData = req.body;

    // Validate required fields
    const requiredFields = [
      "symbol",
      "name",
      "blockchain",
      "chainId",
      "chainName",
      "rpcUrl",
      "explorerUrl",
      "contractAddress",
      "paymentContractAddress",
      "decimals",
      "priceOracleType",
    ];

    for (const field of requiredFields) {
      if (!tokenData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const token = new PaymentToken(tokenData);
    await token.save();

    console.log("✅ Payment token created:", token.symbol);

    res.json({
      success: true,
      message: "Payment token created successfully",
      token,
    });
  } catch (error) {
    console.error("Create payment token error:", error);
    res.status(500).json({ error: "Failed to create payment token" });
  }
};

/**
 * Update payment token
 */
const updatePaymentToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const updates = req.body;

    const token = await PaymentToken.findByIdAndUpdate(tokenId, updates, {
      new: true,
      runValidators: true,
    });

    if (!token) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    console.log("✅ Payment token updated:", token.symbol);

    res.json({
      success: true,
      message: "Payment token updated successfully",
      token,
    });
  } catch (error) {
    console.error("Update payment token error:", error);
    res.status(500).json({ error: "Failed to update payment token" });
  }
};

/**
 * Delete payment token
 */
const deletePaymentToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await PaymentToken.findByIdAndDelete(tokenId);

    if (!token) {
      return res.status(404).json({ error: "Payment token not found" });
    }

    console.log("✅ Payment token deleted:", token.symbol);

    res.json({
      success: true,
      message: "Payment token deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment token error:", error);
    res.status(500).json({ error: "Failed to delete payment token" });
  }
};

/**
 * Get platform settings
 */
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get platform settings error:", error);
    res.status(500).json({ error: "Failed to get platform settings" });
  }
};

/**
 * Update platform settings
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const updates = req.body;

    const settings = await PlatformSettings.updateSettings(updates);

    console.log("✅ Platform settings updated");

    res.json({
      success: true,
      message: "Platform settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update platform settings error:", error);
    res.status(500).json({ error: "Failed to update platform settings" });
  }
};

/**
 * Get instructor fee settings
 */
const getInstructorFeeSettings = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const settings = await InstructorFeeSettings.findOne({
      instructor: instructorId,
    }).populate("instructor", "username displayName");

    const effectiveFees = await InstructorFeeSettings.getEffectiveFees(
      instructorId
    );

    res.json({
      success: true,
      settings,
      effectiveFees,
    });
  } catch (error) {
    console.error("Get instructor fee settings error:", error);
    res.status(500).json({ error: "Failed to get instructor fee settings" });
  }
};

/**
 * Update instructor fee settings
 */
const updateInstructorFeeSettings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const updates = req.body;
    const adminId = req.userId;

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    let settings = await InstructorFeeSettings.findOne({
      instructor: instructorId,
    });

    if (!settings) {
      settings = new InstructorFeeSettings({
        instructor: instructorId,
        ...updates,
        updatedBy: adminId,
      });
    } else {
      Object.assign(settings, updates);
      settings.updatedBy = adminId;
    }

    await settings.save();

    console.log("✅ Instructor fee settings updated for:", instructor.username);

    res.json({
      success: true,
      message: "Instructor fee settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update instructor fee settings error:", error);
    res.status(500).json({
      error: "Failed to update instructor fee settings",
    });
  }
};

/**
 * Get all instructor fee settings
 */
const getAllInstructorFeeSettings = async (req, res) => {
  try {
    const settings = await InstructorFeeSettings.find()
      .populate("instructor", "username displayName email")
      .populate("updatedBy", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get all instructor fee settings error:", error);
    res.status(500).json({ error: "Failed to get instructor fee settings" });
  }
};

module.exports = {
  getPaymentTokensAdmin,
  createPaymentToken,
  updatePaymentToken,
  deletePaymentToken,
  getPlatformSettings,
  updatePlatformSettings,
  getInstructorFeeSettings,
  updateInstructorFeeSettings,
  getAllInstructorFeeSettings,
};
