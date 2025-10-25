/**
 * Check if user has specific permission
 * @param {Object} user - Current user object
 * @param {String} resource - Resource name (e.g., "users", "courses")
 * @param {String} action - Action name (e.g., "create", "read", "update", "delete")
 * @returns {Boolean}
 */
export const hasPermission = (user, resource, action) => {
  if (!user) return false;

  // SuperAdmin has all permissions
  if (user.isSuperAdmin) return true;

  // ✅ CHECK DENIED PERMISSIONS FIRST - This overrides everything
  if (user.customPermissions?.deniedPermissions) {
    const isDenied = user.customPermissions.deniedPermissions.some(
      (perm) => perm.resource === resource && perm.actions.includes(action)
    );
    if (isDenied) return false;
  }

  // Check custom permissions (granted)
  if (user.customPermissions?.customPermissions) {
    const hasCustomPermission = user.customPermissions.customPermissions.some(
      (perm) =>
        perm.resource === resource &&
        perm.actions.includes(action) &&
        perm.granted
    );
    if (hasCustomPermission) return true;
  }

  // Check role permissions
  if (user.roleRef?.permissions) {
    const hasRolePermission = user.roleRef.permissions.some(
      (perm) => perm.resource === resource && perm.actions.includes(action)
    );
    if (hasRolePermission) return true;
  }

  // Legacy admin check
  if (user.role === "admin") return true;

  return false;
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - Current user object
 * @param {Array} permissions - Array of {resource, action} objects
 * @returns {Boolean}
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(({ resource, action }) =>
    hasPermission(user, resource, action)
  );
};

/**
 * Get visible stats cards based on user permissions
 * @param {Object} user - Current user object
 * @returns {Object} - Object with visibility flags
 */
/**
 * Get visible stats cards based on user permissions
 * @param {Object} user - Current user object
 * @returns {Object} - Object with visibility flags
 */
export const getVisibleStats = (user) => {
  if (!user) return {};

  if (user.isSuperAdmin) {
    return {
      totalUsers: true,
      totalCourses: true,
      totalPurchases: true,
      totalRevenue: true,
      pendingApplications: true,
      pendingCourses: true,
      pendingReviews: true,
      flaggedReviews: true,
      totalCertifications: true,
      activeEscrows: true,
    };
  }

  return {
    totalUsers: hasPermission(user, "users", "read"),
    totalCourses: hasPermission(user, "courses", "read"),
    totalPurchases: user.isSuperAdmin, // ✅ ONLY SUPER ADMIN
    totalRevenue: user.isSuperAdmin, // ✅ ONLY SUPER ADMIN
    pendingApplications: hasPermission(user, "applications", "read"),
    pendingCourses: hasPermission(user, "courses", "approve"),
    pendingReviews: hasPermission(user, "reviews", "read"),
    flaggedReviews: hasPermission(user, "reviews", "read"),
    totalCertifications: hasPermission(user, "certifications", "read"),
    activeEscrows: user.isSuperAdmin, // ✅ ONLY SUPER ADMIN
  };
};

/**
 * Get visible quick actions based on user permissions
 * @param {Object} user - Current user object
 * @returns {Object} - Object with visibility flags
 */
export const getVisibleActions = (user) => {
  if (!user) return {};

  // SuperAdmin sees everything
  if (user.isSuperAdmin) {
    return {
      manageUsers: true,
      manageRoles: true,
      reviewApplications: true,
      manageCourses: true,
      manageReviews: true,
      manageCertifications: true,
      managePurchases: true,
      manageEscrows: true,
    };
  }

  return {
    manageUsers: hasPermission(user, "users", "read"),
    manageRoles: hasPermission(user, "roles", "read"),
    reviewApplications: hasPermission(user, "applications", "read"),
    manageCourses: hasPermission(user, "courses", "read"),
    manageReviews: hasPermission(user, "reviews", "read"), // ✅ reviews:read
    manageCertifications: hasPermission(user, "certifications", "read"),
    managePurchases: hasPermission(user, "payments", "read"), // ✅ payments:read
    manageEscrows: hasPermission(user, "payments", "read"), // ✅ payments:read
  };
};
