require("dotenv").config();
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

const express = require("express");
const cors = require("cors");
const path = require("path");
const talkRoutes = require("./routes/talkRoutes");
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const app = express();

// middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: false, // not using cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use("/api/auth", authRoutes);

app.use("/api/talk", talkRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

// app.use("/self-talk-backend/api/auth", authRoutes);
// app.use("/self-talk-backend/api/talk", talkRoutes);

// error handler (last)
app.use(errorHandler);

// db + start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
});
