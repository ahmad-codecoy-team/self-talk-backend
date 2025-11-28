const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Role = require("../models/Role");
const OTP = require("../models/OTP");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const { success, error } = require("../utils/response");
const { sendEmail } = require("../utils/emailService");
const { formatUserResponse } = require("../utils/formatters");

// Access token: 30 days for regular users, permanent for admins
const ACCESS_EXPIRES = "30d";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

// Reset token (short-lived, for final password reset step)
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || "change_me";
const RESET_TOKEN_EXPIRES = "15m"; // 15 minutes

// Helpers
function signAccessToken(payload, isAdmin = false) {
  const options = isAdmin ? {} : { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
}

function signResetToken(payload) {
  return jwt.sign(payload, JWT_RESET_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES,
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function constantTimeEq(a, b) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// =================== REGISTER ===================
exports.register = async (req, res, next) => {
  try {
    console.log("📝 Register request:", {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.headers["content-type"],
    });

    // Ensure req.body exists (only check for undefined/null, not empty objects)
    if (req.body === undefined || req.body === null) {
      return error(res, 400, "Request body is required", {
        general: "No data provided in request body",
      });
    }

    const { username, email, password } = req.body;

    // Check if email or username already exists (detailed error messages)
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return error(res, 409, "Registration failed", {
        email: "An account with this email already exists",
      });
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return error(res, 409, "Registration failed", {
        username: "This username is already taken",
      });
    }

    // Get default user role
    let userRole = await Role.findOne({ name: "user" });
    if (!userRole) {
      // Create default roles if they don't exist
      userRole = await Role.create({
        name: "user",
        description: "Regular user with standard permissions",
      });

      await Role.create({
        name: "admin",
        description: "Administrator with full permissions",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Handle profile picture - use provided path or empty string
    let profilePicture = "";
    if (req.body.profilePicture && req.body.profilePicture.trim() !== "") {
      profilePicture = req.body.profilePicture.trim();
    }

    // Create new user first
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profilePicture,
      role: userRole._id,
    });

    // Get Free plan template
    const freePlanTemplate = await SubscriptionPlan.findOne({
      name: "Free",
    });
    if (!freePlanTemplate) {
      return error(res, 500, "Free plan template not found in database");
    }

    // Calculate subscription dates (1 month from now)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create user subscription with Free plan (includes new seconds field)
    const userSubscription = await UserSubscription.create({
      plan_id: freePlanTemplate._id,
      name: freePlanTemplate.name,
      status: freePlanTemplate.status,
      price: freePlanTemplate.price,
      billing_period: freePlanTemplate.billing_period,
      features: freePlanTemplate.features,
      description: freePlanTemplate.description,
      is_popular: freePlanTemplate.is_popular,
      currency: freePlanTemplate.currency,
      total_minutes: freePlanTemplate.voice_minutes,
      available_minutes: freePlanTemplate.voice_minutes,
      extra_minutes: 0,
      recordings: [],
      subscription_started_at: now,
      subscription_end_date: endDate,
    });

    // Calculate seconds from available + extra minutes (Free plan: 2 minutes = 120 seconds)
    // Always store as integer
    userSubscription.seconds = Math.floor((userSubscription.available_minutes + userSubscription.extra_minutes) * 60);
    await userSubscription.save();

    // Update user with subscription reference
    user.current_subscription = userSubscription._id;
    await user.save();

    // Populate role and subscription for response
    await user.populate("role");
    await user.populate("current_subscription");

    return success(res, 201, "User registered successfully", {
      user: formatUserResponse(user),
    });
  } catch (err) {
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];

      if (field === "email") {
        return error(res, 409, "Registration failed", {
          email: "An account with this email already exists",
        });
      } else if (field === "username") {
        return error(res, 409, "Registration failed", {
          username: "This username is already taken",
        });
      }
    }

    // Handle validation errors from MongoDB
    if (err.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(err.errors).forEach((field) => {
        validationErrors[field] = err.errors[field].message;
      });
      return error(res, 400, "Validation failed", validationErrors);
    }

    next(err);
  }
};

// =================== UPLOAD PROFILE PICTURE (PUBLIC FOR REGISTRATION) ===================
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    console.log("📸 Upload request:", {
      hasFile: !!req.file,
      filename: req.file?.filename,
      originalname: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype,
    });

    if (!req.file) {
      return error(res, 400, "Profile picture upload failed", {
        profilePicture: "No file was uploaded",
      });
    }

    // Validate file was actually saved
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "profile_pics",
      req.file.filename
    );

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found after upload:", filePath);
      return error(res, 500, "File upload failed", {
        profilePicture: "File was not saved successfully",
      });
    }

    // Just return the file path for use during registration
    const profilePicturePath = `/uploads/profile_pics/${req.file.filename}`;

    console.log("✅ File uploaded successfully:", profilePicturePath);

    return success(res, 200, "Profile picture uploaded successfully", {
      profilePicture: profilePicturePath,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    next(err);
  }
};

// =================== DELETE PROFILE PICTURE ===================
exports.deleteProfilePicture = async (userId, profilePicturePath) => {
  const fs = require("fs");
  const path = require("path");

  try {
    // Don't delete default profile picture
    if (
      profilePicturePath &&
      !profilePicturePath.includes("default-profile-pic.jpg")
    ) {
      // Remove leading slash if present
      const cleanPath = profilePicturePath.startsWith("/")
        ? profilePicturePath.slice(1)
        : profilePicturePath;
      const fullPath = path.join(__dirname, "..", cleanPath);

      // Check if file exists and delete it
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted profile picture: ${fullPath}`);
      }
    }
  } catch (err) {
    console.error(
      `Error deleting profile picture for user ${userId}:`,
      err.message
    );
  }
};

// =================== LOGIN ===================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .populate("role")
      .populate("current_subscription");
    if (!user) return error(res, 400, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return error(res, 400, "Invalid credentials");

    // Check if user is suspended
    if (user.is_suspended) {
      return error(
        res,
        403,
        "Your account has been suspended. Please contact support for assistance."
      );
    }

    // Generate permanent token for admin, regular expiring token for users
    const isAdmin = user.role && user.role.name === "admin";
    const accessToken = signAccessToken({ uid: user._id }, isAdmin);

    return success(res, 200, "Logged in successfully", {
      user: formatUserResponse(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// =================== FORGOT PASSWORD ===================
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email });

    // Only send OTP if user exists (proper security approach)
    if (!user) {
      return error(res, 404, "No account found with this email address");
    }

    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Create new OTP record
    await OTP.create({
      email,
      otp: hashed,
      expiresAt,
      purpose: "password_reset",
    });

    await sendEmail(
      user.email,
      "SelfTalk Password Reset Code",
      `Hi,\n\nWe received a request to reset your password. Your code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.\n\n— The SelfTalk Team`
    );

    return success(res, 200, "Password reset code sent to your email", {
      email,
      otp, // Send OTP in response for frontend to store
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// =================== VERIFY RESET OTP ===================
exports.verifyResetOtp = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return error(res, 400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return error(res, 400, "Invalid email or OTP");
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, purpose: "password_reset" });
    if (!otpRecord) {
      return error(res, 400, "Invalid or expired code");
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return error(res, 400, "Invalid or expired code");
    }

    // Verify OTP
    const providedHash = hashOtp(otp);
    if (!constantTimeEq(providedHash, otpRecord.otp)) {
      return error(res, 400, "Invalid or expired code");
    }

    // Delete the OTP record after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    return success(res, 200, "Code verified successfully", {
      email,
      verified: true,
      message: "You can now reset your password",
    });
  } catch (err) {
    next(err);
  }
};

// =================== RESET PASSWORD ===================
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return error(res, 400, "Email and new password are required");
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return error(res, 400, "User not found");
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    return success(res, 200, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};
