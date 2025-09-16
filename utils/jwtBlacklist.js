// In-memory blacklist for JWT tokens
// In production, this should be stored in Redis or a database
const blacklistedTokens = new Set();

// Add token to blacklist
const blacklistToken = (token) => {
  blacklistedTokens.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

// Clean up expired tokens (optional optimization)
const cleanupExpiredTokens = () => {
  // This would require parsing JWT to check expiration
  // For now, we'll let them accumulate (in production, use Redis with TTL)
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  cleanupExpiredTokens
};