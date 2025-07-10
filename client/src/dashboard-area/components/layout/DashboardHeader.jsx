// DashboardHeader.jsx - FIXED VERSION with working notifications dropdown
import React, { useState, useRef, useEffect } from "react";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Import the real-time contexts
import { useEventContext } from "@shared/contexts/EventContext";
import { useFriendsContext } from "@shared/contexts/FriendsContext";

// Import the actual NotificationsDropdown component
import NotificationsDropdown from "@dashboard/components/widgets/NotificationsDropdown";

// Accessibility icon component
const AccessibilityIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="11"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path d="M12 3C13.1 3 14 3.9 14 5C14 6.1 13.1 7 12 7C10.9 7 10 6.1 10 5C10 3.9 10.9 3 12 3ZM20 10V8L13.5 8.5C13.1 8.4 12.6 8.2 12.1 8.1L12 8L11.9 8.1C11.4 8.2 10.9 8.4 10.5 8.5L4 8V10L10.5 10.5L8.5 17.5C8.4 17.9 8.6 18.4 9 18.5C9.4 18.6 9.9 18.4 10 18L12 11.5L14 18C14.1 18.4 14.6 18.6 15 18.5C15.4 18.4 15.6 17.9 15.5 17.5L13.5 10.5L20 10Z" />
  </svg>
);

const DashboardHeader = ({
  onSettingsClick,
  onLogoutClick,
  onSidebarToggle,
  sidebarOpen,
  isMobile,
}) => {
  const { userData } = useDashboardData();

  // FIXED: Use real-time data from contexts instead of useDashboardData
  const { eventInvitations } = useEventContext();
  const { pendingRequests } = useFriendsContext();

  // Local state for notifications and user menu
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  // Use props directly
  const currentSidebarOpen = sidebarOpen;
  const currentIsMobile = isMobile;
  const toggleSidebar = onSidebarToggle;

  // Refs for outside click detection
  const notificationRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  // FIXED: Calculate total notifications from real-time contexts
  const totalNotifications = (pendingRequests?.length || 0) + (eventInvitations?.length || 0);

  console.log("🔔 DashboardHeader: Real-time notification data:", {
    pendingRequests: pendingRequests?.length || 0,
    eventInvitations: eventInvitations?.length || 0,
    totalNotifications,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(event.target)
      ) {
        setMobileUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getWelcomeMessage = () => {
    const displayName = userData?.displayName || "User";
    return `Welcome back, ${displayName}!`;
  };

  // FIXED: Handle notification click properly
  const handleNotificationClick = () => {
    console.log("🔔 DashboardHeader: Notification bell clicked");
    setNotificationsOpen((prev) => {
      const newState = !prev;
      console.log("🔔 DashboardHeader: Notifications dropdown", newState ? "opened" : "closed");
      return newState;
    });
  };

  const handleSidebarToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    }
  };

  const shouldShowCenterLogo = () => {
    if (typeof window === "undefined") return false;
    return (
      !currentSidebarOpen &&
      window.innerWidth >= 640 &&
      window.innerWidth < 1024
    );
  };

  // Helper function to get the correct profile image URL
  const getProfileImageUrl = (user) => {
    return (
      user?.profilePicture ||
      user?.photoURL ||
      user?.profileImage ||
      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
    );
  };

  return (
    <header
      className="fixed top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 z-50 transition-all duration-300"
      style={{
        left: !currentIsMobile && currentSidebarOpen ? "256px" : "0px",
        right: "0px",
      }}
    >
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14 w-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle - Desktop Only */}
            {!currentIsMobile && toggleSidebar && (
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={currentSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Welcome Message - Desktop */}
            <div className="hidden sm:block lg:block">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getWelcomeMessage()}
              </h2>
            </div>

            {/* Mobile Logo - Shows when welcome message is hidden */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Groupify
              </span>
            </div>
          </div>

          {/* Center - Logo for medium screens when sidebar is closed */}
          {shouldShowCenterLogo() && (
            <div
              className="hidden sm:flex lg:hidden items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              onClick={() => (window.location.href = "/dashboard/events")}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Groupify
              </span>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Accessibility & Notifications */}
            <div className="flex items-center gap-2">
              {/* Accessibility Button */}
              {onSettingsClick && (
                <button
                  onClick={() => {
                    onSettingsClick();
                  }}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Open accessibility settings"
                >
                  <AccessibilityIcon className="w-6 h-6" />
                </button>
              )}

              {/* FIXED: Notifications with proper dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={handleNotificationClick}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Open notifications"
                >
                  <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  )}
                </button>

                {/* FIXED: Use the actual NotificationsDropdown component */}
                {notificationsOpen && <NotificationsDropdown />}
              </div>
            </div>

            {/* User Avatar with Mobile Menu */}
            <div className="relative" ref={mobileUserMenuRef}>
              <img
                src={getProfileImageUrl(userData)}
                alt="Profile"
                onClick={() => {
                  if (currentIsMobile) {
                    setMobileUserMenuOpen((prev) => !prev);
                  }
                }}
                className={`w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
                  currentIsMobile
                    ? "cursor-pointer hover:ring-2 hover:ring-indigo-500"
                    : "cursor-default"
                }`}
                onError={(e) => {
                  e.target.src = "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
                }}
              />

              {/* Mobile User Menu */}
              {mobileUserMenuOpen && currentIsMobile && (
                <div
                  className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all duration-300 ease-out"
                  style={{
                    animation: "slideInFromTop 0.3s ease-out",
                    transformOrigin: "top right",
                  }}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getProfileImageUrl(userData)}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                        onError={(e) => {
                          e.target.src = "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {userData?.displayName || "User"}
                        </p>
                        <p className="text-white/70 text-xs truncate">
                          {userData?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setMobileUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>

                    {/* Settings in mobile menu */}
                    {onSettingsClick && (
                      <button
                        onClick={() => {
                          setMobileUserMenuOpen(false);
                          onSettingsClick();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        <AccessibilityIcon className="w-4 h-4" />
                        <span>Accessibility</span>
                      </button>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    {/* Logout Button */}
                    {onLogoutClick && (
                      <button
                        onClick={() => {
                          setMobileUserMenuOpen(false);
                          onLogoutClick();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;