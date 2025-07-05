// Dashboard Helper Functions
import { PLAN_CONFIGS, FILTER_OPTIONS } from "./dashboardConstants.jsx";

/**
 * Filter helper functions
 */
export const getFilterLabel = (value) => {
  const option = FILTER_OPTIONS.find((opt) => opt.value === value);
  return option ? option.label : "📁 All Trips";
};

export const filterTrips = (trips, searchTerm, dateFilter) => {
  return trips.filter((trip) => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.location?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    const now = new Date();
    const tripDate = trip.startDate ? new Date(trip.startDate) : null;

    switch (dateFilter) {
      case "upcoming":
        return tripDate && tripDate > now;
      case "past":
        return tripDate && tripDate < now;
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return tripDate && tripDate > thirtyDaysAgo;
      default:
        return true;
    }
  });
};

/**
 * Plan and billing helpers
 */
export const getUserPlan = () => {
  const storedPlan = localStorage.getItem("userPlan");
  return storedPlan
    ? JSON.parse(storedPlan)
    : { plan: "free", billing: "monthly" };
};

export const getCurrentPlanConfig = () => {
  const userPlan = getUserPlan();
  const currentBilling = userPlan.billing;

  const config = { ...PLAN_CONFIGS[userPlan.plan] };

  // Update price based on billing cycle
  if (userPlan.plan === "pro") {
    config.price = currentBilling === "yearly" ? "$99.99" : "$9.99";
    config.billing = currentBilling === "yearly" ? "Yearly" : "Monthly";
  } else if (userPlan.plan === "family") {
    config.price = currentBilling === "yearly" ? "$199.99" : "$19.99";
    config.billing = currentBilling === "yearly" ? "Yearly" : "Monthly";
  }

  return config;
};

export const isPaidPlan = () => {
  const userPlan = getUserPlan();
  return userPlan.plan !== "free";
};

export const getExpiryDate = () => {
  const userPlan = getUserPlan();
  if (!isPaidPlan() || !userPlan.purchaseDate) return null;

  const purchase = new Date(userPlan.purchaseDate);
  const expiry = new Date(purchase);

  if (userPlan.billing === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  return expiry.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getPhotoUsagePercentage = (photosUsed, planType) => {
  const limits = {
    free: 500,
    pro: 10000,
    family: 50000,
    custom: 999999,
  };

  return Math.min((photosUsed / limits[planType]) * 100, 100);
};

/**
 * Responsive helpers
 */
export const isMobileDevice = () => window.innerWidth < 768;
export const isTabletDevice = () =>
  window.innerWidth >= 768 && window.innerWidth < 1024;
export const isDesktopDevice = () => window.innerWidth >= 1024;

export const shouldShowSidebar = () => {
  return window.innerWidth >= 1024;
};

/**
 * Navigation helpers
 */
export const getNavigationItemBadge = (
  itemId,
  pendingRequests,
  tripInvites,
  trips
) => {
  switch (itemId) {
    case "friends":
      return pendingRequests.length;
    case "trips":
      return trips.length;
    default:
      return 0;
  }
};

export const hasNotifications = (itemId, pendingRequests, tripInvites) => {
  switch (itemId) {
    case "friends":
      return pendingRequests && pendingRequests.length > 0;
    case "trips":
      return tripInvites && tripInvites.length > 0;
    default:
      return false;
  }
};

/**
 * Date and time helpers
 */
export const formatDate = (date) => {
  if (!date) return "Recently";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getRelativeTime = (date) => {
  if (!date) return "Recently";

  const now = new Date();
  const target = new Date(date?.toDate?.() || date);
  const diffMs = now - target;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * File upload helpers
 */
export const validateImageFiles = (files) => {
  const validFiles = files.filter((file) => file.type.startsWith("image/"));
  const hasInvalidFiles = validFiles.length !== files.length;

  return {
    validFiles,
    hasInvalidFiles,
    errorMessage: hasInvalidFiles ? "Only image files are allowed" : null,
  };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Animation and transition helpers
 */
export const smoothPageTransition = (callback, duration = 400) => {
  document.body.style.transition = "opacity 0.4s ease-out";
  document.body.style.opacity = "0";

  setTimeout(() => {
    if (callback) callback();
    document.body.style.opacity = "1";
  }, duration);
};

export const resetBodyStyles = () => {
  setTimeout(() => {
    document.body.style.opacity = "1";
    document.body.style.transform = "scale(1)";
  }, 100);
};

/**
 * Error handling helpers
 */
export const getFirebaseErrorMessage = (error) => {
  switch (error.code) {
    case "auth/requires-recent-login":
      return "For security reasons, please log out and log back in, then try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "permission-denied":
      return "You don't have permission to perform this action.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
};

/**
 * Local storage helpers
 */
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const setToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * URL and navigation helpers
 */
export const updateUrlParams = (params) => {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, "", url);
};

export const getUrlParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

/**
 * Validation helpers
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDeleteConfirmation = (input) => {
  return input.trim().toUpperCase() === "DELETE";
};

/**
 * Face profile helpers
 */
export const getProfileMethodDescription = (profile) => {
  if (!profile) return null;

  return profile?.metadata?.method === "guided"
    ? {
        title: "🎯 Smart Face Scan Active",
        description:
          "Your profile was created using our smart face scanning technology for maximum accuracy in photo recognition.",
      }
    : {
        title: "Photo Upload Profile Active",
        description:
          "Your profile was created from uploaded photos. Works great for photo recognition!",
      };
};

export const canOptimizeProfile = (profilePhotos) => {
  return profilePhotos && profilePhotos.length > 5;
};

/**
 * Notification helpers
 */
export const formatNotificationMessage = (notification) => {
  switch (notification.type) {
    case "friend_request":
      return `${
        notification.senderName || notification.senderEmail
      } wants to be your friend`;
    case "trip_invite":
      return `${notification.inviterName} invited you to "${notification.tripName}"`;
    case "trip_update":
      return `Trip "${notification.tripName}" has been updated`;
    default:
      return notification.message || "You have a new notification";
  }
};

export const getTotalNotificationCount = (pendingRequests, tripInvites) => {
  return (pendingRequests?.length || 0) + (tripInvites?.length || 0);
};
