const Role = require("../models/Role");
const UserPermission = require("../models/UserPermission");

/**
 * Check if user has specific permission
 */
const hasPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Super admin has all permissions
      if (user.isSuperAdmin) {
        return next();
      }

      // Check custom permissions (overrides)
      if (user.customPermissions) {
        const customPerms = await UserPermission.findById(
          user.customPermissions
        );

        if (customPerms) {
          // Check if permission is denied
          const isDenied = customPerms.deniedPermissions.some(
            (perm) =>
              perm.resource === resource && perm.actions.includes(action)
          );

          if (isDenied) {
            return res.status(403).json({
              error: "Access denied",
              message: `You do not have permission to ${action} ${resource}`,
            });
          }

          // Check if permission is explicitly granted
          const isGranted = customPerms.customPermissions.some(
            (perm) =>
              perm.resource === resource &&
              perm.actions.includes(action) &&
              perm.granted
          );

          if (isGranted) {
            return next();
          }
        }
      }

      // Check role permissions
      if (user.roleRef) {
        const role = await Role.findById(user.roleRef);

        if (role && role.isActive) {
          const hasRolePermission = role.permissions.some(
            (perm) =>
              perm.resource === resource && perm.actions.includes(action)
          );

          if (hasRolePermission) {
            return next();
          }
        }
      }

      // Legacy admin check
      if (user.role === "admin") {
        return next();
      }

      return res.status(403).json({
        error: "Access denied",
        message: `You do not have permission to ${action} ${resource}`,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 */
const hasAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (user.isSuperAdmin) {
        return next();
      }

      // Check custom permissions
      if (user.customPermissions) {
        const customPerms = await UserPermission.findById(
          user.customPermissions
        );

        if (customPerms) {
          const hasAny = permissions.some(({ resource, action }) => {
            const notDenied = !customPerms.deniedPermissions.some(
              (perm) =>
                perm.resource === resource && perm.actions.includes(action)
            );

            const isGranted = customPerms.customPermissions.some(
              (perm) =>
                perm.resource === resource &&
                perm.actions.includes(action) &&
                perm.granted
            );

            return notDenied && isGranted;
          });

          if (hasAny) {
            return next();
          }
        }
      }

      // Check role permissions
      if (user.roleRef) {
        const role = await Role.findById(user.roleRef);

        if (role && role.isActive) {
          const hasAny = permissions.some(({ resource, action }) =>
            role.permissions.some(
              (perm) =>
                perm.resource === resource && perm.actions.includes(action)
            )
          );

          if (hasAny) {
            return next();
          }
        }
      }

      if (user.role === "admin") {
        return next();
      }

      return res.status(403).json({
        error: "Access denied",
        message: "You do not have the required permissions",
      });
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

/**
 * Check if user is super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({
      error: "Access denied. Super admin privileges required.",
    });
  }
  next();
};

/**
 * Get user's all permissions
 */
const getUserPermissions = async (userId) => {
  const user = await require("../models/User")
    .findById(userId)
    .populate("roleRef")
    .populate("customPermissions");

  if (!user) {
    return { permissions: [], isSuperAdmin: false };
  }

  if (user.isSuperAdmin) {
    return { permissions: ["*"], isSuperAdmin: true };
  }

  const permissions = [];

  // Add role permissions
  if (user.roleRef && user.roleRef.isActive) {
    user.roleRef.permissions.forEach((perm) => {
      perm.actions.forEach((action) => {
        permissions.push(`${perm.resource}:${action}`);
      });
    });
  }

  // Add custom permissions
  if (user.customPermissions) {
    user.customPermissions.customPermissions.forEach((perm) => {
      if (perm.granted) {
        perm.actions.forEach((action) => {
          const permString = `${perm.resource}:${action}`;
          if (!permissions.includes(permString)) {
            permissions.push(permString);
          }
        });
      }
    });

    // Remove denied permissions
    user.customPermissions.deniedPermissions.forEach((perm) => {
      perm.actions.forEach((action) => {
        const permString = `${perm.resource}:${action}`;
        const index = permissions.indexOf(permString);
        if (index > -1) {
          permissions.splice(index, 1);
        }
      });
    });
  }

  return { permissions, isSuperAdmin: false };
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  isSuperAdmin,
  getUserPermissions,
};
