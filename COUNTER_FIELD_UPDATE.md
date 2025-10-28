# Counter Field Addition - Summary

## Changes Made

Added a new `counter` field to the User model that can be updated via the profile endpoint and is included in all user responses.

---

## 1. User Model Update (`models/User.js`)

**Added new field:**
```javascript
counter: {
  type: Number,
  default: 0,
}
```

**Location:** Between `model_id` and `current_subscription` fields

**Default Value:** `0` (automatically set on user creation)

---

## 2. Formatter Update (`utils/formatters.js`)

**Updated `formatUserResponse` to include counter:**
```javascript
return {
  _id: user._id,
  username: user.username,
  email: user.email,
  profilePicture: user.profilePicture || "",
  voice_id: user.voice_id || null,
  model_id: user.model_id || null,
  counter: user.counter || 0,  // ✅ Added
  current_subscription: user.current_subscription
    ? formatUserSubscriptionResponse(user.current_subscription)
    : null,
  role: user.role || null,
  is_suspended: user.is_suspended || false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
```

---

## 3. User Controller Update (`controllers/userController.js`)

### Updated `updateProfile` endpoint:

**Added counter to request body:**
```javascript
const { username, profilePicture, voice_id, model_id, counter } = req.body;
```

**Added counter update logic:**
```javascript
// Handle counter update
if (counter !== undefined) {
  user.counter = typeof counter === "number" ? counter : 0;
  profileUpdated = true;
}
```

**Validation:** Ensures counter is a number, defaults to 0 if invalid

---

## 4. All Endpoints Now Include Counter

Since all endpoints use `formatUserResponse`, the counter field is automatically included in all responses:

### Auth Routes
- ✅ POST `/api/auth/register` - Counter defaults to 0
- ✅ POST `/api/auth/login` - Counter included in response

### User Routes
- ✅ GET `/api/user/profile` - Counter included
- ✅ PUT `/api/user/profile` - Counter can be updated and is included in response

### Subscription Routes
- ✅ GET `/api/subscriptions/my-subscription` - Counter included
- ✅ POST `/api/subscriptions/buy-subscription` - Counter included
- ✅ POST `/api/subscriptions/add-minutes` - Counter included
- ✅ POST `/api/subscriptions/check-expiry` - Counter included
- ✅ POST `/api/subscriptions/update-recordings` - Counter included

---

## Response Structure

All user responses now include the counter field:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile fetched successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "profilePicture": "",
      "voice_id": null,
      "model_id": null,
      "counter": 0,
      "current_subscription": {
        "_id": "...",
        "name": "Free",
        "status": "Active",
        "price": 0,
        "billing_period": "monthly",
        "features": [...],
        "description": "...",
        "is_popular": false,
        "currency": "EUR",
        "total_minutes": 2,
        "available_minutes": 2,
        "recordings": [],
        "subscription_started_at": "...",
        "subscription_end_date": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      "role": {...},
      "is_suspended": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## Usage Examples

### 1. Register New User
**POST** `/api/auth/register`

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response includes:** `counter: 0` (default)

---

### 2. Update Counter
**PUT** `/api/user/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "counter": 5
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "counter": 5,
      ...
    }
  }
}
```

---

### 3. Update Multiple Fields Including Counter
**PUT** `/api/user/profile`

**Body:**
```json
{
  "username": "newusername",
  "voice_id": "voice_123",
  "model_id": "model_456",
  "counter": 10
}
```

**Response:** All fields updated, including counter

---

### 4. Get Profile
**GET** `/api/user/profile`

**Response:** Includes current counter value

---

## Validation

- **Type:** Number
- **Default:** 0
- **Update Logic:** 
  - If `counter` is provided and is a number, use that value
  - If `counter` is provided but not a number, default to 0
  - If `counter` is not provided, field remains unchanged

---

## Files Modified

1. ✅ `models/User.js` - Added counter field
2. ✅ `utils/formatters.js` - Added counter to formatUserResponse
3. ✅ `controllers/userController.js` - Added counter update logic

---

## No Changes Required

The following already use `formatUserResponse`, so they automatically include counter:

- ✅ `controllers/authController.js` - Register & Login
- ✅ `controllers/subscriptionController.js` - All subscription endpoints
- ✅ `controllers/userController.js` - All user endpoints

---

## Testing Checklist

- [x] Register new user → counter defaults to 0
- [x] Login → counter included in response
- [x] Get profile → counter included
- [x] Update counter via PUT /profile → counter updated
- [x] Update other fields → counter remains unchanged
- [x] Buy subscription → counter included in response
- [x] Add minutes → counter included in response
- [x] Check expiry → counter included in response
- [x] All responses consistent

---

## Consistency Maintained

✅ **Response structure unchanged** - Counter added without breaking existing structure
✅ **All endpoints consistent** - Counter included everywhere via formatUserResponse
✅ **Default value set** - New users automatically get counter: 0
✅ **Updateable** - Users can update counter via profile endpoint
✅ **Type-safe** - Validation ensures counter is always a number

---

## Benefits

1. ✅ **Single source of truth** - formatUserResponse handles all formatting
2. ✅ **Automatic inclusion** - Counter automatically in all responses
3. ✅ **Consistent behavior** - Same as voice_id and model_id
4. ✅ **Easy to update** - Simple PUT request to profile endpoint
5. ✅ **No breaking changes** - Existing functionality unaffected
