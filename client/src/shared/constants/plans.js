// Plan Configurations
export const PLAN_CONFIGS = {
  free: {
    name: "Free Plan",
    icon: "F",
    gradient: "from-indigo-500 to-purple-600",
    storage: "2GB",
    photos: "30", // FIXED: Updated to match usePlanLimits.jsx
    price: "$0",
    billing: "Forever",
    features: ["Basic AI recognition", "5 event albums", "Share with 8 friends"], // FIXED: Updated counts
  },
  premium: { // FIXED: Added missing premium plan
    name: "Premium Plan",
    icon: "P",
    gradient: "from-blue-500 to-indigo-600",
    storage: "50GB",
    photos: "200",
    price: "$9.99",
    billing: "per month",
    features: [
      "Advanced AI recognition",
      "50 events",
      "Share with 20 friends",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro Plan",
    icon: "P",
    gradient: "from-blue-500 to-indigo-600",
    storage: "500GB", // FIXED: Updated to match usePlanLimits.jsx
    photos: "unlimited", // FIXED: Updated to match usePlanLimits.jsx
    features: [
      "Advanced AI recognition",
      "Unlimited albums",
      "Unlimited sharing",
      "Priority support",
    ],
  },
  enterprise: { // FIXED: Added missing enterprise plan
    name: "Enterprise Plan",
    icon: "E",
    gradient: "from-purple-500 to-pink-600",
    storage: "unlimited",
    photos: "unlimited",
    features: [
      "Premium AI recognition",
      "Unlimited albums",
      "Unlimited sharing",
      "24/7 support",
      "Enterprise management",
    ],
  },
};

// Plan Types
export const PLAN_TYPES = {
  FREE: "free",
  PREMIUM: "premium", // FIXED: Added premium
  PRO: "pro",
  ENTERPRISE: "enterprise", // FIXED: Added enterprise
};

// Billing Cycles
export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

// Plan Limits - FIXED: Updated to match usePlanLimits.jsx exactly
export const PLAN_LIMITS = {
  free: {
    events: 5, // FIXED: Changed from 2 to 5
    photosPerEvent: 30, // FIXED: Changed from photos: 500 to photosPerEvent: 30
    membersPerEvent: 8, // FIXED: Changed from friends: 3 to membersPerEvent: 8
    storageGB: 2, // FIXED: Changed from storage bytes to GB
  },
  premium: { // FIXED: Added premium plan
    events: 50,
    photosPerEvent: 200,
    membersPerEvent: 20,
    storageGB: 50,
  },
  pro: {
    events: "unlimited", // FIXED: Changed from 50 to unlimited
    photosPerEvent: "unlimited", // FIXED: Changed from photos: 10000 to unlimited
    membersPerEvent: "unlimited", // FIXED: Changed from friends: 20 to unlimited
    storageGB: 500, // FIXED: Changed from 250GB to 500GB
  },
  enterprise: { // FIXED: Added enterprise plan
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
    storageGB: "unlimited",
  },
};