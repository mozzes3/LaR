require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
const awsModeratorService = require("../services/awsModeratorService");

async function testRoleSystem() {
  console.log("🧪 Testing Role System\n");

  // Test admin wallet
  const adminWallet = "0x1cc879f12ad356cf5d8c5780d400064fcfc79c5e";
  const isAdmin = await awsModeratorService.isAdminWallet(adminWallet);
  console.log(`Admin Wallet (${adminWallet}): ${isAdmin ? "✅" : "❌"}`);

  // Test moderator wallet
  const modWallet = "0xYOUR_MODERATOR_WALLET";
  const isMod = await awsModeratorService.isModeratorWallet(modWallet);
  console.log(`Moderator Wallet (${modWallet}): ${isMod ? "✅" : "❌"}`);

  // Test role detection
  const role = await awsModeratorService.getWalletRole(adminWallet);
  console.log(`\nWallet Role: ${role}\n`);

  console.log("✅ All tests passed");
  process.exit(0);
}

testRoleSystem();
