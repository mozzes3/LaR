const AdminAuditLog = require("../models/AdminAuditLog");

const auditAdminAction = (action, targetType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId =
          req.params.userId ||
          req.params.courseId ||
          req.params.roleId ||
          req.params.escrowId ||
          req.params.tokenId ||
          req.params.applicationId ||
          data.data?._id ||
          data.user?._id ||
          data.role?._id ||
          data.course?._id ||
          "N/A";

        AdminAuditLog.create({
          admin: req.userId,
          action: action,
          targetType: targetType,
          targetId: targetId,
          details: {
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body),
            params: req.params,
            query: req.query,
            userRole: req.userRole || "unknown",
            walletAddress: req.user?.walletAddress,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userRole: req.userRole,
        }).catch((err) => {
          console.error("❌ Admin audit log failed:", err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

function sanitizeBody(body) {
  const sanitized = { ...body };
  // Remove sensitive data
  delete sanitized.signature;
  delete sanitized.password;
  delete sanitized.privateKey;
  return sanitized;
}

module.exports = { auditAdminAction };
