// DashboardHeader.jsx - ENHANCED VERSION with current user presence indicator
import React, { useState, useRef, useEffect } from "react";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useUserPresence } from "@shared/hooks/useUserPresence";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  UserIcon,
  ChevronDownIcon,
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

const StatusDropdown = ({ currentUser, isOpen, onClose }) => {
  const currentUserPresence = useUserPresence(currentUser?.uid);

  const handleStatusChange = async (newStatus) => {
    try {
      const { PresenceService } = await import(
        "@shared/services/presence/PresenceService"
      );

      if (newStatus === "offline") {
        await PresenceService.setUserOffline(currentUser.uid);
      } else {
        await PresenceService.updateUserStatus(currentUser.uid, newStatus);
      }
      onClose();
    } catch (error) {
      console.error("❌ Error changing status:", error);
    }
  };

  const statusOptions = [
    {
      status: "online",
      label: "Online",
      color: "bg-emerald-500",
      description: "Available for chat",
    },
    {
      status: "away",
      label: "Away",
      color: "bg-amber-500",
      description: "Not at my desk",
    },
    {
      status: "busy",
      label: "Busy",
      color: "bg-red-500",
      description: "Do not disturb",
    },
    {
      status: "offline",
      label: "Appear Offline",
      color: "bg-gray-400",
      description: "Hidden from others",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all duration-300 ease-out animate-slide-in-scale"
      style={{
        transformOrigin: "top right",
        right: "-8px",
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <h3 className="text-white font-semibold text-sm">Set your status</h3>
        <p className="text-white/70 text-xs">
          Current:{" "}
          {currentUserPresence.loading
            ? "Loading..."
            : currentUserPresence.status?.charAt(0).toUpperCase() +
                currentUserPresence.status?.slice(1) || "Offline"}
        </p>
      </div>

      {/* Status Options */}
      <div className="p-2 space-y-1">
        {statusOptions.map((option) => (
          <button
            key={option.status}
            onClick={() => handleStatusChange(option.status)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm ${
              currentUserPresence.status === option.status
                ? "bg-gray-100 dark:bg-gray-700"
                : ""
            }`}
          >
            <div
              className={`w-3 h-3 ${option.color} rounded-full ${
                option.status === "online" ? "animate-pulse" : ""
              }`}
            ></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </div>
            {currentUserPresence.status === option.status && (
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const DashboardHeader = ({
  onSettingsClick,
  onLogoutClick,
  onSidebarToggle,
  sidebarOpen,
  isMobile,
}) => {
  const { userData } = useDashboardData();
  const { eventInvitations } = useEventContext();
  const { pendingRequests } = useFriendsContext();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const currentUserPresence = useUserPresence(userData?.uid);
  const currentSidebarOpen = sidebarOpen;
  const currentIsMobile = isMobile;
  const toggleSidebar = onSidebarToggle;
  const notificationRef = useRef(null);
  const mobileUserMenuRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const totalNotifications =
    (pendingRequests?.length || 0) + (eventInvitations?.length || 0);

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
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getWelcomeMessage = () => {
    const displayName = userData?.displayName || "User";
    return `Welcome back, ${displayName}!`;
  };

  const getCurrentUserStatusConfig = () => {
    if (currentUserPresence.loading) {
      return {
        color: "bg-gray-400",
        ring: "ring-gray-200 dark:ring-gray-700",
        pulse: "animate-pulse",
        title: "Loading status...",
      };
    }

    if (currentUserPresence.isOnline) {
      switch (currentUserPresence.status) {
        case "online":
          return {
            color: "bg-emerald-500",
            ring: "ring-emerald-200 dark:ring-emerald-800",
            pulse: "animate-pulse",
            title: "Online",
          };
        case "away":
          return {
            color: "bg-amber-500",
            ring: "ring-amber-200 dark:ring-amber-800",
            pulse: "",
            title: "Away",
          };
        case "busy":
          return {
            color: "bg-red-500",
            ring: "ring-red-200 dark:ring-red-800",
            pulse: "",
            title: "Busy",
          };
        default:
          return {
            color: "bg-emerald-500",
            ring: "ring-emerald-200 dark:ring-emerald-800",
            pulse: "animate-pulse",
            title: "Online",
          };
      }
    }

    return {
      color: "bg-gray-400",
      ring: "ring-gray-200 dark:ring-gray-700",
      pulse: "",
      title: "Offline",
    };
  };
  const currentUserStatusConfig = getCurrentUserStatusConfig();
  const handleNotificationClick = () => {
    setNotificationsOpen((prev) => {
      const newState = !prev;
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
          <div className="flex items-center gap-2">
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

                {/* FIXED: Use the actual NotificationsDropdown component with proper positioning */}
                {notificationsOpen && (
                  <div style={{ transformOrigin: "top right", right: "-8px" }}>
                    <NotificationsDropdown />
                  </div>
                )}
              </div>
            </div>

            {/* MERGED: Single User Profile for both Mobile and Desktop */}
            <div className="flex items-center gap-2">
              <div
                className="relative"
                ref={currentIsMobile ? mobileUserMenuRef : statusDropdownRef}
              >
                {/* Single Profile Button - handles both mobile menu and desktop status */}
                <button
                  onClick={() => {
                    if (currentIsMobile) {
                      setMobileUserMenuOpen(!mobileUserMenuOpen);
                    } else {
                      setStatusDropdownOpen(!statusDropdownOpen);
                    }
                  }}
                  className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors group"
                  title={currentIsMobile ? "Open menu" : "Change status"}
                >
                  {/* Profile Picture with Presence Circle */}
                  <div className="relative">
                    <img
                      src={getProfileImageUrl(userData)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-all duration-200"
                      onError={(e) => {
                        e.target.src =
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
                      }}
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${currentUserStatusConfig.color} border border-white dark:border-gray-800 rounded-full ${currentUserStatusConfig.pulse} shadow-sm`}
                      title={currentUserStatusConfig.title}
                    ></div>
                  </div>

                  {/* Arrow - show on ALL screen sizes */}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200" />
                </button>

                {/* Status Dropdown - Desktop only */}
                {!currentIsMobile && (
                  <StatusDropdown
                    currentUser={userData}
                    isOpen={statusDropdownOpen}
                    onClose={() => setStatusDropdownOpen(false)}
                  />
                )}

                {/* Mobile User Menu - UPDATED with proper positioning and arrow */}
                {mobileUserMenuOpen && currentIsMobile && (
                  <div
                    className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all duration-300 ease-out"
                    style={{
                      transformOrigin: "top right",
                      right: "-8px", // Align to right edge
                    }}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                      <h3 className="text-white font-semibold text-sm">
                        Set your status
                      </h3>
                      <p className="text-white/70 text-xs">
                        Current:{" "}
                        {currentUserPresence.loading
                          ? "Loading..."
                          : currentUserPresence.status
                              ?.charAt(0)
                              .toUpperCase() +
                              currentUserPresence.status?.slice(1) || "Offline"}
                      </p>
                    </div>

                    {/* Status Options - Same as Desktop */}
                    <div className="p-2 space-y-1">
                      {[
                        {
                          status: "online",
                          label: "Online",
                          color: "bg-emerald-500",
                          description: "Available for chat",
                        },
                        {
                          status: "away",
                          label: "Away",
                          color: "bg-amber-500",
                          description: "Not at my desk",
                        },
                        {
                          status: "busy",
                          label: "Busy",
                          color: "bg-red-500",
                          description: "Do not disturb",
                        },
                        {
                          status: "offline",
                          label: "Appear Offline",
                          color: "bg-gray-400",
                          description: "Hidden from others",
                        },
                      ].map((option) => (
                        <button
                          key={option.status}
                          onClick={async () => {
                            try {
                              const { PresenceService } = await import(
                                "@shared/services/presence/PresenceService"
                              );

                              if (option.status === "offline") {
                                await PresenceService.setUserOffline(
                                  userData.uid
                                );
                              } else {
                                await PresenceService.updateUserStatus(
                                  userData.uid,
                                  option.status
                                );
                              }
                              setMobileUserMenuOpen(false);
                            } catch (error) {
                              console.error("❌ Error changing status:", error);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm ${
                            currentUserPresence.status === option.status
                              ? "bg-gray-100 dark:bg-gray-700"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-3 h-3 ${option.color} rounded-full ${
                              option.status === "online" ? "animate-pulse" : ""
                            }`}
                          ></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {option.description}
                            </p>
                          </div>
                          {currentUserPresence.status === option.status && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          )}
                        </button>
                      ))}

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      {/* Logout Button */}
                      {onLogoutClick && (
                        <button
                          onClick={() => {
                            setMobileUserMenuOpen(false);
                            onLogoutClick();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          <div className="flex-1">
                            <p className="font-medium">Logout</p>
                            <p className="text-xs text-red-500 dark:text-red-400">
                              Sign out of your account
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
