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
        sections: [
          {
            title: "Getting Started with NFT Marketing",
            description: "Introduction to NFT marketing fundamentals",
            order: 1,
            lessons: [
              {
                title: "Welcome to the Course",
                description: "Course overview and what you'll learn",
                videoId: "intro-video-1",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 330, // 5:30 in seconds
                order: 1,
                isPreview: true,
              },
              {
                title: "Understanding NFT Communities",
                description: "Deep dive into NFT community dynamics",
                videoId: "lesson-video-2",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 765, // 12:45
                order: 2,
                isPreview: true,
              },
              {
                title: "Setting Up Your Discord Server",
                description: "Step-by-step Discord server setup",
                videoId: "lesson-video-3",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 1100, // 18:20
                order: 3,
                isPreview: false,
              },
            ],
          },
          {
            title: "Marketing Strategies",
            description: "Advanced marketing techniques for Web3",
            order: 2,
            lessons: [
              {
                title: "Content Strategy for Web3",
                description: "Creating engaging Web3 content",
                videoId: "lesson-video-4",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 1515, // 25:15
                order: 1,
                isPreview: false,
              },
              {
                title: "Twitter Marketing Tactics",
                description: "Leveraging Twitter for NFT growth",
                videoId: "lesson-video-5",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 1845, // 30:45
                order: 2,
                isPreview: false,
              },
            ],
          },
        ],
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
        sections: [
          {
            title: "Solidity Fundamentals",
            description: "Learn the basics of Solidity programming",
            order: 1,
            lessons: [
              {
                title: "Introduction to Solidity",
                description: "Getting started with Solidity",
                videoId: "solidity-intro",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 900, // 15:00
                order: 1,
                isPreview: true,
              },
              {
                title: "Variables and Data Types",
                description: "Understanding Solidity data types",
                videoId: "solidity-types",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 1200, // 20:00
                order: 2,
                isPreview: false,
              },
            ],
          },
        ],
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
        sections: [
          {
            title: "Web3 Basics",
            description: "Introduction to Web3 development",
            order: 1,
            lessons: [
              {
                title: "What is Web3?",
                description: "Understanding Web3 fundamentals",
                videoId: "web3-intro",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: 600, // 10:00
                order: 1,
                isPreview: true,
              },
            ],
          },
        ],
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
