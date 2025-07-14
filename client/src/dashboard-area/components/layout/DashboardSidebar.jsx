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
import { useDashboardNavigation } from "@dashboard/hooks/useDashboardNavigation";
import { useUserPresence } from "@shared/hooks/useUserPresence";
import { useNavigate } from "react-router-dom";

import { NAVIGATION_ITEMS } from "@dashboard/utils/dashboardConstants.js";
import {
  getNavigationItemBadge,
  hasNotifications,
} from "@dashboard/utils/dashboardHelpers";

// eslint-disable-next-line no-unused-vars
const DashboardSidebar = ({ sidebarOpen, onSidebarClose, onLogoutClick }) => {
  const navigate = useNavigate();
  const {
    layout: { activeSection, currentView, selectedeventId, isMobile },
    dropdowns: { eventsDropdownOpen, visibleeventsCount },
    navigation: { navigateToSection, navigateBackToDashboard },
    sidebar: { close: closeSidebar },
    dropdownActions: { toggleeventsDropdown, showMoreevents },
    utils: { isViewingEvent },
  } = useDashboardLayout();

  const { userData, events, pendingRequests, eventInvites } =
    useDashboardData();
  const {
    navigate: { toEvent: _navigateToEvent },
  } = useDashboardNavigation();

  // Get current user's real-time presence
  const currentUserPresence = useUserPresence(userData?.uid);

  const currentUser = userData; // Assuming userData contains current user info

  // Get current user's status config for presence indicator
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

  return (
    <div
      data-sidebar="true"
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "" : "-translate-x-full"
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              navigate("/dashboard", { replace: true });
              if (isMobile) closeSidebar();
            }}
            className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-2 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300">
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

      {/* User Info Section with Real-Time Presence */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          {/* Enhanced Avatar with Real-Time Presence Indicator */}
          <div className="relative">
            <img
              src={
                userData?.photoURL ||
                currentUser?.photoURL ||
                "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
              }
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />

            {/* Real-Time Presence Indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${currentUserStatusConfig.color} border-2 border-white dark:border-gray-800 rounded-full ${currentUserStatusConfig.ring} ring-2 ${currentUserStatusConfig.pulse} shadow-lg`}
              title={currentUserStatusConfig.title}
            ></div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {userData?.displayName || currentUser?.displayName || "User"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {userData?.email || currentUser?.email}
            </p>

            {/* Real-Time Status Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {currentUserPresence.loading
                ? "Loading..."
                : currentUserPresence.status || "offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Back Button when viewing event */}
      {isViewingEvent() && (
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
              eventInvites,
              events
            );
            const hasNotification = hasNotifications(
              item.id,
              pendingRequests,
              eventInvites
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

                  {/* Dropdown arrow for events */}
                  {item.hasDropdown && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleeventsDropdown();
                      }}
                      className={`ml-1 p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "text-white hover:bg-white/20"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          eventsDropdownOpen
                            ? "rotate-90 scale-110"
                            : "scale-100"
                        }`}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </div>
                    </button>
                  )}
                </div>

                {/* events Dropdown */}
                {item.id === "events" && (
                  <div
                    className={`overflow-hidden transition-all duration-700 ease-in-out ${
                      eventsDropdownOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      {events.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                          No events yet
                        </div>
                      ) : (
                        <>
                          {events.slice(0, visibleeventsCount).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => {
                                // Use direct navigation instead of the hook function
                                navigate(`/dashboard/event/${event.id}`, {
                                  replace: true,
                                });
                                if (isMobile) closeSidebar();
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 mb-1 transform hover:scale-105 ${
                                selectedeventId === event.id
                                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <div className="truncate">{event.name}</div>
                              {event.location && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                  📍 {event.location}
                                </div>
                              )}
                            </button>
                          ))}

                          {events.length > visibleeventsCount && (
                            <button
                              onClick={showMoreevents}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                              + Show{" "}
                              {Math.min(5, events.length - visibleeventsCount)}{" "}
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
