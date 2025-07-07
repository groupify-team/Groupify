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

// Import shared constants
import { BREAKPOINTS, ANIMATIONS } from "@/shared/constants/ui";
import { TOAST_MESSAGES, ERROR_MESSAGES } from "@/shared/constants/messages";

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
  { value: "all", label: "🗂️ All Trips" },
  { value: "upcoming", label: "🚀 Upcoming" },
  { value: "recent", label: "📅 Recent" },
  { value: "past", label: "📜 Past" },
];

// Default State Values
export const DEFAULT_STATE = {
  visibleTripsCount: 5,
  searchTerm: "",
  dateFilter: "all",
  activeSection: "trips",
  currentView: "home",
  sidebarOpen: window.innerWidth >= BREAKPOINTS.desktop,
  isMobile: window.innerWidth < BREAKPOINTS.mobile,
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

// Re-export shared constants for convenience
export { BREAKPOINTS, ANIMATIONS } from "@/shared/constants/ui";
export {
  TOAST_MESSAGES as SHARED_TOAST_MESSAGES,
  ERROR_MESSAGES as SHARED_ERROR_MESSAGES,
} from "@/shared/constants/messages";
export { PLAN_CONFIGS } from "@/shared/constants/plans";
