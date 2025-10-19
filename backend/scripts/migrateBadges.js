// backend/scripts/migrateBadges.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const migrateBadges = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Find all instructors without badges field
  const instructors = await User.find({
    isInstructor: true,
    badges: { $exists: false },
  });

  console.log(`Found ${instructors.length} instructors to migrate`);

  for (const instructor of instructors) {
    instructor.badges = ["Instructor"];
    await instructor.save();
  }

  console.log("✅ Migration complete");
  process.exit(0);
};

migrateBadges();
