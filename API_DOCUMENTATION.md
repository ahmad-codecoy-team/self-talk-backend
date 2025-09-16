# SelfTalk API Documentation

## Overview

This document describes all the APIs for the SelfTalk application, including authentication, user management, subscription management, and conversation handling.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Admin endpoints additionally require the user to have `is_admin: true` in their profile.

### Authentication Features

- **Regular users**: Access tokens expire in 30 days
- **Admin users**: Access tokens never expire (permanent access)
- **Registration**: Only returns user data (no token)
- **Login**: Returns access token for authenticated sessions

---

## User Schema Changes

### Voice & Model IDs

- Users have single `voice_id` and `model_id` (not arrays)
- Free users can upload voice once and replace it
- Voice training uses default settings (managed by frontend)

---

## Registration Workflow (Mobile Apps)

For mobile applications, the recommended registration flow is:

1. **Upload Profile Picture** (Optional):
   - `POST /auth/upload-profile-picture-public`
   - Returns profile picture path

2. **Register User**:
   - `POST /auth/register`
   - Include profile picture path from step 1 in the JSON body
   - If no picture uploaded, leave `profilePicture` field empty or omit it

3. **Login**:
   - `POST /auth/login`
   - Get access token for authenticated requests

This workflow ensures that profile pictures are properly handled during registration without requiring authentication for the initial upload.

---

## Authentication APIs

### 1. Register User

**POST** `/auth/register`

Register a new user account. Now accepts JSON data with optional profile picture path. Does not return an access token - user must login separately.

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "testuser123",
  "email": "test@example.com",
  "password": "password123",
  "profilePicture": "/uploads/profile_pics/1758025642086.jpg"
}
```

**Validation Rules:**
- `username`: 3-30 characters, starts with letter, alphanumeric + dots/underscores only
- `email`: Valid email format
- `password`: Minimum 6 characters, must contain at least one letter and one number
- `profilePicture`: Optional, must be a valid profile picture path starting with "/uploads/profile_pics/"

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "68c95773929adb5dcd75feb9",
      "username": "testuser123",
      "email": "test@example.com",
      "profilePicture": "/uploads/profile_pics/1758025642086.jpg"
    }
  }
}
```

**Error Response Example:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "username": "Username must be between 3 and 30 characters",
    "email": "Please provide a valid email address (e.g., user@example.com)",
    "password": "Password must contain at least one letter and one number"
  }
}
```

### 2. Login User

**POST** `/auth/login`

Authenticate user and receive access token.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "is_admin": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 3. Get User Profile

**GET** `/auth/profile`

Get current user's profile information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "profilePicture": "/uploads/profile_pics/filename.jpg",
      "voice_id": "voice_123",
      "model_id": "model_456",
      "total_minutes": 52,
      "available_minutes": 45,
      "current_subscription": {...},
      "subscription_started_at": "2025-09-16T06:00:00.000Z",
      "is_admin": false,
      "createdAt": "2025-09-16T06:00:00.000Z",
      "updatedAt": "2025-09-16T06:00:00.000Z"
    }
  }
}
```

### 4. Update User Profile

**PUT** `/auth/profile`

Update user profile (username and/or profile picture). Profile picture updates now automatically delete the old picture.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**

```
username: string (optional)
profilePicture: file (optional)
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "new_username",
      "email": "john@example.com",
      "profilePicture": "/uploads/profile_pics/new_filename.jpg",
      "updatedAt": "2025-09-16T07:00:00.000Z"
    }
  }
}
```

### 5. Change Password

**PUT** `/auth/change-password`

Change user's password (requires current password).

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password",
  "confirmNewPassword": "new_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 6. Logout

**POST** `/auth/logout`

Logout user and invalidate the current access token. This endpoint requires authentication and properly invalidates the token on the server side.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Token has been invalidated"
}
```

### 7. Forgot Password

**POST** `/auth/forgot-password`

Send password reset OTP to user's email.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If that email exists, you will receive a reset code"
}
```

### 8. Verify Reset OTP

**POST** `/auth/verify-reset-otp`

Verify the OTP sent to email and get reset token.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Code verified",
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

### 9. Upload Profile Picture (Public - For Registration)

**POST** `/auth/upload-profile-picture-public`

**NEW ENDPOINT** - Upload a profile picture before registration (public endpoint). This returns a file path that can be used during registration.

**Headers:**

```
Content-Type: multipart/form-data
```

**Body (Form Data):**

```
profilePicture: file (required) - Image file (JPEG, JPG, PNG, GIF)
```

**File Constraints:**
- Maximum size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF

**Response:**

```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile_pics/1758025642086.jpg"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Profile picture upload failed",
  "errors": {
    "profilePicture": "No file was uploaded"
  }
}
```

### 10. Upload Profile Picture (Authenticated)

**POST** `/auth/upload-profile-picture`

Upload a profile picture for an existing user. Automatically updates the user's profile and deletes the old picture.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**

```
profilePicture: file (required) - Image file (JPEG, JPG, PNG, GIF)
```

**File Constraints:**
- Maximum size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF
- Automatically deletes old profile picture if exists

**Response:**

```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile_pics/1758025642086.jpg"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Profile picture upload failed",
  "errors": {
    "profilePicture": "No file was uploaded"
  }
}
```

### 11. Delete User Account

**DELETE** `/auth/delete-account`

**NEW ENDPOINT** - Delete user account and associated profile picture.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### 12. Reset Password

**POST** `/auth/reset-password`

Reset password using reset token from OTP verification.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIs...",
  "newPassword": "new_password",
  "confirmNewPassword": "new_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Subscription Management APIs

### 12. Get All Active Plans (Public)

**GET** `/subscriptions/plans`

Get all active subscription plans available for users to subscribe to.

**Headers:** None required

**Response:**

```json
{
  "success": true,
  "message": "Active subscription plans fetched successfully",
  "data": {
    "plans": [
      {
        "_id": "plan_id",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "yearly",
        "voice_minutes": 2,
        "features": [
          "2 voice minutes",
          "Basic AI companion",
          "Text conversations",
          "Standard voice quality"
        ],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false,
        "createdAt": "2025-09-16T06:00:00.000Z",
        "updatedAt": "2025-09-16T06:00:00.000Z"
      }
    ]
  }
}
```

### 13. Get User's Current Subscription

**GET** `/subscriptions/my-subscription`

Get the current user's subscription details including voice/model settings and available minutes.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "User subscription details fetched successfully",
  "data": {
    "user_subscription": {
      "voice_id": "voice_123",
      "model_id": "model_456",
      "total_minutes": 52,
      "available_minutes": 45,
      "current_plan": {
        "_id": "plan_id",
        "name": "Premium",
        "price": 99.9,
        "voice_minutes": 50,
        "features": ["50 voice minutes", "Advanced AI companion", ...]
      },
      "started_at": "2025-09-16T06:00:00.000Z"
    }
  }
}
```

### 14. Update Voice and Model Settings

**PUT** `/subscriptions/voice-model`

Update the user's voice_id and model_id settings.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "voice_id": "new_voice_123",
  "model_id": "new_model_456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User voice and model settings updated successfully",
  "data": {
    "voice_id": "new_voice_123",
    "model_id": "new_model_456"
  }
}
```

### 15. Subscribe to a Plan

**POST** `/subscriptions/subscribe`

Subscribe the user to a specific plan. This will add the plan's minutes to the user's account.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "plan_id": "plan_object_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully subscribed to plan",
  "data": {
    "user_subscription": {
      "current_plan": {
        "_id": "plan_id",
        "name": "Premium",
        "price": 99.9,
        "voice_minutes": 50
      },
      "started_at": "2025-09-16T06:30:00.000Z",
      "total_minutes": 52,
      "available_minutes": 52
    }
  }
}
```

### 16. Add Minutes to Account

**POST** `/subscriptions/add-minutes`

Add additional minutes to the user's account (for separate minute purchases).

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "minutes": 25
}
```

**Response:**

```json
{
  "success": true,
  "message": "Minutes added successfully",
  "data": {
    "added_minutes": 25,
    "total_minutes": 77,
    "available_minutes": 70
  }
}
```

---

## Conversation APIs

### 17. Create Conversation

**POST** `/talk/conversations`

Create a new conversation with messages.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "text": "Hello, I'm feeling anxious today",
      "timestamp": "2025-09-16T10:00:00.000Z"
    },
    {
      "role": "ai",
      "text": "I understand. Would you like to talk about what's causing your anxiety?",
      "timestamp": "2025-09-16T10:00:05.000Z"
    }
  ],
  "mood": "Anxious",
  "startedAt": "2025-09-16T10:00:00.000Z",
  "endedAt": "2025-09-16T10:05:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation created",
  "data": {
    "conversationId": "conversation_id"
  }
}
```

### 18. List User Conversations

**GET** `/talk/conversations?page=1&limit=20`

Get paginated list of user's conversations.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "_id": "conversation_id",
        "title": "Hello, I'm feeling anxious today",
        "mood": "Anxious",
        "startedAt": "2025-09-16T10:00:00.000Z",
        "durationSec": 300
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "hasMore": true
    }
  }
}
```

### 19. Get Conversation Details

**GET** `/talk/conversations/{conversation_id}`

Get a specific conversation with full transcript.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "_id": "conversation_id",
    "title": "Hello, I'm feeling anxious today",
    "mood": "Anxious",
    "startedAt": "2025-09-16T10:00:00.000Z",
    "endedAt": "2025-09-16T10:05:00.000Z",
    "durationSec": 300,
    "messages": [
      {
        "role": "user",
        "text": "Hello, I'm feeling anxious today",
        "timestamp": "2025-09-16T10:00:00.000Z"
      },
      {
        "role": "ai",
        "text": "I understand. Would you like to talk about what's causing your anxiety?",
        "timestamp": "2025-09-16T10:00:05.000Z"
      }
    ]
  }
}
```

### 20. Delete Conversation

**DELETE** `/talk/conversations/{conversation_id}`

Delete a specific conversation and all its messages.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

---

## Admin APIs

### 21. Create Subscription Plan (Admin Only)

**POST** `/subscriptions/admin/plans`

Create a new subscription plan.

**Headers:**

```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Premium",
  "status": "Active",
  "price": 99.9,
  "billing_period": "yearly",
  "voice_minutes": 50,
  "features": [
    "50 voice minutes",
    "Advanced AI companion",
    "Voice & text conversations",
    "High-quality voice",
    "Priority support",
    "Custom voice settings"
  ],
  "description": "Great for regular users",
  "is_popular": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription plan created successfully",
  "data": {
    "plan": {
      "_id": "new_plan_id",
      "name": "Premium",
      "status": "Active",
      "price": 99.9,
      "billing_period": "yearly",
      "voice_minutes": 50,
      "features": ["50 voice minutes", "Advanced AI companion", ...],
      "description": "Great for regular users",
      "is_popular": true,
      "createdAt": "2025-09-16T06:30:00.000Z",
      "updatedAt": "2025-09-16T06:30:00.000Z"
    }
  }
}
```

### 22. Get All Plans (Admin Only)

**GET** `/subscriptions/admin/plans?status=Active`

Get all subscription plans (with optional status filter).

**Headers:**

```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**

- `status` (optional): "Active" or "Inactive"

**Response:**

```json
{
  "success": true,
  "message": "Subscription plans fetched successfully",
  "data": {
    "plans": [...]
  }
}
```

### 23. Get Plan by ID (Admin Only)

**GET** `/subscriptions/admin/plans/{plan_id}`

Get a specific subscription plan by ID (needed for CRUD operations).

**Headers:**

```
Authorization: Bearer <admin_access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription plan fetched successfully",
  "data": {
    "plan": {...}
  }
}
```

### 24. Update Plan (Admin Only)

**PUT** `/subscriptions/admin/plans/{plan_id}`

Update an existing subscription plan.

**Headers:**

```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Body:** (All fields optional)

```json
{
  "name": "Premium Plus",
  "status": "Inactive",
  "price": 129.9,
  "voice_minutes": 75,
  "features": ["Updated features list"],
  "description": "Updated description",
  "is_popular": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription plan updated successfully",
  "data": {
    "plan": {...}
  }
}
```

### 25. Delete Plan (Admin Only)

**DELETE** `/subscriptions/admin/plans/{plan_id}`

Delete a subscription plan (only if no users are currently subscribed to it).

**Headers:**

```
Authorization: Bearer <admin_access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription plan deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": "Specific validation error"
  }
}
```

**Enhanced Error Handling:**
- Detailed validation messages for all fields
- Specific error codes for different scenarios
- User-friendly error messages
- Proper HTTP status codes

**Common HTTP status codes:**

- `400` - Bad Request (validation errors, malformed data)
- `401` - Unauthorized (missing/invalid/expired token)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `409` - Conflict (duplicate email/username, etc.)
- `413` - Payload Too Large (file size exceeded)
- `500` - Internal Server Error

**Example Error Responses:**

```json
// Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Please provide a valid email address (e.g., user@example.com)",
    "password": "Password must contain at least one letter and one number"
  }
}

// Duplicate Registration
{
  "success": false,
  "message": "Registration failed",
  "errors": {
    "email": "An account with this email already exists"
  }
}

// File Upload Error
{
  "success": false,
  "message": "File upload failed",
  "errors": {
    "profilePicture": "File size too large. Maximum allowed size is 10MB"
  }
}
```

---

## Usage Guide

### Setting up Authentication

1. **Register a user**: Use `/auth/register` (no token returned)
2. **Login**: Use `/auth/login` to get access token
3. **Include token**: Add `Authorization: Bearer <token>` to all authenticated requests

### Admin Setup

1. **Create admin user**: Register normally, then manually set `is_admin: true` in database
2. **Admin tokens**: Admin users get permanent access tokens (never expire)
3. **Admin logout**: Admins only logout when they manually click logout button

### User Workflow

1. **Registration → Login** (separate steps)
2. **Profile management**: Update username, profile picture, change password
3. **Subscription management**: View plans, subscribe, manage voice/model settings
4. **Conversations**: Create, list, view, delete conversations

### Testing in Postman

#### Environment Variables

```
base_url: http://localhost:5000/api
access_token: <user_token>
admin_token: <admin_token>
```

#### Sample Collection Structure

```
📁 SelfTalk APIs
├── 📁 Authentication
│   ├── POST {{base_url}}/auth/register
│   ├── POST {{base_url}}/auth/upload-profile-picture ✨ NEW
│   ├── DELETE {{base_url}}/auth/delete-account ✨ NEW
│   ├── POST {{base_url}}/auth/login
│   ├── GET {{base_url}}/auth/profile
│   ├── PUT {{base_url}}/auth/profile
│   ├── PUT {{base_url}}/auth/change-password
│   ├── POST {{base_url}}/auth/logout
│   ├── POST {{base_url}}/auth/forgot-password
│   ├── POST {{base_url}}/auth/verify-reset-otp
│   └── POST {{base_url}}/auth/reset-password
├── 📁 Subscriptions (User)
│   ├── GET {{base_url}}/subscriptions/plans
│   ├── GET {{base_url}}/subscriptions/my-subscription
│   ├── PUT {{base_url}}/subscriptions/voice-model
│   ├── POST {{base_url}}/subscriptions/subscribe
│   └── POST {{base_url}}/subscriptions/add-minutes
├── 📁 Conversations
│   ├── POST {{base_url}}/talk/conversations
│   ├── GET {{base_url}}/talk/conversations
│   ├── GET {{base_url}}/talk/conversations/:id
│   ├── DELETE {{base_url}}/talk/conversations/:id
│   └── POST {{base_url}}/talk/conversations/dev-seed
└── 📁 Admin APIs
    ├── POST {{base_url}}/subscriptions/admin/plans
    ├── GET {{base_url}}/subscriptions/admin/plans
    ├── GET {{base_url}}/subscriptions/admin/plans/:id
    ├── PUT {{base_url}}/subscriptions/admin/plans/:id
    └── DELETE {{base_url}}/subscriptions/admin/plans/:id
```

### Quick Test Commands

Test server connectivity:

```bash
curl http://localhost:5000/api/subscriptions/plans
```

Test with authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/subscriptions/my-subscription
```

Register user (updated to JSON):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","email":"test@example.com","password":"password123"}'
```

Upload profile picture:

```bash
curl -X POST http://localhost:5000/api/auth/upload-profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

Login user:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
