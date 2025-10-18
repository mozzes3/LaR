/**
 * Level System Configuration
 *
 * Formula: XP required = baseXP * (level ^ exponent)
 * This creates an exponential curve where each level requires more XP
 */

const LEVEL_CONFIG = {
  baseXP: 500, // Base XP for level 1
  exponent: 1.5, // Exponential growth factor
  maxLevel: 100, // Maximum achievable level
};

/**
 * Calculate XP required for a specific level
 */
const getXPForLevel = (level) => {
  if (level <= 1) return 0;
  return Math.floor(
    LEVEL_CONFIG.baseXP * Math.pow(level, LEVEL_CONFIG.exponent)
  );
};

/**
 * Calculate level from total XP
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
 */
const getLevelProgress = (totalXP) => {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentLevel,
    totalXP,
    currentLevelXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    isMaxLevel: currentLevel >= LEVEL_CONFIG.maxLevel,
  };
};

/**
 * Get all level milestones (for display purposes)
 */
const getLevelMilestones = () => {
  const milestones = [];

  for (let level = 1; level <= Math.min(50, LEVEL_CONFIG.maxLevel); level++) {
    milestones.push({
      level,
      xpRequired: getXPForLevel(level),
    });
  }

  return milestones;
};

/**
 * Award XP and return level-up information
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

module.exports = {
  LEVEL_CONFIG,
  getXPForLevel,
  getLevelFromXP,
  getLevelProgress,
  getLevelMilestones,
  awardXP,
};
