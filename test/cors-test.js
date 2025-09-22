// Simple CORS test script
// Run this with: node test/cors-test.js

const { getDevelopmentOrigins } = require('../config/corsConfig');

console.log('🔍 CORS Configuration Test\n');

// Test 1: Check all allowed origins
const allowedOrigins = getDevelopmentOrigins();
console.log(`✅ Total allowed origins: ${allowedOrigins.length}\n`);

console.log('📝 Allowed Origins:');
console.log('==================');
allowedOrigins.forEach((origin, index) => {
  console.log(`${(index + 1).toString().padStart(2)}: ${origin}`);
});

console.log('\n🧪 Testing specific requested ports:');
console.log('====================================');

const requestedPorts = [3000, 3001, 3002, 5173];
requestedPorts.forEach(port => {
  const origin = `http://localhost:${port}`;
  const isAllowed = allowedOrigins.includes(origin);
  console.log(`${isAllowed ? '✅' : '❌'} http://localhost:${port}`);
});

console.log('\n🌐 Testing 127.0.0.1 variants:');
console.log('==============================');
requestedPorts.forEach(port => {
  const origin = `http://127.0.0.1:${port}`;
  const isAllowed = allowedOrigins.includes(origin);
  console.log(`${isAllowed ? '✅' : '❌'} http://127.0.0.1:${port}`);
});

console.log('\n📱 Testing local network origins:');
console.log('==================================');
const sampleNetworkOrigins = [
  'http://192.168.1.100:3000',
  'http://192.168.1.100:5173',
  'http://192.168.0.100:3000',
  'http://10.0.0.100:3000'
];
sampleNetworkOrigins.forEach(origin => {
  const isAllowed = allowedOrigins.includes(origin);
  console.log(`${isAllowed ? '✅' : '❌'} ${origin}`);
});

console.log('\n🔒 HTTPS variants:');
console.log('==================');
const httpsVariants = [
  'https://localhost:3000',
  'https://localhost:5173',
  'https://localhost:8080'
];
httpsVariants.forEach(origin => {
  const isAllowed = allowedOrigins.includes(origin);
  console.log(`${isAllowed ? '✅' : '❌'} ${origin}`);
});

console.log('\n🚨 Testing potentially blocked origins:');
console.log('======================================');
const blockedOrigins = [
  'http://localhost:9999',
  'http://evil-site.com',
  'https://malicious.example.com'
];
blockedOrigins.forEach(origin => {
  const isAllowed = allowedOrigins.includes(origin);
  console.log(`${isAllowed ? '❌ UNEXPECTED!' : '✅'} ${origin} (should be blocked)`);
});

console.log('\n✅ CORS test completed!');
console.log('💡 If you need to add more origins, edit config/corsConfig.js');