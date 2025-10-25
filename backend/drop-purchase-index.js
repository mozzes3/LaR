const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");

async function dropIndex() {
  try {
    console.log("🔧 Connecting to MongoDB...");
    console.log("   URI:", process.env.MONGODB_URI ? "Found" : "NOT FOUND");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Purchase = mongoose.connection.collection("purchases");

    // Drop the unique index
    await Purchase.dropIndex("user_1_course_1");

    console.log("✅ Unique index dropped successfully!");
    console.log("✅ Users can now re-purchase after refund");

    process.exit(0);
  } catch (error) {
    if (error.message.includes("index not found")) {
      console.log("✅ Index already removed or doesn't exist");
      process.exit(0);
    } else {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }
}

dropIndex();
