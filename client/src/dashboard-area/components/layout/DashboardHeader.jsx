// DashboardHeader.jsx - Complete simple solution following PublicHeader pattern
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  CogIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { useDashboardData } from "@dashboard/hooks/useDashboardData";

const DashboardHeader = ({
  onSettingsClick,
  onLogoutClick,
  onSidebarToggle,
  sidebarOpen,
  isMobile,
}) => {
  const { userData, pendingRequests, tripInvites } = useDashboardData();

  // Simple states for dropdowns
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  // Refs for outside click detection
  const notificationRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  const totalNotifications =
    (pendingRequests?.length || 0) + (tripInvites?.length || 0);

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

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14 w-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle - Desktop Only - Same pattern as PublicHeader */}
            {!isMobile && onSidebarToggle && (
              <button
                onClick={() => {
                  console.log("🎯 Sidebar button clicked!");
                  onSidebarToggle();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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
          {(!sidebarOpen ||
            (window.innerWidth >= 640 && window.innerWidth < 1024)) && (
            <div className="hidden sm:flex lg:hidden items-center gap-2">
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
            {/* Settings Button - Same pattern as PublicHeader */}
            {onSettingsClick && (
              <button
                onClick={() => {
                  console.log("🎯 Settings button clicked!");
                  onSettingsClick();
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open accessibility and settings"
              >
                <CogIcon className="w-5 h-5" />
              </button>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  console.log("🎯 Notifications button clicked!");
                  setNotificationsOpen((prev) => !prev);
                }}
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
                <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
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
                            key={index}
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
                            key={index}
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

            {/* User Avatar with Mobile Menu */}
            <div className="relative" ref={mobileUserMenuRef}>
              <img
                src={
                  userData?.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="Profile"
                onClick={() => {
                  if (isMobile) {
                    console.log("🎯 Mobile user menu clicked!");
                    setMobileUserMenuOpen((prev) => !prev);
                  }
                }}
                className={`w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
                  isMobile
                    ? "cursor-pointer hover:ring-2 hover:ring-indigo-500"
                    : "cursor-default"
                }`}
              />

              {/* Mobile User Menu */}
              {mobileUserMenuOpen && isMobile && (
                <div className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
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
                        console.log("🎯 View Profile clicked!");
                        setMobileUserMenuOpen(false);
                        // Add profile view logic here if needed
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
                          console.log("🎯 Settings from mobile menu clicked!");
                          setMobileUserMenuOpen(false);
                          onSettingsClick();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        <CogIcon className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    {/* Logout Button */}
                    {onLogoutClick && (
                      <button
                        onClick={() => {
                          console.log("🎯 Logout clicked!");
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
