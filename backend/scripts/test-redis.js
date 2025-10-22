const redis = require("redis");
require("dotenv").config();

async function testRedis() {
  console.log("🔍 Testing Redis connection...");
  console.log(
    "📍 REDIS_URL:",
    process.env.REDIS_URL || "redis://localhost:6379"
  );

  const client = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => console.error("❌ Redis Error:", err.message));
  client.on("connect", () => console.log("✅ Redis Connected!"));

  try {
    await client.connect();
    const pong = await client.ping();
    console.log("✅ PING:", pong);

    await client.set("test", "Hello Redis!");
    const value = await client.get("test");
    console.log("✅ GET test:", value);

    await client.disconnect();
    console.log("✅ Redis test complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Redis test failed:", error.message);
    process.exit(1);
  }
}

testRedis();
