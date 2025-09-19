// Utility functions for consistent API response formatting

/**
 * Format user object for API responses
 * @param {Object} user - User object from database
 * @returns {Object} - Formatted user object
 */
exports.formatUserResponse = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture || "",
    voice_id: user.voice_id || null,
    model_id: user.model_id || null,
    total_minutes: user.total_minutes || 0,
    available_minutes: user.available_minutes || 0,
    current_subscription: user.current_subscription || null,
    subscription_started_at: user.subscription_started_at || null,
    role: user.role || null,
    is_suspended: user.is_suspended || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Format subscription plan object for API responses
 * @param {Object} plan - Plan object from database
 * @returns {Object} - Formatted plan object
 */
exports.formatPlanResponse = (plan) => {
  if (!plan) return null;

  return {
    _id: plan._id,
    name: plan.name,
    status: plan.status,
    price: plan.price,
    billing_period: plan.billing_period,
    voice_minutes: plan.voice_minutes,
    features: plan.features || [],
    description: plan.description || "",
    is_popular: plan.is_popular || false,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt
  };
};

/**
 * Format FAQ object for API responses
 * @param {Object} faq - FAQ object from database
 * @returns {Object} - Formatted FAQ object
 */
exports.formatFAQResponse = (faq) => {
  if (!faq) return null;

  return {
    _id: faq._id,
    category: faq.category,
    question: faq.question,
    answer: faq.answer,
    createdAt: faq.createdAt,
    updatedAt: faq.updatedAt
  };
};