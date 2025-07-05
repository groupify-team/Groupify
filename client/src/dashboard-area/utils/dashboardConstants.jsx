// Dashboard Constants and Configuration
import {
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  MapIcon,
  PlusIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
  UserIcon,
  CogIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Navigation Configuration
export const NAVIGATION_ITEMS = [
  {
    id: "trips",
    name: "My Trips",
    icon: MapIcon,
    hasDropdown: true,
  },
  {
    id: "friends",
    name: "Friends",
    icon: UserGroupIcon,
    hasNotification: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: Cog6ToothIcon,
  },
];

// Filter Options
export const FILTER_OPTIONS = [
  { value: "all", label: "📁 All Trips" },
  { value: "upcoming", label: "📅 Upcoming" },
  { value: "recent", label: "🕒 Recent" },
  { value: "past", label: "✅ Past" },
];

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
    features: ["Basic AI recognition", "2 trip albums", "Share with 3 friends"],
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

// Responsive Breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

// Default State Values
export const DEFAULT_STATE = {
  visibleTripsCount: 5,
  searchTerm: "",
  dateFilter: "all",
  activeSection: "trips",
  currentView: "home",
  sidebarOpen: window.innerWidth >= 1024,
  isMobile: window.innerWidth < 768,
};

// Animation Durations (in ms)
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  dropdown: 700,
};

// Toast Messages (Dashboard-specific, settings toasts moved to settingsConstants)
export const TOAST_MESSAGES = {
  tripCreated: "Trip created successfully!",
  friendRequestSent: "Friend request sent successfully!",
  friendRequestAccepted: "Friend request accepted",
  friendRequestDeclined: "Friend request declined",
  tripInviteAccepted: "Trip invitation accepted",
  tripInviteDeclined: "Trip invitation declined",
};

// Error Messages (Dashboard-specific, settings errors moved to settingsConstants)
export const ERROR_MESSAGES = {
  loadingDashboard: "Failed to load dashboard data",
  sendingFriendRequest: "Failed to send friend request",
  acceptingFriendRequest: "Failed to accept friend request",
  decliningFriendRequest: "Failed to decline friend request",
  tripLimitReached: (current, max) =>
    `Trip limit reached! You can only create ${max} trips. You currently have ${current} trips.`,
};

// User Menu Items (Mobile)
export const USER_MENU_ITEMS = [
  {
    id: "profile",
    label: "View Profile",
    icon: UserIcon,
    action: "viewProfile",
  },
  {
    id: "logout",
    label: "Logout",
    icon: ArrowRightOnRectangleIcon,
    action: "logout",
    className:
      "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  },
];

// Bottom Navigation Items (Mobile)
export const BOTTOM_NAV_ITEMS = [
  { id: "trips", name: "Trips", icon: MapIcon },
  { id: "friends", name: "Friends", icon: UserGroupIcon },
  { id: "settings", name: "Settings", icon: Cog6ToothIcon },
];