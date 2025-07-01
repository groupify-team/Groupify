import React from "react";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  CameraIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
// FIXED: Proper import syntax
import { useDashboardModals } from "@dashboard/hooks/useDashboardModals";
import { useDashboardNavigation } from "@dashboard/hooks/useDashboardNavigation";

import { NAVIGATION_ITEMS } from "@dashboard/utils/dashboardConstants";
import {
  getNavigationItemBadge,
  hasNotifications,
} from "@dashboard/utils/dashboardHelpers";

const DashboardSidebar = ({ sidebarOpen, onSidebarClose, onLogoutClick }) => {
  const {
    layout: { activeSection, currentView, selectedTripId, isMobile },
    dropdowns: { tripsDropdownOpen, visibleTripsCount },
    navigation: { navigateToSection, navigateBackToDashboard },
    sidebar: { close: closeSidebar },
    dropdownActions: { toggleTripsDropdown, showMoreTrips },
    utils: { isViewingTrip },
  } = useDashboardLayout();

  const { userData, trips, pendingRequests, tripInvites } = useDashboardData();
  console.log("🔍 Sidebar PROP sidebarOpen state:", sidebarOpen);
  console.log("🔍 Sidebar sidebarOpen state:", sidebarOpen);
  console.log(
    "🎨 CSS classes being applied:",
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  );

  const {
    navigate: { toTrip: navigateToTrip },
  } = useDashboardNavigation();

  const currentUser = userData; // Assuming userData contains current user info

  return (
    <div
      data-sidebar="true"
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "" : "-translate-x-full"
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              navigateToSection("trips");
              if (isMobile) closeSidebar();
            }}
            className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-2 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Groupify
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dashboard
              </p>
            </div>
          </button>

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <img
            src={
              userData?.photoURL ||
              currentUser?.photoURL ||
              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
            }
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {userData?.displayName || currentUser?.displayName || "User"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {userData?.email || currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Back Button when viewing trip */}
      {isViewingTrip() && (
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => {
              navigateBackToDashboard();
              if (isMobile) closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl font-medium transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Navigation Section */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeSection === item.id && currentView === "home";
            const badge = getNavigationItemBadge(
              item.id,
              pendingRequests,
              tripInvites,
              trips
            );
            const hasNotification = hasNotifications(
              item.id,
              pendingRequests,
              tripInvites
            );

            return (
              <li key={item.id}>
                <div className="flex items-center">
                  {/* Main navigation button */}
                  <button
                    onClick={() => {
                      navigateToSection(item.id);
                      if (isMobile) closeSidebar();
                    }}
                    className={`flex-1 flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {badge > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-white text-indigo-600"
                            : hasNotification
                            ? "bg-red-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>

                  {/* Dropdown arrow for trips */}
                  {item.hasDropdown && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTripsDropdown();
                      }}
                      className={`ml-1 p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "text-white hover:bg-white/20"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          tripsDropdownOpen
                            ? "rotate-90 scale-110"
                            : "scale-100"
                        }`}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Trips Dropdown */}
                {item.id === "trips" && (
                  <div
                    className={`overflow-hidden transition-all duration-700 ease-in-out ${
                      tripsDropdownOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      {trips.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                          No trips yet
                        </div>
                      ) : (
                        <>
                          {trips.slice(0, visibleTripsCount).map((trip) => (
                            <button
                              key={trip.id}
                              onClick={() => {
                                navigateToTrip(trip.id, trip);
                                if (isMobile) closeSidebar();
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                                selectedTripId === trip.id
                                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <div className="truncate">{trip.name}</div>
                              {trip.location && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                  📍 {trip.location}
                                </div>
                              )}
                            </button>
                          ))}

                          {trips.length > visibleTripsCount && (
                            <button
                              onClick={showMoreTrips}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                              + Show{" "}
                              {Math.min(5, trips.length - visibleTripsCount)}{" "}
                              more
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={() => {
            console.log("🎯 Desktop logout clicked!");
            if (onLogoutClick) {
              onLogoutClick();
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;