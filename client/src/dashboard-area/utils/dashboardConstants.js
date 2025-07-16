// src/dashboard-area/utils/dashboardConstants.js - UPDATED
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MapIcon,
  UserPlusIcon,
  UserIcon,
  CogIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Import shared constants
import { BREAKPOINTS, ANIMATIONS } from "@/shared/constants/ui";
import { TOAST_MESSAGES, ERROR_MESSAGES } from "@/shared/constants/messages";

// UPDATED Navigation Configuration - Added Profile section
export const NAVIGATION_ITEMS = [
  {
    id: "events",
    name: "My events",
    icon: MapIcon,
    href: "/dashboard/events",
    description: "View and manage your travel memories",
  },
  {
    id: "friends",
    name: "Friends",
    icon: UserPlusIcon,
    href: "/dashboard/friends",
    description: "Manage your friends and friend requests",
  },
  {
    id: "profile",
    name: "Profile",
    icon: UserIcon,
    href: "/dashboard/profile",
    description: "Manage your account and face recognition profile",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Cog6ToothIcon,
    href: "/dashboard/settings",
    description: "Configure billing, data, and advanced preferences",
  },
];

// Filter Options
export const FILTER_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "recent", label: "Recent" },
  { value: "favorites", label: "Favorites" },
  { value: "shared", label: "Shared" },
];

// Default Dashboard State
export const DEFAULT_STATE = {
  currentView: "events",
  selectedEvent: null,
  filterOption: "all",
  searchQuery: "",
  showCreateModal: false,
  showJoinModal: false,
  loading: false,
  error: null,
};

// UPDATED User Menu Items - Added Profile
export const USER_MENU_ITEMS = [
  {
    id: "profile",
    name: "Profile",
    icon: UserIcon,
    href: "/dashboard/profile",
  },
  {
    id: "settings",
    name: "Settings",
    icon: CogIcon,
    href: "/dashboard/settings",
  },
  {
    id: "billing",
    name: "Billing",
    icon: SparklesIcon,
    href: "/dashboard/billing",
  },
  {
    id: "logout",
    name: "Sign Out",
    icon: ArrowRightOnRectangleIcon,
    action: "logout",
  },
];

// UPDATED Bottom Navigation Items (Mobile) - Added Profile
export const BOTTOM_NAV_ITEMS = [
  { id: "events", name: "Events", icon: MapIcon },
  { id: "friends", name: "Friends", icon: UserPlusIcon },
  { id: "profile", name: "Profile", icon: UserIcon },
  { id: "settings", name: "Settings", icon: Cog6ToothIcon },
];

// Re-export shared constants with dashboard-specific names
export {
  TOAST_MESSAGES as SHARED_TOAST_MESSAGES,
  ERROR_MESSAGES as SHARED_ERROR_MESSAGES,
  BREAKPOINTS,
  ANIMATIONS,
};
export { PLAN_CONFIGS } from "@/shared/constants/plans";
