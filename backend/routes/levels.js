const express = require("express");
const router = express.Router();
const { getLevelProgress, getLevelMilestones } = require("../config/levels");
const { authenticate } = require("../middleware/auth");

/**
 * @route   GET /api/levels/progress
 * @desc    Get user's level progress
 * @access  Private
 */
router.get("/progress", authenticate, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const progress = getLevelProgress(user.totalXP || 0);

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Get level progress error:", error);
    res.status(500).json({ error: "Failed to get level progress" });
  }
});

/**
 * @route   GET /api/levels/milestones
 * @desc    Get level milestones
 * @access  Public
 */
router.get("/milestones", (req, res) => {
  try {
    const milestones = getLevelMilestones();

    res.json({
      success: true,
      milestones,
    });
  } catch (error) {
    console.error("Get level milestones error:", error);
    res.status(500).json({ error: "Failed to get level milestones" });
  }
});

module.exports = router;
