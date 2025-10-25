const { ethers } = require("ethers");

async function getCodeHash() {
  const contractAddress = "0x206b33C964E95D987cFc45613FCE20fE14844E17"; // Replace
  const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia-rpc.publicnode.com"
  );

  const code = await provider.getCode(contractAddress);
  const codeHash = ethers.keccak256(code);

  console.log("Contract Address:", contractAddress);
  console.log("Code Hash:", codeHash);
}

getCodeHash().catch(console.error);
