# SelfTalk API Documentation

## Base URL
- **Local Development**: `http://localhost:5000`
- **Production**: `https://yourdomain.com`

## Response Format
All API responses now include status codes in the response body:

```json
{
  "success": true|false,
  "statusCode": 200,
  "message": "Response message",
  "data": { ... }  // Optional, only in success responses
}
```

## Authentication Endpoints (`/api/auth`)

### POST `/api/auth/register`
Register a new user account with role-based system.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + . + _)",
  "email": "string (valid email)",
  "password": "string (min 6 chars, must contain letter + number)",
  "profilePicture": "string (optional, path from upload-profile-picture)"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "total_minutes": 2,
      "available_minutes": 2,
      "current_subscription": null,
      "subscription_started_at": null,
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions",
        "createdAt": "2025-09-17T08:09:38.116Z",
        "updatedAt": "2025-09-17T08:09:38.116Z"
      },
      "createdAt": "2025-09-17T08:09:38.748Z",
      "updatedAt": "2025-09-17T08:09:38.748Z"
    }
  }
}
```

### POST `/api/auth/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions"
      }
    },
    "accessToken": "jwt_token_here"
  }
}
```

### POST `/api/auth/logout`
Logout user and blacklist token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

### POST `/api/auth/upload-profile-picture`
Upload a profile picture (public endpoint for registration).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `profilePicture` (image file)
- Supported formats: JPEG, JPG, PNG, GIF
- Max size: 10MB

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile_pics/1758089928297.jpg"
  }
}
```

### POST `/api/auth/forgot-password`
Request password reset OTP (new OTP-based flow).

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset code sent to your email",
  "data": {
    "email": "test@example.com",
    "otp": "936661",
    "expiresAt": "2025-09-17T08:20:00.757Z"
  }
}
```

### POST `/api/auth/verify-reset-otp`
Verify the OTP for password reset (deletes OTP after verification).

**Request Body:**
```json
{
  "email": "string",
  "otp": "string (6 digits)"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Code verified successfully",
  "data": {
    "email": "test@example.com",
    "verified": true,
    "message": "You can now reset your password"
  }
}
```

### POST `/api/auth/reset-password`
Reset password after OTP verification (OTP is verified and invalidated in previous step).

**Request Body:**
```json
{
  "email": "string",
  "newPassword": "string (min 6 chars, must contain letter + number)"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password updated successfully"
}
```

## User Management Endpoints (`/api/user`)

All user endpoints require authentication header:
```
Authorization: Bearer <token>
```

### GET `/api/user/profile`
Get user profile information with role and timestamps.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile fetched successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "total_minutes": 2,
      "available_minutes": 2,
      "current_subscription": null,
      "subscription_started_at": null,
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions"
      },
      "createdAt": "2025-09-17T08:09:38.748Z",
      "updatedAt": "2025-09-17T08:09:38.748Z"
    }
  }
}
```

### PUT `/api/user/profile`
Update user profile with createdAt in response.

**Request Body:**
```json
{
  "username": "string (optional)",
  "profilePicture": "string (optional, path from upload-profile-picture)",
  "voice_id": "string (optional)",
  "model_id": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "newusername",
      "email": "test@example.com",
      "profilePicture": "/uploads/profile_pics/image.jpg",
      "voice_id": "voice123",
      "model_id": "model456",
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions"
      },
      "createdAt": "2025-09-17T08:09:38.748Z",
      "updatedAt": "2025-09-17T08:15:32.123Z"
    }
  }
}
```

### PUT `/api/user/change-password`
Change user password.

**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string (min 6 chars, must contain letter + number)"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

### DELETE `/api/user/delete-account`
Delete user account and cleanup associated data including profile pictures.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Account deleted successfully"
}
```

## Static Files

### Profile Pictures
Access uploaded profile pictures directly:
```
GET /uploads/profile_pics/{filename}
```

Example: `http://localhost:5000/uploads/profile_pics/1758089928297.jpg`

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": {
    "field": "Field specific error message"
  }
}
```

### Common Error Codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email/username)
- `500` - Internal Server Error

## Password Reset Flow

The new OTP-based password reset flow (no reset tokens):

1. **Request OTP**: POST `/api/auth/forgot-password` with email
   - Returns OTP in response for frontend to store locally
2. **Verify OTP**: POST `/api/auth/verify-reset-otp` with email and OTP
   - Deletes OTP after successful verification
3. **Reset Password**: POST `/api/auth/reset-password` with email and new password
   - OTP was already verified and invalidated in previous step

The frontend should store the OTP from step 1 and use it only for step 2.

## Role System

The API now uses a role-based system instead of boolean flags:

- **User Role**: `{ name: "user", description: "Regular user with standard permissions" }`
- **Admin Role**: `{ name: "admin", description: "Administrator with full permissions" }`

New users are automatically assigned the "user" role during registration. Default roles are created automatically on first registration.

## Changes Made in This Update

### New Endpoints:
- `GET /api/user/profile` - Moved from `/api/auth/profile`
- `PUT /api/user/profile` - Moved from `/api/auth/profile`
- `PUT /api/user/change-password` - Moved from `/api/auth/change-password`
- `DELETE /api/user/delete-account` - Moved from `/api/auth/delete-account`

### Updated Authentication Flow:
- Registration now returns full user profile with role information
- Login returns role information instead of `is_admin` boolean
- All responses include `statusCode` field in response body

### Updated Password Reset:
- OTP is now returned in `/forgot-password` response for frontend storage
- No more reset tokens - direct OTP verification
- `/verify-reset-otp` deletes OTP after verification
- `/reset-password` requires only email and new password (OTP already verified)
- Enhanced validation with proper error messages

### Updated Change Password:
- Removed `confirmNewPassword` field requirement
- Frontend should handle password confirmation validation
- Simplified API to require only `oldPassword` and `newPassword`

### Database Schema Changes:
- User schema now uses Role reference instead of `is_admin` boolean
- Removed OTP fields from User schema
- OTP data stored in separate OTP collection with automatic cleanup
- Role collection with "user" and "admin" roles

### API Improvements:
- All responses now include status codes in body
- Better error handling and validation messages
- Automatic profile picture cleanup on account deletion
- Enhanced security with proper OTP verification

## Testing

Test the endpoints using the examples above. The profile picture serving is working correctly at:
- **Upload test**: `POST /api/auth/upload-profile-picture`
- **Access test**: `GET /uploads/profile_pics/{filename}`

All endpoints have been tested and are working correctly with the new role-based system and OTP flow.