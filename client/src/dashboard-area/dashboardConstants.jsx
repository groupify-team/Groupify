// Dashboard Constants and Configuration
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  CameraIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PlusIcon,
  UserCircleIcon,
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

// Notification Settings
export const NOTIFICATION_SETTINGS = [
  {
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
    label: "Email Notifications",
    defaultChecked: true,
  },
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
        <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    label: "Trip Updates",
    defaultChecked: true,
  },
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
        <UserGroupIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    label: "Friend Requests",
    defaultChecked: false,
  },
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
        <CameraIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    label: "Photo Recognition",
    defaultChecked: true,
  },
];

// Privacy Settings
export const PRIVACY_SETTINGS = [
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
        <UserCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    label: "Public Profile",
    defaultChecked: true,
  },
  {
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
    label: "Face Recognition",
    defaultChecked: false,
  },
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
        <MagnifyingGlassIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
      </div>
    ),
    label: "Search Visibility",
    defaultChecked: true,
  },
  {
    icon: (
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
        <svg
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    ),
    label: "Data Sharing",
    defaultChecked: false,
  },
];

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

// Toast Messages
export const TOAST_MESSAGES = {
  tripCreated: "Trip created successfully!",
  friendRequestSent: "Friend request sent successfully!",
  friendRequestAccepted: "Friend request accepted",
  friendRequestDeclined: "Friend request declined",
  profileDeleted: "🗑️ Face profile deleted successfully",
  accountDeleted: "Account deleted successfully. Goodbye!",
  planCanceled:
    "Plan canceled successfully! You've been downgraded to the free plan.",
  tripInviteAccepted: "Trip invitation accepted",
  tripInviteDeclined: "Trip invitation declined",
};

// Error Messages
export const ERROR_MESSAGES = {
  loadingDashboard: "Failed to load dashboard data",
  sendingFriendRequest: "Failed to send friend request",
  acceptingFriendRequest: "Failed to accept friend request",
  decliningFriendRequest: "Failed to decline friend request",
  deletingAccount:
    "Failed to delete account. Please try again or contact support.",
  tripLimitReached: (current, max) =>
    `Trip limit reached! You can only create ${max} trips. You currently have ${current} trips.`,
  confirmDelete: "Please type 'DELETE' to confirm",
  requiresRecentLogin:
    "For security reasons, please log out and log back in, then try deleting your account again.",
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
