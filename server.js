require("dotenv").config();
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

const express = require("express");
const cors = require("cors");
const talkRoutes = require("./routes/talkRoutes");
const authRoutes = require("./routes/authRoutes");

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

// routes
app.use("/api/auth", authRoutes);

app.use("/api/talk", talkRoutes);

// error handler (last)
app.use(errorHandler);

// db + start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
});

// server.js
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");

// const { connectDB } = require("./config/db");
// const { errorHandler } = require("./middlewares/errorMiddleware");

// const talkRoutes = require("./routes/talkRoutes");
// const authRoutes = require("./routes/authRoutes");

// const app = express();

// // middleware
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL, // fine for mobile/Postman; browsers must match
//     credentials: false, // not using cookies
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Authorization"],
//   })
// );
// app.use(express.json());

// // routes
// app.use("/api/auth", authRoutes);
// app.use("/api/talk", talkRoutes);

// // health (handy for Vercel & Postman)
// app.get("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     code: 200,
//     message: "OK",
//     data: { ts: Date.now() },
//   });
// });

// // error handler (last)
// app.use(errorHandler);

// // --- local dev only ---
// const PORT = process.env.PORT || 5000;
// if (require.main === module) {
//   connectDB()
//     .then(() => {
//       app.listen(PORT, () => console.log(`✅ API running on :${PORT}`));
//     })
//     .catch((err) => {
//       console.error("❌ DB connection failed:", err);
//       process.exit(1);
//     });
// }

// // export for Vercel serverless
// module.exports = app;
