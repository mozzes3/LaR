require("dotenv").config();
const bunnyService = require("../../services/bunnyService");

async function test() {
  try {
    console.log("🧪 Testing Bunny.net configuration...\n");

    // Test 1: Check config
    console.log("✅ Configuration loaded:");
    console.log("- Avatars CDN:", bunnyService.cdnUrls.avatars);
    console.log("- Videos CDN:", bunnyService.cdnUrls.videos);
    console.log("- Video Library ID:", bunnyService.videoLibraryId);

    // Test 2: Generate signed URL
    console.log("\n🔐 Testing signed URL generation:");
    const signedUrl = bunnyService.generateSignedUrl(
      "videos",
      "test-video.mp4"
    );
    console.log("Signed URL:", signedUrl);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

test();
