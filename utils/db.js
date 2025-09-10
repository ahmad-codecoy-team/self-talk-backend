// utils/db.js
// This file is only for deployment purpose

const mongoose = require("mongoose");

let cached = global.mongooseConn;
if (!cached) cached = global.mongooseConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set");
    cached.promise = mongoose
      .connect(uri, {
        // Optional: add dbName if your URI doesn't include it
        dbName: process.env.DB_NAME || undefined,
        // Recommended modern options (Mongoose v7+ is fine without extras)
      })
      .then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };
