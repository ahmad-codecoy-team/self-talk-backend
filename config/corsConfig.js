// CORS Configuration for Development
// This file centralizes all allowed origins for easier maintenance

const getDevelopmentOrigins = () => {
  const baseOrigins = [
    // Main development URL from environment
    process.env.CLIENT_URL,

    // Common React/Next.js development ports
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",

    // Vite development ports (most common for modern React/Vue)
    "http://localhost:5173",
    "http://localhost:5174",

    // Vue CLI development ports
    "http://localhost:8080",
    "http://localhost:8081",

    // Angular CLI development port
    "http://localhost:4200",

    // Other common development ports
    "http://localhost:9000",   // Alternative dev server
    "http://localhost:1234",   // Parcel bundler
    "http://localhost:8000",   // Alternative port
    "http://localhost:8888",   // Jupyter/alternative
    "http://localhost:3333",   // Alternative port

    // Development servers on 127.0.0.1
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:4200",
    "http://127.0.0.1:8000",

    // HTTPS variants for testing
    "https://localhost:3000",
    "https://localhost:5173",
    "https://localhost:8080",
  ];

  // Add local network IPs for mobile testing
  const localNetworkIPs = [
    "192.168.1.100",
    "192.168.1.101",
    "192.168.0.100",
    "192.168.0.101",
    "10.0.0.100",
    "10.0.0.101",
  ];

  const commonPorts = [3000, 3001, 3002, 5173, 5174, 8080, 4200];

  localNetworkIPs.forEach(ip => {
    commonPorts.forEach(port => {
      baseOrigins.push(`http://${ip}:${port}`);
    });
  });

  // Filter out undefined values and duplicates
  return [...new Set(baseOrigins.filter(Boolean))];
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getDevelopmentOrigins();

    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log blocked origins for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🚫 CORS blocked origin: ${origin}`);
        console.log(`📝 Add this origin to corsConfig.js if needed`);
        console.log(`📝 Current allowed origins count: ${allowedOrigins.length}`);

        // Show first few allowed origins for reference
        console.log(`📝 Sample allowed origins:`, allowedOrigins.slice(0, 5));
      }

      const error = new Error(`CORS policy: Origin ${origin} is not allowed`);
      error.status = 403;
      callback(error);
    }
  },
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