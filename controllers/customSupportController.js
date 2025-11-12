const CustomSupport = require("../models/CustomSupport");
const User = require("../models/User");
const { success, error } = require("../utils/response");

// =================== CREATE CUSTOM SUPPORT REQUEST ===================
exports.createCustomSupportRequest = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 404, "User not found");
    }

    // Check if user is suspended
    if (user.is_suspended) {
      return error(res, 403, "Account suspended. Cannot submit support requests.");
    }

    // Create the support request
    const customSupport = new CustomSupport({
      userId,
      message,
    });

    await customSupport.save();

    // Populate user data for response
    await customSupport.populate("userId", "username email");

    return success(res, 201, "Support request submitted successfully", {
      supportRequest: {
        _id: customSupport._id,
        message: customSupport.message,
        user: {
          username: customSupport.userId.username,
          email: customSupport.userId.email,
        },
        createdAt: customSupport.createdAt,
        updatedAt: customSupport.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================== GET USER'S SUPPORT REQUESTS ===================
exports.getUserSupportRequests = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId };

    // Get total count for pagination
    const total = await CustomSupport.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get support requests with pagination
    const supportRequests = await CustomSupport.find(filter)
      .select("message createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(
      res,
      200,
      "Support requests fetched successfully",
      {
        supportRequests: supportRequests.map((request) => ({
          _id: request._id,
          message: request.message,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        })),
      },
      {
        total,
        limit,
        totalPages,
        currentPage: page,
      }
    );
  } catch (err) {
    next(err);
  }
};

// =================== GET SINGLE SUPPORT REQUEST ===================
exports.getSupportRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const supportRequest = await CustomSupport.findOne({
      _id: id,
      userId: userId,
    }).populate("userId", "username email");

    if (!supportRequest) {
      return error(res, 404, "Support request not found");
    }

    return success(res, 200, "Support request fetched successfully", {
      supportRequest: {
        _id: supportRequest._id,
        message: supportRequest.message,
        user: {
          username: supportRequest.userId.username,
          email: supportRequest.userId.email,
        },
        createdAt: supportRequest.createdAt,
        updatedAt: supportRequest.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};