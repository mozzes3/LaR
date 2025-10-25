const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const Purchase = require("../../modules/payment/models/Purchase");

async function fixReleaseDate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Purchase.findByIdAndUpdate(
      "68fbed5b231836d61671db6f",
      {
        escrowReleaseDate: new Date(Date.now() - 60000), // Set to 1 minute ago
      }
    );

    console.log("✅ Updated release date to past");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixReleaseDate();
