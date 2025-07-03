// MobileBottomNav.jsx - Mobile bottom navigation bar
import React from "react";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";
import { useDashboardData } from "../../hooks/useDashboardData";
import { BOTTOM_NAV_ITEMS } from "@dashboard/utils/dashboardConstants.jsx";
import {
  getNavigationItemBadge,
  hasNotifications,
} from "@dashboard/utils/dashboardHelpers";

const MobileBottomNav = () => {
  const {
    layout: { activeSection, currentView },
    navigation: { navigateToSection },
  } = useDashboardLayout();

  const { pendingRequests, tripInvites, trips } = useDashboardData();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 z-50 h-14 shadow-lg">
      <div className="flex justify-around items-center py-1.5 h-full">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id && currentView === "home";
          const badgeCount = getNavigationItemBadge(
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
            <button
              key={item.id}
              onClick={() => navigateToSection(item.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 relative min-w-0 flex-1 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {/* Icon */}
              <Icon className="w-4 h-4 mb-0.5 flex-shrink-0" />

              {/* Label */}
              <span className="text-xs font-medium truncate w-full text-center">
                {item.name}
              </span>

              {/* Badge */}
              {badgeCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${
                    isActive
                      ? "bg-white text-indigo-600"
                      : hasNotification
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
