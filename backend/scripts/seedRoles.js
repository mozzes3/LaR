require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const Role = require("../models/Role");

async function seedRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🌱 Seeding roles...\n");

    const roles = [
      {
        name: "admin",
        displayName: "Administrator",
        description: "Full access to all features except SuperAdmin functions",
        permissions: [
          {
            resource: "users",
            actions: ["create", "read", "update", "delete"],
          },
          {
            resource: "courses",
            actions: [
              "create",
              "read",
              "update",
              "delete",
              "approve",
              "publish",
            ],
          },
          {
            resource: "roles",
            actions: ["create", "read", "update", "delete"],
          },
          {
            resource: "certifications",
            actions: ["create", "read", "update", "delete", "approve"],
          },
          { resource: "reviews", actions: ["read", "update", "delete"] },
          { resource: "payments", actions: ["read", "update"] },
        ],
        isSystemRole: true,
        isActive: true,
        priority: 90,
      },
      {
        name: "moderator",
        displayName: "Moderator",
        description:
          "Can manage content and users but cannot change system settings",
        permissions: [
          { resource: "users", actions: ["read", "update"] },
          { resource: "courses", actions: ["read", "update", "approve"] },
          { resource: "reviews", actions: ["read", "update", "delete"] },
          { resource: "certifications", actions: ["read", "approve"] },
        ],
        isSystemRole: true,
        isActive: true,
        priority: 50,
      },
      {
        name: "moderator-applications",
        displayName: "Application Moderator",
        description: "Can only review and approve instructor applications",
        permissions: [
          { resource: "users", actions: ["read"] },
          { resource: "applications", actions: ["read", "approve"] },
        ],
        isSystemRole: false,
        isActive: true,
        priority: 30,
      },
    ];

    for (const roleData of roles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        console.log(`⚠️  Role "${roleData.name}" already exists, skipping...`);
        continue;
      }

      await Role.create(roleData);
      console.log(`✅ Created role: ${roleData.displayName}`);
    }

    console.log("\n✅ Roles seeded successfully");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seedRoles();
