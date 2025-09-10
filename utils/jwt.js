const jwt = require("jsonwebtoken");

// 30 days by default to match your controller
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || "30d";
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

module.exports = { signAccessToken, verifyAccessToken };
