// DashboardHeader.jsx - Dashboard header with navigation and notifications
import React from "react";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  CogIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";

const DashboardHeader = () => {
  const {
    layout: { currentView, isMobile, sidebarOpen },
    dropdowns: { notificationsDropdownOpen, showMobileUserMenu },
    refs: { notificationRef, mobileUserMenuRef },
    sidebar: { toggle: toggleSidebar },
    dropdownActions: { toggleNotificationsDropdown },
    mobile: { toggleUserMenu, closeUserMenu },
    navigation: { navigateToSection },
  } = useDashboardLayout();

  const { userData, pendingRequests, tripInvites } = useDashboardData();

  // Simple fallback functions for modals that don't exist yet
  const openSettingsModal = () => console.log("Settings modal not implemented yet");
  const openLogoutModal = () => console.log("Logout modal not implemented yet");

  const totalNotifications = (pendingRequests?.length || 0) + (tripInvites?.length || 0);

  const getWelcomeMessage = () => {
    if (currentView === "trip") {
      return "Trip Details";
    }

    const displayName = userData?.displayName || "User";
    return `Welcome back, ${displayName}!`;
  };

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14 w-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle - Desktop */}
            <button
              onClick={() => {
                console.log("🔁 Desktop toggle clicked");
                toggleSidebar();
              }}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Mobile Menu Button - Tablet/Mobile */}
            {isMobile && (
              <button
                onClick={() => {
                  console.log("📱 Mobile toggle clicked");
                  toggleSidebar();
                }}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Welcome Message - Desktop */}
            <div className="hidden sm:block lg:block">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getWelcomeMessage()}
              </h2>
            </div>

            {/* Mobile Logo - Shows when welcome message is hidden */}
            <button
              onClick={() => {
                navigateToSection("trips");
              }}
              className="sm:hidden flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Groupify
              </span>
            </button>
          </div>

          {/* Center - Logo for medium screens when sidebar is closed */}
          {(!sidebarOpen && window.innerWidth >= 640 && window.innerWidth < 1024) && (
            <button
              onClick={() => navigateToSection("trips")}
              className="hidden sm:flex lg:hidden items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Groupify
              </span>
            </button>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotificationsDropdown}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalNotifications > 9 ? "9+" : totalNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Notifications
                    </h3>
                    {totalNotifications === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No new notifications
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {pendingRequests?.map((request) => (
                          <div key={request.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-sm text-gray-900 dark:text-white">
                              Friend request from {request.displayName || request.email}
                            </p>
                          </div>
                        ))}
                        {tripInvites?.map((invite) => (
                          <div key={invite.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-sm text-gray-900 dark:text-white">
                              Trip invitation: {invite.tripName}
                            </p>
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
                    toggleUserMenu();
                  }
                }}
                className={`w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
                  isMobile
                    ? "cursor-pointer hover:ring-2 hover:ring-indigo-500"
                    : "cursor-default"
                }`}
              />

              {/* Mobile User Menu */}
              {showMobileUserMenu && isMobile && (
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
                        closeUserMenu();
                        // Add profile view logic here if needed
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={() => {
                        closeUserMenu();
                        console.log("Logout not implemented yet");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
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