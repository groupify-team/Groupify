// src/dashboard-area/features/settings/constants/settingsConstants.jsx
import {
  BellIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  MapIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// Settings sections configuration
export const SETTINGS_SECTIONS = {
  ACCOUNT: "account",
  NOTIFICATIONS: "notifications", 
  PRIVACY: "privacy",
  FACE_PROFILE: "faceProfile",
  SUBSCRIPTION: "subscription",
  DATA: "data",
};

// Subscription plans configuration with proper text
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "free",
    displayName: "Free",
    price: { monthly: 0, yearly: 0 },
    storage: "2GB",
    photos: "500",
    albums: "2",
    features: ["2GB storage", "500 photos", "2 albums", "Basic AI"],
    color: "gray",
    icon: "🆓",
  },
  PRO: {
    name: "pro",
    displayName: "Pro",
    price: { monthly: 9.99, yearly: 99.99 },
    storage: "50GB",
    photos: "10K",
    albums: "Unlimited",
    features: ["50GB storage", "10K photos", "Unlimited albums", "Advanced AI"],
    color: "indigo",
    icon: "⭐",
  },
  FAMILY: {
    name: "family",
    displayName: "Family",
    price: { monthly: 19.99, yearly: 199.99 },
    storage: "250GB",
    photos: "50K",
    albums: "Unlimited",
    features: ["250GB storage", "50K photos", "Unlimited sharing", "Premium AI"],
    color: "purple",
    icon: "👨‍👩‍👧‍👦",
  },
};

// Subscription text constants
export const SUBSCRIPTION_TEXT = {
  // Headers and titles
  CURRENT_PLAN: "Current Plan",
  UPGRADE_OPTIONS: "Upgrade Options",
  BILLING_OPTIONS: "Billing Options",
  USAGE_DETAILS: "Usage Details",
  BILLING_HISTORY: "Billing History",
  PLAN_MANAGEMENT: "Plan Management",
  
  // Plan features
  STORAGE: "Storage",
  PHOTOS: "Photos",
  PER_MONTH: "Per Month",
  PER_YEAR: "Per Year",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  
  // Actions
  UPGRADE_TO_PRO: "Upgrade to Pro - Get 20x More Storage",
  UPGRADE_TO_FAMILY: "Upgrade to Family - Perfect for families",
  SEE_WHAT_YOURE_MISSING: "See What You're Missing",
  PERFECT_FOR_INDIVIDUALS: "Perfect for individuals",
  PERFECT_FOR_FAMILIES: "Perfect for families",
  
  // Status
  FREE: "Free",
  ACTIVE: "Active",
  TRIAL: "Trial",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  
  // Usage
  STORAGE_USAGE: "Storage Usage",
  PHOTOS_USED: "Photos Used",
  ALBUMS_CREATED: "Albums Created",
  REMAINING: "remaining",
  USED: "used",
  OF: "of",
  BYTES: "Bytes",
  
  // Billing
  NEXT_BILLING: "Next Billing",
  LAST_PAYMENT: "Last Payment",
  PAYMENT_METHOD: "Payment Method",
  BILLING_ADDRESS: "Billing Address",
  
  // Messages
  UPGRADE_SUCCESS: "Successfully upgraded your plan!",
  DOWNGRADE_SUCCESS: "Successfully downgraded your plan!",
  CANCEL_SUCCESS: "Subscription cancelled successfully!",
  REACTIVATE_SUCCESS: "Subscription reactivated successfully!",
  
  // Errors
  UPGRADE_ERROR: "Failed to upgrade plan. Please try again.",
  CANCEL_ERROR: "Failed to cancel subscription. Please try again.",
  BILLING_ERROR: "Failed to load billing information.",
};

// Usage tracking text
export const USAGE_TEXT = {
  STORAGE_LIMIT_REACHED: "You've reached your storage limit",
  PHOTO_LIMIT_REACHED: "You've reached your photo limit",
  UPGRADE_RECOMMENDED: "Consider upgrading to continue",
  USAGE_WARNING: "You're approaching your plan limits",
  
  // Progress indicators
  LOW_USAGE: "You have plenty of space remaining",
  MEDIUM_USAGE: "You're using a good amount of your plan",
  HIGH_USAGE: "You're close to your plan limits",
  CRITICAL_USAGE: "Action required - upgrade soon",
};

// Plan comparison data
export const PLAN_COMPARISON = {
  features: [
    {
      name: "Storage",
      free: "2GB",
      pro: "50GB", 
      family: "250GB"
    },
    {
      name: "Photos",
      free: "500",
      pro: "10K",
      family: "50K"
    },
    {
      name: "Albums", 
      free: "2",
      pro: "Unlimited",
      family: "Unlimited"
    },
    {
      name: "AI Recognition",
      free: "Basic",
      pro: "Advanced", 
      family: "Premium"
    },
    {
      name: "Support",
      free: "Email",
      pro: "Priority",
      family: "Phone + Email"
    }
  ]
};

// Streamlined notification settings - only core app features
export const NOTIFICATION_SETTINGS = [
  {
    id: "emailNotifications",
    label: "Email Notifications",
    description: "Receive important updates via email",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
        <svg
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      </div>
    ),
    defaultChecked: true,
  },
  {
    id: "tripUpdates",
    label: "Trip Updates",
    description: "Get notified about trip activities and changes",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
        <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    defaultChecked: true,
  },
  {
    id: "photoRecognition",
    label: "Photo Recognition",
    description: "Notifications when you're tagged in photos",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
        <CameraIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    defaultChecked: true,
  },
];

// Streamlined privacy settings - core privacy controls
export const PRIVACY_SETTINGS = [
  {
    id: "publicProfile",
    label: "Public Profile",
    description: "Allow others to find and view your profile",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
        <UserCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    defaultChecked: true,
  },
  {
    id: "faceRecognition",
    label: "Face Recognition",
    description: "Enable face detection and tagging in photos",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center shadow-sm">
        <svg
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
            clipRule="evenodd"
          />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
      </div>
    ),
    defaultChecked: false, // Privacy-first approach
  },
  {
    id: "searchVisibility",
    label: "Search Visibility",
    description: "Allow others to find you in search results",
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
        <MagnifyingGlassIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    defaultChecked: true,
  },
];

// Default settings object for new users
export const DEFAULT_USER_SETTINGS = {
  notifications: {
    emailNotifications: true,
    tripUpdates: true,
    photoRecognition: true,
  },
  privacy: {
    publicProfile: true,
    faceRecognition: false,
    searchVisibility: true,
  },
  preferences: {
    theme: "system",
    language: "en",
  },
};

// Toast Messages for Settings
export const SETTINGS_TOAST_MESSAGES = {
  settingsUpdated: "Settings updated successfully!",
  settingsError: "Failed to update settings. Please try again.",
  profileUpdated: "Profile updated successfully!",
  profileError: "Failed to update profile. Please try again.",
  faceProfileDeleted: "🗑️ Face profile deleted successfully",
  faceProfileCreated: "✅ Face profile created successfully",
  faceProfileUpdated: "🔄 Face profile updated successfully",
  accountDeleted: "Account deleted successfully. Goodbye!",
  exportSuccess: "Data exported successfully!",
  exportError: "Failed to export data. Please try again.",
  backupSuccess: "Backup created successfully!",
  backupError: "Failed to create backup. Please try again.",
  subscriptionUpdated: "Subscription updated successfully!",
  subscriptionError: "Failed to update subscription. Please try again.",
};

// Error Messages for Settings
export const SETTINGS_ERROR_MESSAGES = {
  loadingSettings: "Failed to load settings",
  updatingSettings: "Failed to update settings",
  deletingAccount: "Failed to delete account. Please try again or contact support.",
  confirmDelete: "Please type 'DELETE' to confirm",
  requiresRecentLogin: "For security reasons, please log out and log back in, then try deleting your account again.",
  faceRecognitionDisabled: "Please enable Face Recognition in Privacy Settings first.",
  exportFailed: "Export failed. Please try again.",
  backupFailed: "Backup creation failed. Please try again.",
  subscriptionLoadFailed: "Failed to load subscription data",
  billingLoadFailed: "Failed to load billing information",
  usageLoadFailed: "Failed to load usage data",
};

// Settings Modal Types
export const SETTINGS_MODAL_TYPES = {
  EDIT_PROFILE: "editProfile",
  FACE_PROFILE: "faceProfile", 
  FACE_PROFILE_MANAGE: "faceProfileManage",
  DELETE_ACCOUNT: "deleteAccount",
  USAGE: "usage",
  BILLING_HISTORY: "billingHistory",
  PLAN_MANAGEMENT: "planManagement",
  EXPORT_DATA: "exportData",
  BACKUP_DATA: "backupData",
};

// Export data types
export const EXPORT_DATA_TYPES = {
  COMPLETE: "complete",
  TRIPS: "trips",
  PHOTOS: "photos", 
  FRIENDS: "friends",
};

// Settings animation durations
export const SETTINGS_ANIMATIONS = {
  toggleSwitch: 300,
  modalFade: 200,
  sectionSlide: 400,
};

// Helper functions for subscription text
export const getSubscriptionText = (key, fallback = "") => {
  return SUBSCRIPTION_TEXT[key] || fallback;
};

export const getPlanDisplayName = (planName) => {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.name === planName);
  return plan ? plan.displayName : planName.charAt(0).toUpperCase() + planName.slice(1);
};

export const getPlanFeatures = (planName) => {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.name === planName);
  return plan ? plan.features : [];
};

export const formatStorageDisplay = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};