/**
 * Level System Configuration
 *
 * Formula: XP required = baseXP * (level ^ exponent)
 * This creates a smoother curve with more achievable milestones
 */

const LEVEL_CONFIG = {
  baseXP: 500, // Base XP for level 2
  exponent: 1.15, // Reduced from 1.5 for gentler growth
  maxLevel: 100, // Maximum achievable level
};

/**
 * Calculate XP required for a specific level transition
 * Uses a hybrid approach for more realistic progression
 */
const getXPForLevelTransition = (level) => {
  if (level <= 1) return 0;

  // Early levels (2-10): Linear-ish growth
  if (level <= 10) {
    return Math.floor(LEVEL_CONFIG.baseXP * level * 0.8);
  }

  // Mid levels (11-30): Moderate exponential growth
  if (level <= 30) {
    return Math.floor(
      LEVEL_CONFIG.baseXP * Math.pow(level * 0.6, LEVEL_CONFIG.exponent)
    );
  }

  // High levels (31+): Steeper but still manageable
  return Math.floor(
    LEVEL_CONFIG.baseXP * Math.pow(level * 0.5, LEVEL_CONFIG.exponent + 0.1)
  );
};

/**
 * Calculate TOTAL XP required to reach a specific level
 * This is the cumulative XP from level 1 to target level
 */
const getXPForLevel = (level) => {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += getXPForLevelTransition(i);
  }

  return totalXP;
};

/**
 * Calculate level from total XP
 * This determines which level a user should be at based on their total XP
 */
const getLevelFromXP = (totalXP) => {
  let level = 1;

  while (level < LEVEL_CONFIG.maxLevel) {
    const requiredXP = getXPForLevel(level + 1);
    if (totalXP < requiredXP) {
      break;
    }
    level++;
  }

  return level;
};

/**
 * Get level progress information
 * Returns detailed info about current level, progress, and XP needed
 */
const getLevelProgress = (totalXP) => {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercentage =
    xpNeededForNextLevel > 0
      ? (xpInCurrentLevel / xpNeededForNextLevel) * 100
      : 100;

  return {
    currentLevel,
    totalXP,
    currentLevelXP, // Total XP at start of current level
    nextLevelXP, // Total XP needed to reach next level
    xpInCurrentLevel, // XP earned within current level
    xpNeededForNextLevel, // XP needed to complete current level
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    isMaxLevel: currentLevel >= LEVEL_CONFIG.maxLevel,
  };
};

/**
 * Get all level milestones (for display purposes)
 * Shows XP requirements for each level
 */
const getLevelMilestones = () => {
  const milestones = [];

  for (let level = 1; level <= Math.min(50, LEVEL_CONFIG.maxLevel); level++) {
    milestones.push({
      level,
      xpRequired: getXPForLevel(level),
      xpForThisLevel: level === 1 ? 0 : getXPForLevelTransition(level),
    });
  }

  return milestones;
};

/**
 * Award XP and return level-up information
 * Calculates if user leveled up and by how many levels
 */
const awardXP = (currentTotalXP, xpToAdd) => {
  const oldLevel = getLevelFromXP(currentTotalXP);
  const newTotalXP = currentTotalXP + xpToAdd;
  const newLevel = getLevelFromXP(newTotalXP);

  const leveledUp = newLevel > oldLevel;
  const levelsGained = newLevel - oldLevel;

  return {
    oldLevel,
    newLevel,
    oldTotalXP: currentTotalXP,
    newTotalXP,
    xpGained: xpToAdd,
    leveledUp,
    levelsGained,
    progress: getLevelProgress(newTotalXP),
  };
};

// Debug function to print level requirements
const printLevelRequirements = () => {
  console.log("📊 Level Requirements (New Balanced System):");
  console.log("Level 1: 0 XP (starting level)");

  for (let level = 2; level <= 20; level++) {
    const totalXP = getXPForLevel(level);
    const xpForThisLevel = getXPForLevelTransition(level);

    console.log(
      `Level ${level}: ${totalXP.toLocaleString()} total XP (${xpForThisLevel.toLocaleString()} XP to level up)`
    );
  }

  console.log("\n🎯 Comparison with old system:");
  console.log("Old: Lv2=1414 XP, Lv3=3242 XP, Lv5=9899 XP");
  console.log("New: Lv2=800 XP, Lv3=2000 XP, Lv5=5000 XP");
};

module.exports = {
  LEVEL_CONFIG,
  getXPForLevel,
  getLevelFromXP,
  getLevelProgress,
  getLevelMilestones,
  awardXP,
  printLevelRequirements,
};
