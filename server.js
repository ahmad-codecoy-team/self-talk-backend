require("dotenv").config();
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const { corsOptions } = require("./config/corsConfig");
const fs = require("fs");

const express = require("express");
const cors = require("cors");
const path = require("path");
const talkRoutes = require("./routes/talkRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customSupportRoutes = require("./routes/customSupportRoutes");
const promptRoutes = require("./routes/promptRoutes");

const app = express();

// Process error handling for production
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Request timeout middleware (prevent hanging requests in production)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      statusCode: 408,
      message: "Request timeout"
    });
  });
  next();
});

// CORS middleware - configured for development with comprehensive port coverage
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
const profilePicsDir = path.join(uploadsDir, "profile_pics");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}

// Serve static files (profile pictures)
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/talk", talkRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", customSupportRoutes);
app.use("/api/prompt", promptRoutes);

// Catch-all route for 404s
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`
  });
});

// error handler (last)
app.use(errorHandler);

// db + start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API running on :${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Process ID: ${process.pid}`);
    });

    // Server error handling
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
