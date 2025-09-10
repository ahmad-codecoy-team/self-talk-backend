// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");

// const { connectDB } = require("./config/db");
// const { errorHandler } = require("./middlewares/errorMiddleware");
// const authRoutes = require("./routes/authRoutes");

// const app = express();

// // middleware
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: false, // we are not using cookies now
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Authorization"],
//   })
// );
// app.use(express.json());

// // routes
// app.use("/api/auth", authRoutes);

// // error handler (last)
// app.use(errorHandler);

// // db + start
// const PORT = process.env.PORT || 5000;
// connectDB().then(() => {
//   app.listen(PORT, () => console.log(`API running on :${PORT}`));
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
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

// error handler (last)
app.use(errorHandler);

// db + start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
});
