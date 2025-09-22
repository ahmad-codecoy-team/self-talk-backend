// Test CORS with external/live URLs
const http = require('http');

const testCorsOrigin = (origin) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Testing origin: ${origin}`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`CORS Headers:`, {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
      });
      console.log('---');

      resolve({
        origin,
        statusCode: res.statusCode,
        corsAllowed: res.headers['access-control-allow-origin'] === origin
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  });
};

async function runTests() {
  console.log('🧪 Testing CORS with various origins...\n');

  const testOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-live-app.vercel.app',
    'https://your-live-app.netlify.app',
    'https://example.com',
    'https://myapp.domain.com'
  ];

  for (const origin of testOrigins) {
    try {
      await testCorsOrigin(origin);
    } catch (error) {
      console.error(`Error testing ${origin}:`, error.message);
    }
  }

  console.log('✅ CORS test completed!');
  console.log('💡 All external origins should now be allowed in development mode');
}

runTests();