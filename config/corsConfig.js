// CORS Configuration - ALLOWS ALL ORIGINS
// This prevents any CORS issues in development and production

// ⚠️  SECURITY NOTE: This configuration allows ALL origins for maximum compatibility
// If you need to restrict origins for security, modify the 'origin' setting below

const getDevelopmentOrigins = () => {
  // This function is kept for reference but not used in current configuration
  // We're now allowing ALL origins to prevent CORS issues permanently
  return [];
};

const corsOptions = {
  // ALLOW ALL ORIGINS - Permanent solution to prevent CORS issues
  origin: true,
  credentials: false, // We're not using cookies for authentication
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Authorization"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

module.exports = {
  corsOptions,
  getDevelopmentOrigins,
};