require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/database");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createSuperAdmin = async () => {
  try {
    await connectDB();

    console.log("\n🔐 Create Super Admin\n");
    console.log("This script will promote a user to Super Admin status.");
    console.log("You can search by wallet address or username.\n");

    const searchType = await question(
      "Search by (1) Wallet Address or (2) Username? [1/2]: "
    );

    let user;

    if (searchType === "1") {
      const walletAddress = await question("Enter wallet address: ");
      user = await User.findOne({
        walletAddress: walletAddress.toLowerCase(),
      });
    } else {
      const username = await question("Enter username: ");
      user = await User.findOne({ username: username });
    }

    if (!user) {
      console.log("\n❌ User not found!");
      console.log(
        "💡 Make sure the user has logged in at least once before promoting them."
      );
      process.exit(1);
    }

    console.log("\n📋 User Found:");
    console.log(`   Username: ${user.username}`);
    console.log(`   Wallet: ${user.walletAddress}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Is Super Admin: ${user.isSuperAdmin ? "Yes" : "No"}`);
    console.log(`   Is Instructor: ${user.isInstructor ? "Yes" : "No"}\n`);

    if (user.isSuperAdmin) {
      console.log("⚠️  This user is already a Super Admin!");
      const confirm = await question("Continue anyway? [y/N]: ");
      if (confirm.toLowerCase() !== "y") {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    const confirm = await question("Promote this user to Super Admin? [y/N]: ");

    if (confirm.toLowerCase() !== "y") {
      console.log("Cancelled.");
      process.exit(0);
    }

    // Update user
    user.role = "admin";
    user.isSuperAdmin = true;
    await user.save();

    console.log("\n✅ Success!");
    console.log(`${user.username} is now a Super Admin!`);
    console.log("\n🎉 They now have full access to:");
    console.log("   • Admin Dashboard");
    console.log("   • User Management");
    console.log("   • Role Management");
    console.log("   • Course Moderation");
    console.log("   • Review Management");
    console.log("   • All System Permissions");
    console.log(
      "\n💡 They will need to log out and log back in to see admin features.\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
};

createSuperAdmin();
