const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");

async function forceUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);

  const NEW_REGISTRY = "0x55a1591AEB8aEEA24452D75917b710a1F66feC50";

  console.log("🔧 FORCE updating to NEW registry...");
  console.log("   NEW:", NEW_REGISTRY);

  await mongoose.connection.db
    .collection("paymenttokens")
    .updateOne(
      { _id: new mongoose.Types.ObjectId("68faa440011ab4242460aea9") },
      { $set: { registryContractAddress: NEW_REGISTRY } }
    );

  const doc = await mongoose.connection.db
    .collection("paymenttokens")
    .findOne({ _id: new mongoose.Types.ObjectId("68faa440011ab4242460aea9") });

  console.log("✅ Updated! Now:", doc.registryContractAddress);

  process.exit(0);
}

forceUpdate();
