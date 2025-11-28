require("dotenv").config();
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const { corsOptions } = require("./config/corsConfig");
const fs = require("fs");

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const UserSubscription = require("./models/UserSubscription");
const User = require("./models/User");
const talkRoutes = require("./routes/talkRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customSupportRoutes = require("./routes/customSupportRoutes");
const promptRoutes = require("./routes/promptRoutes");

const app = express();
const server = http.createServer(app);

// origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"]

// Socket.io setup with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory timer storage
const activeTimers = new Map(); // userId -> { intervalId, socketId }

// Helper function to sync minutes fields from seconds after call ends
async function syncMinutesFromSeconds(subscription) {
  const totalSeconds = subscription.seconds || 0;
  const totalMinutes = totalSeconds / 60;
  
  // Determine how to distribute remaining time back to available_minutes and extra_minutes
  // Based on the original proportion of available vs extra minutes
  const originalAvailable = subscription.available_minutes || 0;
  const originalExtra = subscription.extra_minutes || 0;
  const originalTotal = originalAvailable + originalExtra;
  
  if (originalTotal > 0) {
    // Maintain the same proportion
    const availableRatio = originalAvailable / originalTotal;
    const extraRatio = originalExtra / originalTotal;
    
    subscription.available_minutes = totalMinutes * availableRatio;
    subscription.extra_minutes = totalMinutes * extraRatio;
  } else {
    // If no original minutes, put all remaining in available_minutes
    subscription.available_minutes = totalMinutes;
    subscription.extra_minutes = 0;
  }
  
  await subscription.save();
}

// Process error handling for production
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Request timeout middleware (prevent hanging requests in production)
app.use((req, res, next) => {
  // skip timeout for socket
  if (req.path.startsWith("/socket.io")) {
    return next();
  }

  // same old timeout for all other requests
  res.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      statusCode: 408,
      message: "Request timeout",
    });
  });

  next();
});

// CORS middleware - configured for development with comprehensive port coverage
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

////////////////////////////////////////////////////////////
// Socket.io authentication middleware
////////////////////////////////////////////////////////////
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.uid).populate(
      "current_subscription"
    );

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

////////////////////////////////////////////////////////////
// Handeling all socket events
////////////////////////////////////////////////////////////

io.on("connection", (socket) => {
  console.log(
    `\n🟢 [connection] User connected | socketId=${socket.id} | userId=${socket.userId}`
  );

  // Handle call start
  socket.on("start-call", async (data) => {
    const userId = socket.userId;
    console.log(
      `\n🟡 [start-call] Event fired | userId=${userId} | socketId=${socket.id} | data=`,
      data
    );

    try {
      // Clear any existing timer for this user
      if (activeTimers.has(userId)) {
        console.log(`⛔ Existing timer cleared for userId=${userId}`);
        clearInterval(activeTimers.get(userId).intervalId);
      }

      // Get user subscription and check available seconds
      const user = await User.findById(userId).populate("current_subscription");

      if (!user || !user.current_subscription) {
        console.log(`❌ No active subscription found for userId=${userId}`);
        socket.emit("error", { message: "No active subscription found" });
        return;
      }

      const currentSeconds = user.current_subscription.seconds || 0;

      if (currentSeconds <= 0) {
        console.log(
          `⏳ No seconds available for call | userId=${userId} | seconds=${currentSeconds}`
        );
        socket.emit("error", { message: "No seconds available for call" });
        return;
      }

      console.log(
        `▶️ Starting call timer | userId=${userId} | startingSeconds=${currentSeconds}`
      );

      // Start the clean, simple timer - seconds is our single source of truth
      const intervalId = setInterval(async () => {
        try {
          // Get fresh subscription data
          const subscription = await UserSubscription.findById(
            user.current_subscription._id
          );
          if (!subscription) {
            console.log(
              `⚠️ Subscription missing during timer update for userId=${userId}`
            );
            clearInterval(intervalId);
            activeTimers.delete(userId);
            return;
          }

          // Simple: deduct 1 second directly from database
          if (subscription.seconds > 0) {
            subscription.seconds -= 1;
            await subscription.save();

            console.log(
              `⏱ [timer] userId=${userId} | remaining=${subscription.seconds}s`
            );

            // Emit updated seconds to client
            socket.emit("timer-update", { seconds: subscription.seconds });

            // Check if time is up
            if (subscription.seconds === 0) {
              console.log(
                `⛔ Time up for userId=${userId}, syncing minutes fields`
              );

              // Update minutes fields for billing accuracy after call ends
              await syncMinutesFromSeconds(subscription);
              
              clearInterval(intervalId);
              activeTimers.delete(userId);
              socket.emit("call-ended", { reason: "time-up" });
            }
          } else {
            // Time is already up
            clearInterval(intervalId);
            activeTimers.delete(userId);
            socket.emit("call-ended", { reason: "time-up" });
          }
        } catch (error) {
          console.error("❌ Timer error:", error);
          clearInterval(intervalId);
          activeTimers.delete(userId);
          socket.emit("error", { message: "Timer error occurred" });
        }
      }, 1000);

      activeTimers.set(userId, {
        intervalId,
        socketId: socket.id,
        startTime: Date.now(),
      });

      socket.emit("call-started", {
        message: "Call timer started",
        seconds: currentSeconds,
      });

      console.log(
        `✅ Call timer started successfully | userId=${userId} | socketId=${socket.id}`
      );
    } catch (error) {
      console.error("❌ Start call error:", error);
      socket.emit("error", { message: "Failed to start call" });
    }
  });

  // Handle call end
  socket.on("end-call", async (data) => {
    const userId = socket.userId;
    console.log(`\n🔴 [end-call] Event fired | userId=${userId} | data=`, data);

    try {
      if (activeTimers.has(userId)) {
        const { intervalId } = activeTimers.get(userId);

        console.log(`⛔ Ending call manually | userId=${userId}`);
        clearInterval(intervalId);

        // Sync minutes fields for billing accuracy
        try {
          const user = await User.findById(userId).populate("current_subscription");
          if (user && user.current_subscription) {
            await syncMinutesFromSeconds(user.current_subscription);
            console.log(`💰 Manual end - minutes synced | userId=${userId}`);
          }
        } catch (syncError) {
          console.error("❌ Error syncing minutes on manual end:", syncError);
        }

        activeTimers.delete(userId);
      }

      socket.emit("call-ended", { reason: "user-ended" });
      console.log(`🔚 Call ended manually | userId=${userId}`);
    } catch (error) {
      console.error("❌ End call error:", error);
      socket.emit("error", { message: "Failed to end call" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    console.log(
      `\n❌ [disconnect] User disconnected | userId=${userId} | socketId=${socket.id}`
    );

    if (activeTimers.has(userId)) {
      const { intervalId } = activeTimers.get(userId);
      clearInterval(intervalId);

      console.log(`⛔ Disconnect triggered timer cleanup | userId=${userId}`);

      // Sync minutes fields for billing accuracy
      try {
        const user = await User.findById(userId).populate("current_subscription");
        if (user && user.current_subscription) {
          await syncMinutesFromSeconds(user.current_subscription);
          console.log(`💰 Disconnect - minutes synced | userId=${userId}`);
        }
      } catch (syncError) {
        console.error("❌ Error syncing minutes on disconnect:", syncError);
      }

      activeTimers.delete(userId);
      console.log(`🧹 Timer cleared after disconnect | userId=${userId}`);
    }
  });
});

////////////////////////////////////////////////////////////
// End of Socket Events
////////////////////////////////////////////////////////////

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
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
    message: `Route ${req.originalUrl} not found`,
  });
});

// error handler (last)
app.use(errorHandler);

// db + start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Start the HTTP server (which includes Socket.io)
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ API running on :${PORT}`);
      console.log(`✅ Socket.io enabled`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ Process ID: ${process.pid}`);
    });

    // Server error handling
    server.on("error", (error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🔄 SIGTERM received, shutting down gracefully...");
      // Clear all active timers
      activeTimers.forEach(({ intervalId }, userId) => {
        clearInterval(intervalId);
        console.log(`🔄 Cleared timer for user ${userId}`);
      });
      activeTimers.clear();

      server.close(() => {
        console.log("✅ Process terminated");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("🔄 SIGINT received, shutting down gracefully...");
      // Clear all active timers
      activeTimers.forEach(({ intervalId }, userId) => {
        clearInterval(intervalId);
        console.log(`🔄 Cleared timer for user ${userId}`);
      });
      activeTimers.clear();

      server.close(() => {
        console.log("✅ Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
