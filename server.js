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

      // Start the timer logic
      let secondsConsumed = 0;
      const startingAvailableMinutes =
        user.current_subscription.available_minutes || 0;
      const startingExtraMinutes = user.current_subscription.extra_minutes || 0;

      const startingTotalSeconds =
        (startingAvailableMinutes + startingExtraMinutes) * 60;

      const intervalId = setInterval(async () => {
        try {
          secondsConsumed += 1;

          if (activeTimers.has(userId)) {
            activeTimers.get(userId).secondsConsumed = secondsConsumed;
          }

          const remainingSeconds = Math.max(
            0,
            startingTotalSeconds - secondsConsumed
          );

          console.log(
            `⏱ [timer] userId=${userId} | consumed=${secondsConsumed}s | remaining=${remainingSeconds}s`
          );

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

          subscription.seconds = remainingSeconds;
          await subscription.save();

          socket.emit("timer-update", { seconds: remainingSeconds });

          if (remainingSeconds === 0) {
            console.log(
              `⛔ Time up for userId=${userId}, applying final deduction`
            );

            try {
              const minutesToDeduct = secondsConsumed / 60;
              let remainingToDeduct = minutesToDeduct;

              if (subscription.available_minutes >= remainingToDeduct) {
                subscription.available_minutes -= remainingToDeduct;
              } else {
                remainingToDeduct -= subscription.available_minutes;
                subscription.available_minutes = 0;
                subscription.extra_minutes = Math.max(
                  0,
                  subscription.extra_minutes - remainingToDeduct
                );
              }

              // total_minutes should remain unchanged as it represents purchased amount
              // Only update seconds field to reflect remaining time
              subscription.seconds =
                (subscription.available_minutes + subscription.extra_minutes) *
                60;

              await subscription.save();

              console.log(
                `💰 Final deduction applied for userId=${userId} | minutesDeducted=${minutesToDeduct}`
              );
            } catch (deductError) {
              console.error("❌ Error applying final deduction:", deductError);
            }

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
        secondsConsumed: 0,
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
        const { intervalId, secondsConsumed } = activeTimers.get(userId);

        console.log(
          `⛔ Ending call manually | userId=${userId} | secondsConsumed=${secondsConsumed}`
        );

        clearInterval(intervalId);

        try {
          const user = await User.findById(userId).populate(
            "current_subscription"
          );
          if (user && user.current_subscription && secondsConsumed > 0) {
            const subscription = user.current_subscription;
            const minutesToDeduct = secondsConsumed / 60;
            let remainingToDeduct = minutesToDeduct;

            if (subscription.available_minutes >= remainingToDeduct) {
              subscription.available_minutes -= remainingToDeduct;
            } else {
              remainingToDeduct -= subscription.available_minutes;
              subscription.available_minutes = 0;
              subscription.extra_minutes = Math.max(
                0,
                subscription.extra_minutes - remainingToDeduct
              );
            }

            // total_minutes should remain unchanged as it represents purchased amount
            // Only update seconds field to reflect remaining time
            subscription.seconds =
              (subscription.available_minutes + subscription.extra_minutes) *
              60;
            await subscription.save();

            console.log(
              `💰 Manual end deduction applied | userId=${userId} | minutesDeducted=${minutesToDeduct}`
            );
          }
        } catch (deductError) {
          console.error(
            "❌ Error applying deduction on manual end:",
            deductError
          );
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
      const { intervalId, secondsConsumed } = activeTimers.get(userId);
      clearInterval(intervalId);

      console.log(
        `⛔ Disconnect triggered deduction | userId=${userId} | secondsConsumed=${secondsConsumed}`
      );

      try {
        const user = await User.findById(userId).populate(
          "current_subscription"
        );

        if (user && user.current_subscription && secondsConsumed > 0) {
          const subscription = user.current_subscription;
          const minutesToDeduct = secondsConsumed / 60;
          let remainingToDeduct = minutesToDeduct;

          if (subscription.available_minutes >= remainingToDeduct) {
            subscription.available_minutes -= remainingToDeduct;
          } else {
            remainingToDeduct -= subscription.available_minutes;
            subscription.available_minutes = 0;
            subscription.extra_minutes = Math.max(
              0,
              subscription.extra_minutes - remainingToDeduct
            );
          }

          // total_minutes should remain unchanged as it represents purchased amount
          // Only update seconds field to reflect remaining time
          subscription.seconds =
            (subscription.available_minutes + subscription.extra_minutes) * 60;

          await subscription.save();

          console.log(
            `💰 Disconnect deduction applied | userId=${userId} | minutesDeducted=${minutesToDeduct}`
          );
        }
      } catch (deductError) {
        console.error(
          "❌ Error applying deduction on disconnect:",
          deductError
        );
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
