const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const Purchase = require("./modules/payment/models/Purchase");

async function fixPurchase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const purchase = await Purchase.findById("68fbfee8d18b34800dd51532");

    console.log("📊 Current Release Date:", purchase.escrowReleaseDate);

    // Set to 14 days from creation date
    const createdAt = new Date(purchase.createdAt);
    purchase.escrowReleaseDate = new Date(
      createdAt.getTime() + 14 * 24 * 60 * 60 * 1000
    );

    await purchase.save();

    console.log("✅ Updated Release Date:", purchase.escrowReleaseDate);
    console.log(
      "✅ Days Left:",
      Math.floor(
        (purchase.escrowReleaseDate - new Date()) / (1000 * 60 * 60 * 24)
      )
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixPurchase();
