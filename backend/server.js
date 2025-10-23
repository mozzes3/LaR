require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const redis = require("redis");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const uploadRoutes = require("./routes/upload");
const certificateRoutes = require("./routes/certificateRoutes");
const levelRoutes = require("./routes/levels");
const categoryRoutes = require("./routes/categories");
const { sanitizeInput } = require("./middleware/sanitize");
const nftRoutes = require("./routes/nft");

// NEW imports
const paymentRoutes = require("./modules/payment/routes");
const adminPaymentRoutes = require("./modules/payment/routes/admin");
// Payment automation
const {
  getEscrowAutomationService,
} = require("./modules/payment/services/automationService");

// ... in your server startup
const automationService = getEscrowAutomationService();
automationService.start();

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Vite needs unsafe-inline in dev
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.anthropic.com"], // If using Claude API
      },
    },
  })
);
// Connect to MongoDB
connectDB();
app.use(sanitizeInput);
// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); //
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/instructor", require("./routes/instructor"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/enrollments", require("./routes/enrollments")); // ← ADD THIS
app.use("/api/questions", require("./routes/questions"));
app.use("/api/certificates", certificateRoutes);
app.use("/api/notes", require("./routes/Notes"));
app.use("/api/levels", levelRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", require("./routes/admin"));
app.use("/api/nft", nftRoutes);
app.use(
  "/api/professional-certifications",
  require("./routes/professionalCertifications")
);
app.use(
  "/api/admin/professional-certifications",
  require("./routes/adminProfessionalCertifications")
);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await mongoose.connection.close();
  process.exit(0);
});
