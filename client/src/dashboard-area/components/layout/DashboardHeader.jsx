// DashboardHeader.jsx - FIXED VERSION with proper sticky positioning
import React, { useState, useRef, useEffect } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Try to import new hooks, fallback to basic functionality if they don't exist
let useDashboardLayout, useDashboardModals;
try {
  const layoutModule = require("@dashboard/hooks/useDashboardLayout");
  useDashboardLayout = layoutModule.useDashboardLayout;
} catch (e) {
  console.log("useDashboardLayout not available, using fallback");
}

try {
  const modalsModule = require("@dashboard/contexts/DashboardModalsContext");
  useDashboardModals = modalsModule.useDashboardModals;
} catch (e) {
  console.log("useDashboardModals not available, using fallback");
}

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
  const { userData, pendingRequests, tripInvites } = useDashboardData();

  // Try to use new layout system, fallback to props
  let layoutData = null;
  if (useDashboardLayout) {
    try {
      layoutData = useDashboardLayout();
    } catch (e) {
      console.log("Error using useDashboardLayout, falling back to props");
    }
  }

  // Extract layout data or use props as fallback
  const currentSidebarOpen = layoutData?.layout?.sidebarOpen ?? sidebarOpen;
  const currentIsMobile = layoutData?.layout?.isMobile ?? isMobile;
  const toggleSidebar = layoutData?.sidebar?.toggle ?? onSidebarToggle;
  const toggleNotificationsDropdown =
    layoutData?.dropdownActions?.toggleNotificationsDropdown;
  const notificationsDropdownOpen =
    layoutData?.dropdowns?.notificationsDropdownOpen;
  const navigateToSection = layoutData?.navigation?.navigateToSection;

  // Local state for when new hooks aren't available
  const [localNotificationsOpen, setLocalNotificationsOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  // Use new hook state or local state
  const notificationsOpen = notificationsDropdownOpen ?? localNotificationsOpen;
  const setNotificationsOpen =
    toggleNotificationsDropdown ?? setLocalNotificationsOpen;

  // Refs for outside click detection
  const notificationRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  const totalNotifications =
    (pendingRequests?.length || 0) + (tripInvites?.length || 0);

  // Close dropdowns when clicking outside (only for local state)
  useEffect(() => {
    if (toggleNotificationsDropdown) return; // Skip if using new system

    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setLocalNotificationsOpen(false);
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
  }, [toggleNotificationsDropdown]);

  const getWelcomeMessage = () => {
    const displayName = userData?.displayName || "User";
    return `Welcome back, ${displayName}!`;
  };

  const handleNotificationClick = () => {
    if (toggleNotificationsDropdown) {
      toggleNotificationsDropdown();
    } else {
      setLocalNotificationsOpen((prev) => !prev);
    }
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

  return (
    // 🔥 FIXED: Changed from 'sticky top-0' to 'fixed top-0 left-0 right-0'
    // This ensures the header is ALWAYS pinned to the top regardless of scroll
    <header
      className="fixed top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 z-50 transition-all duration-300"
      style={{
        left: !currentIsMobile && currentSidebarOpen ? "256px" : "0px",
        right: "0px",
      }}
    >
      {" "}
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
              onClick={() => navigateToSection && navigateToSection("trips")}
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

              {/* Notifications */}
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

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div
                    className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto transform transition-all duration-300 ease-out"
                    style={{
                      animation: "slideInFromTop 0.3s ease-out",
                      transformOrigin: "top right",
                    }}
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Notifications
                      </h3>
                      {totalNotifications === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No new notifications
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {/* Friend Requests */}
                          {pendingRequests?.map((request, index) => (
                            <div
                              key={`friend-${index}`}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    request.photoURL ||
                                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                                  }
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Friend request from{" "}
                                    {request.displayName || request.email}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Click to view in Friends section
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Trip Invitations */}
                          {tripInvites?.map((invite, index) => (
                            <div
                              key={`trip-${index}`}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                  <CameraIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Trip invitation: {invite.tripName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    From {invite.inviterName}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Avatar with Mobile Menu */}
            <div className="relative" ref={mobileUserMenuRef}>
              <img
                src={
                  userData?.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
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
                        src={
                          userData?.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
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
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </header>
  );
};

export default DashboardHeader;
