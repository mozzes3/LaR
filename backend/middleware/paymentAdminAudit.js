const auditLog = async (req, res, next) => {
  const originalSend = res.json;

  res.json = function (data) {
    console.log("🔒 PAYMENT ADMIN AUDIT LOG:");
    console.log({
      timestamp: new Date().toISOString(),
      wallet: req.user?.walletAddress,
      userId: req.userId,
      method: req.method,
      path: req.path,
      body: req.method !== "GET" ? req.body : undefined,
      params: req.params,
      success: res.statusCode < 400,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return originalSend.call(this, data);
  };

  next();
};

module.exports = { auditLog };
