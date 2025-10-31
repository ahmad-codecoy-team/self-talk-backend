# SelfTalk API Documentation

## Base URL
- **Local Development**: `http://localhost:5000`
- **Production**: `https://yourdomain.com`

## Response Format
All API responses follow this standard structure:

```json
{
  "success": true|false,
  "statusCode": 200,
  "message": "Response message",
  "data": { ... },  // Optional, only in success responses
  "meta": { ... }   // Optional, for pagination data
}
```

---

## Authentication Endpoints (`/api/auth`)

### POST `/api/auth/register`
Register a new user account. User receives a Free subscription (2 minutes) by default.

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
      "counter": 0,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "monthly",
        "features": ["2 voice minutes", "Basic AI companion"],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false,
        "currency": "EUR",
        "total_minutes": 2,
        "available_minutes": 2,
        "extra_minutes": 0,
        "recordings": [],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions"
      },
      "is_suspended": false,
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
```json
// 409 - Email already exists
{
  "success": false,
  "statusCode": 409,
  "message": "Registration failed",
  "errors": {
    "email": "An account with this email already exists"
  }
}

// 409 - Username already taken
{
  "success": false,
  "statusCode": 409,
  "message": "Registration failed",
  "errors": {
    "username": "This username is already taken"
  }
}
```

---

### POST `/api/auth/upload-profile-picture`
Upload profile picture before registration (public endpoint).

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `profilePicture`
- Accepted formats: JPG, JPEG, PNG
- Max size: 5MB

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile_pics/filename-123456.jpg"
  }
}
```

---

### POST `/api/auth/login`
Login with email and password. Returns user data with populated subscription including extra_minutes.

**Request Body:**
```json
{
  "email": "string (valid email)",
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
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 0,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 250,
        "extra_minutes": 50,
        "recordings": [],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-31T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
```json
// 400 - Invalid credentials
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid credentials"
}

// 403 - Account suspended
{
  "success": false,
  "statusCode": 403,
  "message": "Your account has been suspended. Please contact support for assistance."
}
```

---

### POST `/api/auth/forgot-password`
Request password reset OTP code.

**Request Body:**
```json
{
  "email": "test@example.com"
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
    "otp": "123456",
    "expiresAt": "2025-10-31T10:10:00.000Z"
  }
}
```

---

### POST `/api/auth/verify-reset-otp`
Verify the OTP code before resetting password.

**Request Body:**
```json
{
  "email": "test@example.com",
  "otp": "123456"
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

---

### POST `/api/auth/reset-password`
Reset password after OTP verification.

**Request Body:**
```json
{
  "email": "test@example.com",
  "newPassword": "newSecurePass123"
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

---

## Subscription Endpoints (`/api/subscriptions`)

### Public Endpoints

#### GET `/api/subscriptions/plans`
Get all active subscription plan templates (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active subscription plans fetched successfully",
  "data": {
    "plans": [
      {
        "_id": "plan_id_1",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "monthly",
        "features": ["2 voice minutes", "Basic AI companion"],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false,
        "currency": "EUR",
        "voice_minutes": 2,
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:00.000Z"
      },
      {
        "_id": "plan_id_2",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "voice_minutes": 200,
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:00.000Z"
      },
      {
        "_id": "plan_id_3",
        "name": "Super",
        "status": "Active",
        "price": 19.99,
        "billing_period": "monthly",
        "features": ["500 voice minutes", "Priority support", "Advanced AI", "Custom voice models"],
        "description": "For power users",
        "is_popular": false,
        "currency": "EUR",
        "voice_minutes": 500,
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

### User Endpoints (Authentication Required)

All user endpoints require `Authorization: Bearer <token>` header.

#### GET `/api/subscriptions/my-subscription`
Get current user's subscription details with full user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User subscription details fetched successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "/uploads/profile_pics/user123.jpg",
      "voice_id": "voice_123",
      "model_id": "model_456",
      "counter": 15,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 220,
        "extra_minutes": 50,
        "recordings": ["rec1", "rec2"],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:30:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:30:00.000Z"
    }
  }
}
```

**Important Notes:**
- `available_minutes` in response = subscription's available_minutes + extra_minutes
- `total_minutes` = subscription plan minutes + extra_minutes purchased
- `extra_minutes` = purchased minutes that never expire
- Frontend should only use `available_minutes` for display

---

#### POST `/api/subscriptions/subscribe`
Subscribe to or switch subscription plan. 

**IMPORTANT BEHAVIOR:**
- Subscription plan minutes are reset to new plan's allocation
- `extra_minutes` (purchased separately) are PRESERVED across plan changes
- Old subscription's unused plan minutes are NOT carried over

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Premium"
}
```
- Valid plan names: "Free", "Premium", "Super" (case-insensitive)

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Successfully subscribed to plan",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 5,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 250,
        "extra_minutes": 50,
        "recordings": [],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

**Example Scenario:**
```
User has Premium plan (200 min) + 50 extra_minutes purchased
User has consumed 30 minutes (170 plan + 50 extra remaining)
User switches to Super plan (500 min)

Result:
- total_minutes: 550 (500 from Super + 50 extra)
- available_minutes: 550 (500 from Super + 50 extra)
- extra_minutes: 50 (preserved)
- The 170 unused Premium minutes are lost
```

---

#### POST `/api/subscriptions/add-minutes`
Purchase additional minutes. These minutes NEVER expire and are preserved across plan changes.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "minutes": 50
}
```
- `minutes` must be a positive integer

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Minutes added successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 5,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 250,
        "extra_minutes": 50,
        "recordings": [],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:15:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:15:00.000Z"
    }
  }
}
```

**Internal Behavior:**
- Adds to `extra_minutes` field in database
- Adds to `total_minutes` field in database
- Does NOT add to `available_minutes` in database
- Response `available_minutes` includes extra_minutes automatically (via formatter)

---

#### POST `/api/subscriptions/check-expiry`
Check subscription expiry and handle automatic downgrade to Free plan if expired.

**IMPORTANT BEHAVIOR:**
- If subscription expired: downgrades to Free plan (2 minutes)
- `extra_minutes` are PRESERVED during downgrade
- Free plan users: no expiry check needed

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) - Downgraded to Free:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Downgraded to Free plan with 2 minutes",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 25,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "monthly",
        "features": ["2 voice minutes", "Basic AI companion"],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false,
        "currency": "EUR",
        "total_minutes": 52,
        "available_minutes": 52,
        "extra_minutes": 50,
        "recordings": [],
        "subscription_started_at": "2025-10-31T12:00:00.000Z",
        "subscription_end_date": "2025-11-30T12:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T12:00:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

#### POST `/api/subscriptions/update-recordings`
Update recordings list and/or available minutes (used by frontend to track usage).

**IMPORTANT:** This endpoint handles minutes consumption logic:
1. Deducts from subscription's `available_minutes` FIRST
2. Then deducts from `extra_minutes` if subscription minutes exhausted
3. Frontend sends combined available_minutes; backend splits it internally

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recordings": ["rec1", "rec2", "rec3"],
  "available_minutes": 180
}
```
- `recordings` (optional): Array of recording IDs
- `available_minutes` (optional): Updated available minutes after consumption

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 5,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 180,
        "extra_minutes": 30,
        "recordings": ["rec1", "rec2", "rec3"],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:45:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": false,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:45:00.000Z"
    }
  }
}
```

**Consumption Example:**
```
User has: 
- Subscription: 150 available_minutes
- Extra: 50 extra_minutes
- Total shown to frontend: 200 available_minutes

User consumes 20 minutes → Frontend sends: 180

Backend logic:
- 150 subscription - 20 = 130 subscription
- 50 extra remains
- Response: 180 available_minutes (130 + 50)

User consumes 140 more → Frontend sends: 40

Backend logic:
- 130 subscription - 130 = 0 subscription (exhausted)
- Remaining 10 consumed from extra: 50 - 10 = 40 extra
- Response: 40 available_minutes (0 + 40)
```

---

## Admin Endpoints (`/api/admin`)

All admin endpoints require `Authorization: Bearer <admin_token>` header and admin role.

### User Management

#### GET `/api/admin/users`
Get all users with pagination (excludes admin users).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successfully",
  "data": {
    "users": [
      {
        "_id": "user_id",
        "username": "testuser",
        "email": "test@example.com",
        "profilePicture": "/uploads/profile_pics/user123.jpg",
        "voice_id": "voice_123",
        "model_id": "model_456",
        "counter": 15,
        "current_subscription": {
          "_id": "subscription_id",
          "name": "Premium",
          "status": "Active",
          "price": 9.99,
          "billing_period": "monthly",
          "features": ["200 voice minutes", "Priority support", "Advanced AI"],
          "description": "Perfect for regular users",
          "is_popular": true,
          "currency": "EUR",
          "total_minutes": 250,
          "available_minutes": 220,
          "extra_minutes": 50,
          "recordings": ["rec1", "rec2"],
          "subscription_started_at": "2025-10-31T10:00:00.000Z",
          "subscription_end_date": "2025-11-30T10:00:00.000Z",
          "createdAt": "2025-10-31T10:00:00.000Z",
          "updatedAt": "2025-10-31T10:30:00.000Z"
        },
        "role": {
          "_id": "role_id",
          "name": "user",
          "description": "Regular user with standard permissions"
        },
        "is_suspended": false,
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:30:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 50,
    "limit": 10,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

---

#### PUT `/api/admin/users/suspension/:id`
Toggle user suspension status. Automatically toggles without request body.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User suspended successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 5,
      "current_subscription": {
        "_id": "subscription_id",
        "name": "Premium",
        "status": "Active",
        "price": 9.99,
        "billing_period": "monthly",
        "features": ["200 voice minutes", "Priority support", "Advanced AI"],
        "description": "Perfect for regular users",
        "is_popular": true,
        "currency": "EUR",
        "total_minutes": 250,
        "available_minutes": 220,
        "extra_minutes": 50,
        "recordings": [],
        "subscription_started_at": "2025-10-31T10:00:00.000Z",
        "subscription_end_date": "2025-11-30T10:00:00.000Z",
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:30:00.000Z"
      },
      "role": {
        "_id": "role_id",
        "name": "user"
      },
      "is_suspended": true,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T11:00:00.000Z"
    }
  }
}
```

**Error (403) - Cannot suspend admin:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot suspend admin users"
}
```

---

### FAQ Management

#### POST `/api/admin/faq`
Create a new FAQ.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "category": "General",
  "question": "What is SelfTalk?",
  "answer": "SelfTalk is an AI-powered companion application that helps you practice conversations and improve your communication skills."
}
```
- Valid categories: "General", "Account", "Billing", "Features", "Technical"

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "FAQ created successfully",
  "data": {
    "faq": {
      "_id": "faq_id",
      "category": "General",
      "question": "What is SelfTalk?",
      "answer": "SelfTalk is an AI-powered companion application that helps you practice conversations and improve your communication skills.",
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

#### GET `/api/admin/faq`
Get all FAQs with optional category filter.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `category` (optional): Filter by category

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQs fetched successfully",
  "data": {
    "faqs": [
      {
        "_id": "faq_id_1",
        "category": "General",
        "question": "What is SelfTalk?",
        "answer": "SelfTalk is an AI-powered companion application...",
        "createdAt": "2025-10-31T12:00:00.000Z",
        "updatedAt": "2025-10-31T12:00:00.000Z"
      },
      {
        "_id": "faq_id_2",
        "category": "Billing",
        "question": "How do purchased minutes work?",
        "answer": "Purchased minutes never expire and are preserved across plan changes...",
        "createdAt": "2025-10-31T11:30:00.000Z",
        "updatedAt": "2025-10-31T11:30:00.000Z"
      }
    ]
  }
}
```

---

#### GET `/api/admin/faq/:id`
Get single FAQ by ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQ fetched successfully",
  "data": {
    "faq": {
      "_id": "faq_id",
      "category": "Features",
      "question": "How many voice minutes do I get with the free plan?",
      "answer": "The free plan includes 2 voice minutes to help you get started with SelfTalk.",
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

#### PUT `/api/admin/faq/:id`
Update FAQ (all fields optional for partial updates).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "category": "Billing",
  "question": "How do I cancel my subscription?",
  "answer": "You can cancel your subscription at any time from your account settings."
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQ updated successfully",
  "data": {
    "faq": {
      "_id": "faq_id",
      "category": "Billing",
      "question": "How do I cancel my subscription?",
      "answer": "You can cancel your subscription at any time from your account settings.",
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:15:00.000Z"
    }
  }
}
```

---

#### DELETE `/api/admin/faq/:id`
Delete FAQ.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQ deleted successfully"
}
```

---

### Document Management

#### GET `/api/admin/documents`
Get all documents.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Documents fetched successfully",
  "data": {
    "documents": [
      {
        "_id": "doc_id",
        "slug": "terms-of-service",
        "title": "Terms of Service",
        "content": "Full terms content...",
        "type": "Legal",
        "isPublished": true,
        "lastUpdated": "2025-10-31T10:00:00.000Z",
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### GET `/api/admin/documents/:id`
Get single document by ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document fetched successfully",
  "data": {
    "document": {
      "_id": "doc_id",
      "slug": "privacy-policy",
      "title": "Privacy Policy",
      "content": "Full privacy policy content...",
      "type": "Legal",
      "isPublished": true,
      "lastUpdated": "2025-10-31T10:00:00.000Z",
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

---

#### GET `/api/admin/documents/slug/:slug`
Get single document by slug.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document fetched successfully",
  "data": {
    "document": {
      "_id": "doc_id",
      "slug": "terms-of-service",
      "title": "Terms of Service",
      "content": "Full terms content...",
      "type": "Legal",
      "isPublished": true,
      "lastUpdated": "2025-10-31T10:00:00.000Z",
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T10:00:00.000Z"
    }
  }
}
```

---

#### PUT `/api/admin/documents/:id`
Update document (all fields optional).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Updated Terms of Service",
  "content": "Updated content...",
  "isPublished": true
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document updated successfully",
  "data": {
    "document": {
      "_id": "doc_id",
      "slug": "terms-of-service",
      "title": "Updated Terms of Service",
      "content": "Updated content...",
      "type": "Legal",
      "isPublished": true,
      "lastUpdated": "2025-10-31T12:00:00.000Z",
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

### Notification Management

#### POST `/api/admin/notifications`
Create a new notification.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "System Maintenance",
  "type": "Info",
  "message": "We'll be performing scheduled maintenance on our servers tomorrow from 2:00 AM to 4:00 AM EST.",
  "target_audience": "All Users"
}
```
- Valid types: "Info", "Success", "Warning", "Error"
- Valid audiences: "All Users", "Active Users", "Premium Users", "Free Users"

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Notification created successfully",
  "data": {
    "notification": {
      "_id": "notification_id",
      "title": "System Maintenance",
      "type": "Info",
      "message": "We'll be performing scheduled maintenance on our servers tomorrow from 2:00 AM to 4:00 AM EST.",
      "target_audience": "All Users",
      "created_by": {
        "_id": "admin_id",
        "username": "admin",
        "email": "admin@example.com"
      },
      "is_active": true,
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

#### GET `/api/admin/notifications`
Get all notifications with pagination and filters.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type
- `target_audience` (optional): Filter by audience
- `is_active` (optional): Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "title": "System Maintenance",
        "type": "Info",
        "message": "We'll be performing scheduled maintenance...",
        "target_audience": "All Users",
        "created_by": {
          "_id": "admin_id",
          "username": "admin",
          "email": "admin@example.com"
        },
        "is_active": true,
        "createdAt": "2025-10-31T12:00:00.000Z",
        "updatedAt": "2025-10-31T12:00:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 15,
    "limit": 10,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

---

#### GET `/api/admin/notifications/:id`
Get single notification by ID.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification fetched successfully",
  "data": {
    "notification": {
      "_id": "notification_id",
      "title": "System Maintenance",
      "type": "Info",
      "message": "We'll be performing scheduled maintenance...",
      "target_audience": "All Users",
      "created_by": {
        "_id": "admin_id",
        "username": "admin",
        "email": "admin@example.com"
      },
      "is_active": true,
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:00:00.000Z"
    }
  }
}
```

---

#### PUT `/api/admin/notifications/:id`
Update notification (all fields optional).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Extended Maintenance Window",
  "message": "Maintenance extended to 6:00 AM EST.",
  "is_active": false
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification updated successfully",
  "data": {
    "notification": {
      "_id": "notification_id",
      "title": "Extended Maintenance Window",
      "type": "Info",
      "message": "Maintenance extended to 6:00 AM EST.",
      "target_audience": "All Users",
      "created_by": {
        "_id": "admin_id",
        "username": "admin",
        "email": "admin@example.com"
      },
      "is_active": false,
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:30:00.000Z"
    }
  }
}
```

---

#### DELETE `/api/admin/notifications/:id`
Delete notification.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification deleted successfully"
}
```

---

## Key Subscription Concepts

### Minutes System
The application uses a three-tier minutes system:

1. **Subscription Minutes** (`available_minutes` in DB)
   - Minutes from current subscription plan
   - Reset when user switches plans
   - Expire when subscription expires

2. **Extra Minutes** (`extra_minutes` in DB)
   - Purchased separately via `/add-minutes`
   - NEVER expire
   - Preserved across plan changes
   - Preserved during expiry/downgrade

3. **Total Minutes** (`total_minutes` in DB)
   - Sum of subscription plan minutes + extra_minutes
   - Tracks total minutes in current cycle

### Frontend Display
- Frontend receives: `available_minutes = subscription_minutes + extra_minutes`
- Frontend receives: `extra_minutes` (for informational display)
- Frontend ONLY needs to work with `available_minutes`
- Backend handles all splitting/tracking logic

### Consumption Logic
When minutes are consumed (via `/update-recordings`):
1. Deduct from subscription minutes FIRST
2. Only deduct from extra_minutes when subscription minutes = 0
3. Backend automatically manages this split

### Plan Change Behavior
When user changes plan (via `/subscribe`):
- Subscription minutes → Reset to new plan allocation
- Extra minutes → PRESERVED
- Example: Premium (200) + 50 extra → Super (500) + 50 extra

### Expiry Behavior
When subscription expires (via `/check-expiry`):
- Subscription → Downgraded to Free (2 minutes)
- Extra minutes → PRESERVED
- Example: Premium expired + 50 extra → Free (2) + 50 extra = 52 total

---

## Authentication Requirements
- **Public**: `/api/subscriptions/plans`, `/api/auth/*` (except upload requires no auth)
- **User Protected**: All subscription user endpoints require valid JWT token
- **Admin Protected**: All `/api/admin/*` endpoints require admin role + JWT token

---

## Important Changes from Previous Version
1. **New `extra_minutes` field**: Non-expiring minutes that persist across plan changes
2. **Subscription behavior**: Plan changes now preserve `extra_minutes`
3. **Minutes display**: `available_minutes` in response = subscription + extra (combined)
4. **Add minutes**: Only adds to `extra_minutes`, not subscription minutes
5. **Consumption**: Backend automatically deducts from subscription first, then extra
6. **Expiry handling**: Preserves `extra_minutes` when downgrading to Free
7. **User model**: Removed subscription fields, now uses `UserSubscription` reference
8. **Response format**: All subscription responses now include `extra_minutes` field
