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
  "data": { ... },  // Optional, only in success responses
  "meta": { ... }   // Optional, for pagination data
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

### POST `/api/auth/login`
Login with email and password.

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

## Subscription Endpoints (`/api/subscriptions`)

### Public Endpoints

#### GET `/api/subscriptions/plans`
Get all active subscription plans (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
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
        "features": ["2 voice minutes", "Basic AI companion"],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false
      }
    ]
  }
}
```

### User Endpoints

All user endpoints require authentication.

#### GET `/api/subscriptions/my-subscription`
Get current user's subscription details.

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
    "user_subscription": {
      "voice_id": "voice_id_here",
      "model_id": "model_id_here",
      "total_minutes": 50,
      "available_minutes": 35,
      "current_plan": {
        "_id": "plan_id",
        "name": "Premium",
        "price": 99.9,
        "billing_period": "yearly"
      },
      "started_at": "2025-09-18T08:00:00.000Z"
    }
  }
}
```

#### POST `/api/subscriptions/subscribe`
Subscribe to a plan.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "plan_id": "plan_id_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Successfully subscribed to plan",
  "data": {
    "user_subscription": {
      "current_plan": {
        "_id": "plan_id",
        "name": "Premium",
        "price": 99.9,
        "billing_period": "yearly",
        "voice_minutes": 50
      },
      "started_at": "2025-09-18T08:00:00.000Z",
      "total_minutes": 52,
      "available_minutes": 52
    }
  }
}
```

#### POST `/api/subscriptions/add-minutes`
Add minutes to user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "minutes": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Minutes added successfully",
  "data": {
    "added_minutes": 10,
    "total_minutes": 60,
    "available_minutes": 60
  }
}
```

## Admin Endpoints (`/api/admin`)

All admin endpoints require admin role in addition to authentication.

### Subscription Plan Management

#### POST `/api/admin/plans`
Create a new subscription plan (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Enterprise",
  "price": 499.99,
  "billing_period": "yearly",
  "voice_minutes": 1000,
  "features": ["1000 voice minutes", "Priority support", "Custom integrations"],
  "description": "For large organizations",
  "is_popular": false
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Subscription plan created successfully",
  "data": {
    "plan": {
      "_id": "plan_id",
      "name": "Enterprise",
      "status": "Active",
      "price": 499.99,
      "billing_period": "yearly",
      "voice_minutes": 1000,
      "features": ["1000 voice minutes", "Priority support", "Custom integrations"],
      "description": "For large organizations",
      "is_popular": false,
      "createdAt": "2025-09-18T11:29:24.970Z",
      "updatedAt": "2025-09-18T11:29:24.970Z"
    }
  }
}
```

#### GET `/api/admin/plans`
Get all subscription plans with optional status filter (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (Active or Inactive)

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription plans fetched successfully",
  "data": {
    "plans": [
      {
        "_id": "plan_id",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "yearly",
        "voice_minutes": 2,
        "features": ["2 voice minutes", "Basic AI companion"],
        "description": "Perfect for trying out SelfTalk",
        "is_popular": false,
        "createdAt": "2025-09-16T06:28:30.961Z",
        "updatedAt": "2025-09-18T10:07:48.459Z"
      }
    ]
  }
}
```

#### GET `/api/admin/plans/:id`
Get single subscription plan by ID (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription plan fetched successfully",
  "data": {
    "plan": {
      "_id": "plan_id",
      "name": "Premium",
      "status": "Active",
      "price": 99.99,
      "billing_period": "yearly",
      "voice_minutes": 50,
      "features": ["50 voice minutes", "Priority support"],
      "description": "Perfect for regular users",
      "is_popular": true,
      "createdAt": "2025-09-17T12:00:00.000Z",
      "updatedAt": "2025-09-17T12:00:00.000Z"
    }
  }
}
```

#### PUT `/api/admin/plans/:id`
Update subscription plan (Admin only). All fields are optional for partial updates.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (all fields optional):**
```json
{
  "description": "Updated description for Enterprise plan",
  "is_popular": true
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription plan updated successfully",
  "data": {
    "plan": {
      "_id": "plan_id",
      "name": "Enterprise",
      "status": "Active",
      "price": 499.99,
      "billing_period": "yearly",
      "voice_minutes": 1000,
      "features": ["1000 voice minutes", "Priority support", "Custom integrations"],
      "description": "Updated description for Enterprise plan",
      "is_popular": true,
      "createdAt": "2025-09-18T11:29:24.970Z",
      "updatedAt": "2025-09-18T11:29:54.066Z"
    }
  }
}
```

#### DELETE `/api/admin/plans/:id`
Delete subscription plan (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription plan deleted successfully"
}
```

**Error Response (400) - Plan in use:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot delete plan. 5 users are currently subscribed to this plan"
}
```

### User Management

#### GET `/api/admin/users`
Get all users with pagination (Admin only).

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
        "profilePicture": "",
        "voice_id": null,
        "model_id": null,
        "total_minutes": 50,
        "available_minutes": 35,
        "current_subscription": {
          "_id": "plan_id",
          "name": "Premium",
          "price": 99.9,
          "billing_period": "yearly"
        },
        "subscription_started_at": "2025-09-18T08:00:00.000Z",
        "role": {
          "_id": "role_id",
          "name": "user",
          "description": "Regular user with standard permissions"
        },
        "is_suspended": false,
        "createdAt": "2025-09-18T08:00:00.000Z",
        "updatedAt": "2025-09-18T08:00:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 25,
    "limit": 10,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

#### PUT `/api/admin/users/suspension/:id`
Toggle user suspension status (Admin only). No request body required - this endpoint automatically toggles the suspension status.

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
      "total_minutes": 50,
      "available_minutes": 35,
      "current_subscription": {
        "_id": "plan_id",
        "name": "Premium",
        "price": 99.9,
        "billing_period": "yearly"
      },
      "subscription_started_at": "2025-09-18T08:00:00.000Z",
      "role": {
        "_id": "role_id",
        "name": "user",
        "description": "Regular user with standard permissions"
      },
      "is_suspended": true,
      "createdAt": "2025-09-18T08:00:00.000Z",
      "updatedAt": "2025-09-18T08:00:00.000Z"
    }
  }
}
```

**Error Response (403) - Cannot suspend admin:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot suspend admin users"
}
```

### FAQ Management

#### POST `/api/admin/faq`
Create a new FAQ (Admin only).

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
      "createdAt": "2025-09-19T12:00:00.000Z",
      "updatedAt": "2025-09-19T12:00:00.000Z"
    }
  }
}
```

#### GET `/api/admin/faq`
Get all FAQs with optional category filter (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `category` (optional): Filter by category (General, Account, Billing, Features, Technical)

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQs fetched successfully",
  "data": {
    "faqs": [
      {
        "_id": "faq_id",
        "category": "General",
        "question": "What is SelfTalk?",
        "answer": "SelfTalk is an AI-powered companion application that helps you practice conversations and improve your communication skills.",
        "createdAt": "2025-09-19T12:00:00.000Z",
        "updatedAt": "2025-09-19T12:00:00.000Z"
      },
      {
        "_id": "faq_id_2",
        "category": "Account",
        "question": "How do I reset my password?",
        "answer": "You can reset your password by clicking the 'Forgot Password' link on the login page and following the instructions sent to your email.",
        "createdAt": "2025-09-19T11:30:00.000Z",
        "updatedAt": "2025-09-19T11:30:00.000Z"
      }
    ]
  }
}
```

#### GET `/api/admin/faq/:id`
Get single FAQ by ID (Admin only).

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
      "createdAt": "2025-09-19T12:00:00.000Z",
      "updatedAt": "2025-09-19T12:00:00.000Z"
    }
  }
}
```

#### PUT `/api/admin/faq/:id`
Update FAQ (Admin only). All fields are optional for partial updates.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (all fields optional):**
```json
{
  "category": "Billing",
  "question": "How do I cancel my subscription?",
  "answer": "You can cancel your subscription at any time from your account settings. Your current plan will remain active until the end of the billing period."
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
      "answer": "You can cancel your subscription at any time from your account settings. Your current plan will remain active until the end of the billing period.",
      "createdAt": "2025-09-19T12:00:00.000Z",
      "updatedAt": "2025-09-19T12:15:00.000Z"
    }
  }
}
```

#### DELETE `/api/admin/faq/:id`
Delete FAQ (Admin only).

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

**Error Response (404) - FAQ not found:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "FAQ not found"
}
```

## Authentication Requirements
- **Public**: `/api/subscriptions/plans` - No authentication required
- **User Protected**: All subscription and user endpoints require valid JWT token
- **Admin Protected**: All `/api/admin/*` endpoints require admin role + JWT token

## Changes Made
- **Separated Admin Flow**: All admin endpoints moved from `/api/subscriptions/admin/*` to `/api/admin/*`
- **Plan Name Flexibility**: Admins can now create plans with any name (not restricted to Free/Premium/Super)
- **User Suspension System**: Added suspension functionality with immediate session invalidation
- **Toggle-Based Suspension**: Suspension endpoint now automatically toggles status without requiring request body
- **Consistent Response Formatting**: All user and plan data now use standardized formatters for consistent API responses
- **Logout Removal**: Removed backend logout functionality (handled on frontend)
- **Partial Updates**: All update endpoints support partial field updates
- **URL Structure Improvement**: Changed suspension endpoint from `/api/admin/users/:id/suspension` to `/api/admin/users/suspension/:id`
- **FAQ Management System**: Added complete CRUD operations for FAQ management with 5 predefined categories (General, Account, Billing, Features, Technical)