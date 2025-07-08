// Plan Configurations
export const PLAN_CONFIGS = {
  free: {
    name: "Free Plan",
    icon: "F",
    gradient: "from-indigo-500 to-purple-600",
    storage: "2GB",
    photos: "500",
    price: "$0",
    billing: "Forever",
    features: ["Basic AI recognition", "2 event albums", "Share with 3 friends"],
  },
  pro: {
    name: "Pro Plan",
    icon: "P",
    gradient: "from-blue-500 to-indigo-600",
    storage: "50GB",
    photos: "10,000",
    features: [
      "Advanced AI recognition",
      "Unlimited albums",
      "Share with 20 friends",
      "Priority support",
    ],
  },
  family: {
    name: "Family Plan",
    icon: "F",
    gradient: "from-purple-500 to-pink-600",
    storage: "250GB",
    photos: "50,000",
    features: [
      "Premium AI recognition",
      "Unlimited albums",
      "Unlimited sharing",
      "24/7 support",
      "Family management",
    ],
  },
};

// Plan Types
export const PLAN_TYPES = {
  FREE: "free",
  PRO: "pro",
  FAMILY: "family",
};

// Billing Cycles
export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

// Plan Limits
export const PLAN_LIMITS = {
  free: {
    events: 2,
    friends: 3,
    storage: 2 * 1024 * 1024 * 1024, // 2GB in bytes
    photos: 500,
  },
  pro: {
    events: 50,
    friends: 20,
    storage: 50 * 1024 * 1024 * 1024, // 50GB in bytes
    photos: 10000,
  },
  family: {
    events: -1, // unlimited
    friends: -1, // unlimited
    storage: 250 * 1024 * 1024 * 1024, // 250GB in bytes
    photos: 50000,
  },
};
