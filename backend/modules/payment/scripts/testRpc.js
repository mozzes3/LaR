// backend/testRpc.js
const { ethers } = require("ethers");

async function testRpc() {
  const urls = [
    "https://eth-sepolia.g.alchemy.com/v2/lkDjfzyweZencyStM6rQ_", // Your URL
    "https://sepolia.drpc.org", // Public RPC 1
    "https://rpc.sepolia.org", // Public RPC 2
    "https://ethereum-sepolia-rpc.publicnode.com", // Public RPC 3
  ];

  for (const url of urls) {
    try {
      console.log(`\nTesting: ${url.substring(0, 50)}...`);
      const provider = new ethers.JsonRpcProvider(url);
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Works! Block: ${blockNumber}`);
      return url; // Return first working URL
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

testRpc().then((workingUrl) => {
  if (workingUrl) {
    console.log(`\n✅ Use this RPC: ${workingUrl}`);
  }
});
