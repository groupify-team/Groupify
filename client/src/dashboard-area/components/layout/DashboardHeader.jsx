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
import { useDashboardModals } from "@dashboard/hooks/useDashboardModals";
import { useDashboardNavigation } from "@dashboard/hooks/useDashboardNavigation";

import NotificationsDropdown from "@dashboard/components/widgets/NotificationsDropdown";
import { getTotalNotificationCount } from "@dashboard/utils/dashboardHelpers";

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

  const {
    settings: { open: openSettingsModal },
    logout: { open: openLogoutModal },
  } = useDashboardModals();

  const { breadcrumbs } = useDashboardNavigation();

  const totalNotifications = getTotalNotificationCount(
    pendingRequests,
    tripInvites
  );

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
            {/* Sidebar Toggle - Desktop Only */}
            {!isMobile && (
              <button
                onClick={() => {
                  console.log("🔁 Desktop toggle clicked");
                  toggleSidebar();

                  // DIRECT DOM MANIPULATION AS BACKUP
                  setTimeout(() => {
                    const sidebar = document.querySelector(
                      '[data-sidebar="true"]'
                    );
                    if (sidebar) {
                      const isCurrentlyOpen =
                        !sidebar.classList.contains("-translate-x-full");
                      if (isCurrentlyOpen) {
                        sidebar.classList.add("-translate-x-full");
                      } else {
                        sidebar.classList.remove("-translate-x-full");
                      }
                      console.log(
                        "🔧 DIRECT DOM TOGGLE - Classes:",
                        sidebar.className
                      );
                    }
                  }, 50);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Welcome Message - Desktop */}
            <div className="hidden sm:block lg:block">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getWelcomeMessage()}
              </h2>

              {/* Breadcrumbs for trip view */}
              {breadcrumbs.items.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {breadcrumbs.items.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.action ? (
                        <button
                          onClick={crumb.action}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {crumb.label}
                        </span>
                      )}
                      {index < breadcrumbs.items.length - 1 && (
                        <span className="text-gray-400">›</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
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
          {(!sidebarOpen ||
            (window.innerWidth >= 640 && window.innerWidth < 1024)) && (
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
            {/* Settings Button */}
            <button
              onClick={openSettingsModal}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <CogIcon className="w-5 h-5" />
            </button>

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
                <NotificationsDropdown
                  pendingRequests={pendingRequests}
                  tripInvites={tripInvites}
                />
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
                        openLogoutModal();
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
