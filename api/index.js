// api/index.js (Vercel serverless entry)
const serverless = require("serverless-http");
const app = require("../app");
const { connectDB } = require("../utils/db");

// Create the serverless handler once:
const handler = serverless(app);

// Vercel Node Function signature
module.exports = async (req, res) => {
  // Ensure Mongo is connected (cached across warm invocations)
  await connectDB();
  return handler(req, res);
};
