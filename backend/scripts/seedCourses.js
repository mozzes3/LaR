require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedCourses = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding database...");

    // Create a test instructor user
    let instructor = await User.findOne({ username: "CryptoMaverick" });

    if (!instructor) {
      instructor = await User.create({
        walletAddress: "0x1234567890123456789012345678901234567890",
        username: "CryptoMaverick",
        isInstructor: true,
        instructorVerified: true,
        bio: "NFT Marketing Expert & Community Builder",
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      });
      console.log("✅ Instructor created");
    }

    // Clear existing courses
    await Course.deleteMany({});
    console.log("🗑️  Cleared existing courses");

    // Sample courses
    const sampleCourses = [
      {
        title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
        slug: "nft-marketing-masterclass",
        subtitle:
          "Learn proven strategies to grow your NFT community from zero",
        description:
          "Master the art of building thriving Web3 communities. This comprehensive course covers everything from Discord setup to advanced growth strategies used by successful NFT projects.",
        instructor: instructor._id,
        thumbnail:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop",
        price: { usd: 299, fdr: 299 },
        category: "Marketing",
        level: "Intermediate",
        status: "published",
        requirements: ["Basic understanding of Discord", "NFT project or idea"],
        whatYouWillLearn: [
          "Discord server setup and optimization",
          "Community engagement strategies",
          "Marketing funnel creation",
          "Influencer partnership strategies",
        ],
        targetAudience: [
          "NFT project founders",
          "Community managers",
          "Marketing professionals",
        ],
        tags: ["NFT", "Discord", "Marketing", "Community"],
        publishedAt: new Date(),
      },
      {
        title: "Solidity Smart Contracts: Build Your First DeFi Protocol",
        slug: "solidity-smart-contracts",
        subtitle: "Master Solidity and build real-world DeFi applications",
        description:
          "Learn to write secure and efficient smart contracts. Build a complete DeFi protocol from scratch with best practices and security patterns.",
        instructor: instructor._id,
        thumbnail:
          "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop",
        price: { usd: 399, fdr: 399 },
        category: "Smart Contracts",
        level: "Advanced",
        status: "published",
        requirements: [
          "Basic programming knowledge",
          "Understanding of blockchain",
        ],
        whatYouWillLearn: [
          "Solidity fundamentals",
          "Smart contract development",
          "DeFi protocol architecture",
          "Security best practices",
        ],
        targetAudience: ["Developers", "Blockchain engineers"],
        tags: ["Solidity", "Smart Contracts", "DeFi", "Development"],
        publishedAt: new Date(),
      },
      {
        title: "Web3 Full Stack Development: Build dApps from Scratch",
        slug: "web3-full-stack",
        subtitle: "Complete guide to building decentralized applications",
        description:
          "Build production-ready decentralized applications. Learn React, ethers.js, smart contract integration, and deployment.",
        instructor: instructor._id,
        thumbnail:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
        price: { usd: 449, fdr: 449 },
        category: "Web3 Development",
        level: "Advanced",
        status: "published",
        requirements: [
          "JavaScript knowledge",
          "React experience",
          "Basic blockchain understanding",
        ],
        whatYouWillLearn: [
          "React + Web3 integration",
          "Smart contract interaction",
          "Full dApp deployment",
          "Testing and debugging",
        ],
        targetAudience: ["Web developers", "Full-stack developers"],
        tags: ["React", "Web3", "dApp", "Development"],
        publishedAt: new Date(),
      },
    ];

    const courses = await Course.insertMany(sampleCourses);
    console.log(`✅ ${courses.length} courses created`);

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedCourses();
