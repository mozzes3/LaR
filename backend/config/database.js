const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected Successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📍 Host:", mongoose.connection.host);
    console.log("📍 Port:", mongoose.connection.port);
    console.log("📍 Database:", mongoose.connection.name);
    console.log("📍 Connection State:", mongoose.connection.readyState); // 1 = connected
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Show connection string (with password hidden)
    const safeUri = process.env.MONGODB_URI.replace(/:[^:]*@/, ":****@");
    console.log("🔗 Connection String:", safeUri);
    console.log("");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
