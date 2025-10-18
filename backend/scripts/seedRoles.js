const Role = require("../models/Role");

const defaultRoles = [
  {
    name: "master_admin",
    displayName: "Master Admin",
    description: "Full system access with all permissions",
    permissions: [
      { resource: "users", actions: ["create", "read", "update", "delete"] },
      { resource: "roles", actions: ["create", "read", "update", "delete"] },
      {
        resource: "courses",
        actions: ["create", "read", "update", "delete", "approve", "publish"],
      },
      { resource: "reviews", actions: ["create", "read", "update", "delete"] },
      { resource: "applications", actions: ["read", "approve", "delete"] },
      {
        resource: "categories",
        actions: ["create", "read", "update", "delete"],
      },
      { resource: "payments", actions: ["read", "update"] },
      { resource: "analytics", actions: ["read"] },
    ],
    isSystemRole: true,
    priority: 100,
  },
  {
    name: "team_lead",
    displayName: "Team Lead",
    description: "Manage team members and moderate content",
    permissions: [
      { resource: "users", actions: ["read", "update"] },
      { resource: "courses", actions: ["read", "update", "approve"] },
      { resource: "reviews", actions: ["read", "update", "delete"] },
      { resource: "applications", actions: ["read", "approve"] },
      { resource: "analytics", actions: ["read"] },
    ],
    isSystemRole: true,
    priority: 80,
  },
  {
    name: "team_member",
    displayName: "Team Member",
    description: "Moderate content and review applications",
    permissions: [
      { resource: "users", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "reviews", actions: ["read", "update"] },
      { resource: "applications", actions: ["read"] },
    ],
    isSystemRole: true,
    priority: 60,
  },
  {
    name: "content_moderator",
    displayName: "Content Moderator",
    description: "Review and moderate courses and reviews",
    permissions: [
      { resource: "courses", actions: ["read", "update"] },
      { resource: "reviews", actions: ["read", "update", "delete"] },
    ],
    isSystemRole: true,
    priority: 40,
  },
  {
    name: "support_agent",
    displayName: "Support Agent",
    description: "Handle user support and basic moderation",
    permissions: [
      { resource: "users", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "reviews", actions: ["read"] },
    ],
    isSystemRole: true,
    priority: 20,
  },
];

const seedRoles = async () => {
  try {
    console.log("🌱 Seeding default roles...");

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });

      if (!existingRole) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.displayName}`);
      } else {
        console.log(`⏭️  Role already exists: ${roleData.displayName}`);
      }
    }

    console.log("✨ Role seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    throw error;
  }
};

module.exports = seedRoles;
