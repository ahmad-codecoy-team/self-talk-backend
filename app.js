// app.js
// For deployment purpose only
const express = require("express");
const cors = require("cors");

const talkRoutes = require("./routes/talkRoutes"); // ✅ camelCase as you prefer
// If you have auth routes, add them the same way:
// const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(cors()); // Mobile apps don't need CORS, but keeping it is fine (also for Postman/browser tests)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    code: 200,
    message: "OK",
    data: { ts: Date.now() },
  });
});

// Routes
// app.use('/api/auth', authRoutes);
app.use("/api/talk", talkRoutes);

module.exports = app;
