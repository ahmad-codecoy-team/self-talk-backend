// Utility functions for consistent API response formatting

/**
 * Format user object for API responses
 * @param {Object} user - User object from database
 * @returns {Object} - Formatted user object
 */
exports.formatUserResponse = (user) => {
  if (!user) return null;

  // Forward declare to avoid circular dependency
  const formatUserSubscriptionResponse = exports.formatUserSubscriptionResponse;

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture || "",
    voice_id: user.voice_id || null,
    model_id: user.model_id || null,
    counter: user.counter || 0,
    current_subscription: user.current_subscription
      ? formatUserSubscriptionResponse(user.current_subscription)
      : null,
    role: user.role || null,
    is_suspended: user.is_suspended || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
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
    features: plan.features || [],
    description: plan.description || "",
    is_popular: plan.is_popular || false,
    currency: plan.currency || "EUR",
    voice_minutes: plan.voice_minutes || 0,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
};

/**
 * Format UserSubscription object for API responses
 * @param {Object} userSubscription - UserSubscription object from database
 * @returns {Object} - Formatted user subscription object
 */
exports.formatUserSubscriptionResponse = (userSubscription) => {
  if (!userSubscription) return null;

  const subscriptionAvailable = userSubscription.available_minutes || 0;
  const extraMinutes = userSubscription.extra_minutes || 0;

  return {
    _id: userSubscription._id,
    name: userSubscription.name,
    status: userSubscription.status,
    price: userSubscription.price,
    billing_period: userSubscription.billing_period,
    features: userSubscription.features || [],
    description: userSubscription.description || "",
    is_popular: userSubscription.is_popular || false,
    currency: userSubscription.currency || "EUR",
    total_minutes: userSubscription.total_minutes || 0,
    available_minutes: subscriptionAvailable + extraMinutes,
    extra_minutes: extraMinutes,
    seconds: userSubscription.seconds || 0, // New field for Socket.io timer system
    recordings: userSubscription.recordings || [],
    subscription_started_at: userSubscription.subscription_started_at || null,
    subscription_end_date: userSubscription.subscription_end_date || null,
    createdAt: userSubscription.createdAt,
    updatedAt: userSubscription.updatedAt,
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
    updatedAt: faq.updatedAt,
  };
};

/**
 * Format document object for API responses
 * @param {Object} document - Document object from database
 * @returns {Object} - Formatted document object
 */
exports.formatDocumentResponse = (document) => {
  if (!document) return null;

  return {
    _id: document._id,
    slug: document.slug,
    title: document.title,
    content: document.content,
    type: document.type,
    isPublished: document.isPublished,
    lastUpdated: document.lastUpdated,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

/**
 * Format notification object for API responses
 * @param {Object} notification - Notification object from database
 * @returns {Object} - Formatted notification object
 */
exports.formatNotificationResponse = (notification) => {
  if (!notification) return null;

  return {
    _id: notification._id,
    title: notification.title,
    type: notification.type,
    message: notification.message,
    target_audience: notification.target_audience,
    created_by: notification.created_by || null,
    is_active: notification.is_active,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};
