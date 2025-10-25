const AdminAuditLog = require("../models/AdminAuditLog");

/**
 * Audit log middleware for payment admin actions
 */
const auditLog = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.userId) {
      const action = determineAction(req);

      if (action) {
        AdminAuditLog.create({
          admin: req.userId,
          action: action,
          targetType: determineTargetType(req),
          targetId: determineTargetId(req, data),
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
          console.error("❌ Payment audit log failed:", err);
        });
      }
    }

    return originalJson(data);
  };

  next();
};

function determineAction(req) {
  const path = req.path.toLowerCase();
  const method = req.method;

  if (path.includes("/escrows") && path.includes("/release"))
    return "manual_escrow_release";
  if (path.includes("/escrows") && path.includes("/refund"))
    return "manual_escrow_refund";
  if (path.includes("/grant")) return "grant_free_course_access";
  if (path.includes("/access") && method === "DELETE")
    return "remove_course_access";
  if (path.includes("/tokens") && method === "POST")
    return "create_payment_token";
  if (path.includes("/tokens") && method === "PUT")
    return "update_payment_token";
  if (path.includes("/tokens") && method === "DELETE")
    return "delete_payment_token";
  if (path.includes("/settings") && method === "PUT")
    return "update_platform_settings";
  if (path.includes("/instructor-fees") && method === "PUT")
    return "update_instructor_fees";

  return null;
}

function determineTargetType(req) {
  const path = req.path.toLowerCase();

  if (path.includes("/escrows")) return "Purchase";
  if (path.includes("/users")) return "User";
  if (path.includes("/courses")) return "Course";
  if (path.includes("/tokens")) return "PaymentToken";
  if (path.includes("/settings")) return "PlatformSettings";

  return "Unknown";
}

function determineTargetId(req, data) {
  return (
    req.params.escrowId ||
    req.params.userId ||
    req.params.courseId ||
    req.params.tokenId ||
    data.data?._id ||
    data.token?._id ||
    data.settings?._id ||
    "N/A"
  );
}

function sanitizeBody(body) {
  const sanitized = { ...body };
  delete sanitized.signature;
  delete sanitized.privateKey;
  delete sanitized.password;
  return sanitized;
}

module.exports = { auditLog };
