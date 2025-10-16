require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    console.log(
      "Connection string:",
      process.env.MONGODB_URI.replace(/:[^:]*@/, ":****@")
    ); // Hide password in logs

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Successfully connected to MongoDB Atlas!");
    console.log("Database:", mongoose.connection.name);

    // Test creating a simple document
    const TestSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model("Test", TestSchema);

    const doc = await TestModel.create({ test: "Connection successful!" });
    console.log("✅ Test document created:", doc);

    // Clean up
    await TestModel.deleteOne({ _id: doc._id });
    console.log("✅ Test document deleted");

    await mongoose.connection.close();
    console.log("✅ Connection closed successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
};

testConnection();
