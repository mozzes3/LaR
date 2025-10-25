const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");

async function updateContracts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔧 Updating contract addresses...\n");

    const NEW_ESCROW = "0xE6bf35Eb569cf102432CD89eDeea0364FD76bd67";
    const NEW_REGISTRY = "0x206b33C964E95D987cFc45613FCE20fE14844E17";

    const result = await mongoose.connection.db
      .collection("paymenttokens")
      .updateOne(
        {
          symbol: "USDC",
          chainId: 11155111,
        },
        {
          $set: {
            paymentContractAddress: NEW_ESCROW,
            registryContractAddress: NEW_REGISTRY,
          },
        }
      );

    console.log(
      "✅ Update result:",
      result.modifiedCount,
      "document(s) updated"
    );

    // Verify
    const doc = await mongoose.connection.db
      .collection("paymenttokens")
      .findOne({
        symbol: "USDC",
        chainId: 11155111,
      });

    console.log("\n📋 Current Configuration:");
    console.log("   Token Contract:", doc.contractAddress);
    console.log("   Escrow Contract:", doc.paymentContractAddress);
    console.log("   Registry Contract:", doc.registryContractAddress);
    console.log("");

    if (
      doc.paymentContractAddress === NEW_ESCROW &&
      doc.registryContractAddress === NEW_REGISTRY
    ) {
      console.log("✅ All addresses updated correctly!");
    } else {
      console.error("❌ Addresses don't match!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

updateContracts();
