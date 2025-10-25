require("dotenv").config();
const { ethers } = require("ethers");

async function checkEscrow() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL_SEPOLIA);

  const escrowABI = [
    "function getEscrow(bytes32 escrowId) view returns (tuple(address student, address instructor, uint256 amount, uint256 platformFee, uint256 releaseTime, bool released, bool refunded))",
    "function studentCourseEscrow(address student, bytes32 courseId) view returns (bytes32)",
  ];

  const escrowContract = new ethers.Contract(
    "0xcb05D123A5ad24C09273698fC16aAEF3784717cf",
    escrowABI,
    provider
  );

  // Get escrow ID
  const studentAddress = "0x91f1C7Fb8Ae71556241ED141f1797E1FDc8942a5";
  const courseId = ethers.id("68fb887a1a40cd87c3864346"); // Convert MongoDB ID to bytes32

  const escrowId = await escrowContract.studentCourseEscrow(
    studentAddress,
    courseId
  );
  console.log("Escrow ID:", escrowId);

  if (escrowId === ethers.ZeroHash) {
    console.log("❌ No escrow found");
    return;
  }

  // Get escrow details
  const escrow = await escrowContract.getEscrow(escrowId);
  console.log("\n📦 Escrow Details:");
  console.log("Student:", escrow.student);
  console.log("Instructor:", escrow.instructor);
  console.log("Amount:", ethers.formatUnits(escrow.amount, 6), "USDC");
  console.log(
    "Release time:",
    new Date(Number(escrow.releaseTime) * 1000).toISOString()
  );
  console.log("Released:", escrow.released);
  console.log("Refunded:", escrow.refunded);
}

checkEscrow();
