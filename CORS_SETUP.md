# CORS Configuration Guide

## Overview
The CORS (Cross-Origin Resource Sharing) configuration has been updated to support comprehensive development scenarios while maintaining security.

## Current Configuration

### ✅ Supported Origins (66 total)

#### Localhost Ports
- `http://localhost:3000` - React/Next.js default
- `http://localhost:3001` - Alternative React port
- `http://localhost:3002` - User requested port
- `http://localhost:5173` - Vite default (from CLIENT_URL)
- `http://localhost:5174` - Alternative Vite port
- `http://localhost:8080` - Vue CLI default
- `http://localhost:8081` - Alternative Vue port
- `http://localhost:4200` - Angular CLI default
- `http://localhost:9000` - Alternative dev server
- `http://localhost:1234` - Parcel bundler
- `http://localhost:8000` - Alternative port
- `http://localhost:8888` - Jupyter/alternative
- `http://localhost:3333` - Alternative port

#### 127.0.0.1 Variants
All major ports are also supported on `127.0.0.1` for different development scenarios.

#### HTTPS Support
- `https://localhost:3000`
- `https://localhost:5173`
- `https://localhost:8080`

#### Local Network Development
Support for mobile testing and local network access:
- `192.168.1.x` networks
- `192.168.0.x` networks
- `10.0.0.x` networks

## Files Modified

### 1. `server.js`
- Imported centralized CORS configuration
- Simplified CORS middleware setup
- Added better error handling

### 2. `config/corsConfig.js` (NEW)
- Centralized CORS configuration
- Dynamic origin generation
- Development-focused debugging
- Easy maintenance and extension

### 3. `test/cors-test.js` (NEW)
- Comprehensive CORS testing script
- Validates all allowed origins
- Tests specific requested ports

## Usage

### Testing CORS Configuration
```bash
cd backend
node test/cors-test.js
```

### Adding New Origins
Edit `config/corsConfig.js` and add your origins to the appropriate array:

```javascript
const baseOrigins = [
  // Add your new origin here
  "http://localhost:YOUR_PORT",
  // ... existing origins
];
```

### Environment Variable
The `CLIENT_URL` environment variable is still respected and automatically included:
```env
CLIENT_URL=http://localhost:5173
```

## Security Features

### Development vs Production
- **Development**: Comprehensive logging of blocked origins
- **Production**: Silent blocking with minimal logs
- **Origin validation**: Strict whitelist approach

### What's Blocked
- Requests from non-whitelisted origins
- External domains (unless explicitly added)
- Invalid/malformed origins

### What's Allowed
- All configured localhost ports
- Requests with no origin (mobile apps, Postman, curl)
- Local network IPs for mobile testing

## Debugging CORS Issues

### 1. Check Server Logs
When a request is blocked, you'll see:
```
🚫 CORS blocked origin: http://localhost:XXXX
📝 Add this origin to corsConfig.js if needed
```

### 2. Run Test Script
```bash
node test/cors-test.js
```

### 3. Check Environment Variables
Ensure `CLIENT_URL` is set correctly:
```bash
echo $CLIENT_URL  # or check .env file
```

### 4. Verify Origin Header
Check that your frontend is sending the correct origin header.

## Common Issues & Solutions

### Issue: Frontend can't connect
**Solution**: Check if your frontend port is in the allowed origins list

### Issue: Mobile app can't connect
**Solution**: Add your local network IP to the `localNetworkIPs` array in `corsConfig.js`

### Issue: HTTPS testing fails
**Solution**: HTTPS variants for common ports are included, add more if needed

### Issue: New framework port not working
**Solution**: Add the new port to `baseOrigins` in `corsConfig.js`

## Production Considerations

For production deployment:
1. Replace the comprehensive localhost list with your actual production domains
2. Remove development-specific IPs and ports
3. Set `NODE_ENV=production` to reduce debug logging
4. Consider using environment variables for production origins

Example production configuration:
```javascript
const productionOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://app.yourdomain.com'
];
```

## Benefits of This Setup

✅ **Comprehensive Development Support** - Covers all major frontend frameworks and ports
✅ **Mobile Testing Ready** - Local network support for mobile development
✅ **Easy Maintenance** - Centralized configuration
✅ **Debug Friendly** - Clear logging and test utilities
✅ **Future Proof** - Easy to extend for new requirements
✅ **Secure** - Whitelist approach with proper validation

## Quick Reference

| Framework | Default Port | Status |
|-----------|-------------|---------|
| React (CRA) | 3000 | ✅ Supported |
| Vite | 5173 | ✅ Supported |
| Vue CLI | 8080 | ✅ Supported |
| Angular CLI | 4200 | ✅ Supported |
| Next.js | 3000 | ✅ Supported |
| Parcel | 1234 | ✅ Supported |

Need a new port? Add it to `config/corsConfig.js` and restart the server!