require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { getLevelFromXP } = require("../config/levels");
const connectDB = require("../config/database");

const syncUserLevels = async () => {
  try {
    await connectDB();

    console.log("🔄 Syncing user levels with totalXP...");

    const users = await User.find({});
    let updated = 0;

    for (const user of users) {
      const currentLevel = user.level;
      const calculatedLevel = getLevelFromXP(user.totalXP || 0);

      if (currentLevel !== calculatedLevel) {
        user.level = calculatedLevel;
        await user.save();

        console.log(
          `✅ ${user.username}: Level ${currentLevel} → ${calculatedLevel} (${user.totalXP} XP)`
        );
        updated++;
      }
    }

    console.log(`\n🎉 Updated ${updated} users!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

syncUserLevels();
