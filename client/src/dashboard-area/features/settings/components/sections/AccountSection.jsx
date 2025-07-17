// src/dashboard-area/features/settings/components/sections/AccountSection.jsx
import React from "react";
import {
  BellIcon,
  CameraIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useUserPresence } from "@shared/hooks/useUserPresence";

import NotificationSection from "./NotificationSection";
import PrivacySection from "./PrivacySection";

const AccountSection = ({
  userData,
  currentUser,
  onOpenEditProfile,
  settings,
  toggleSetting,
  settingsLoading,
}) => {
  // Get current user's real-time presence
  const currentUserPresence = useUserPresence(
    userData?.uid || currentUser?.uid
  );

  // Get current user's status config for presence indicator
  const getCurrentUserStatusConfig = () => {
    if (currentUserPresence.loading) {
      return {
        color: "bg-gray-400",
        innerDot: "bg-white",
        pulse: "animate-pulse",
        title: "Loading status...",
      };
    }

    if (currentUserPresence.isOnline) {
      switch (currentUserPresence.status) {
        case "online":
          return {
            color: "bg-emerald-500",
            innerDot: "bg-white",
            pulse: "animate-pulse",
            title: "Online",
          };
        case "away":
          return {
            color: "bg-amber-500",
            innerDot: "bg-white",
            pulse: "",
            title: "Away",
          };
        case "busy":
          return {
            color: "bg-red-500",
            innerDot: "bg-white",
            pulse: "",
            title: "Busy",
          };
        default:
          return {
            color: "bg-emerald-500",
            innerDot: "bg-white",
            pulse: "animate-pulse",
            title: "Online",
          };
      }
    }

    return {
      color: "bg-gray-400",
      innerDot: "bg-white",
      pulse: "",
      title: "Offline",
    };
  };

  const statusConfig = getCurrentUserStatusConfig();

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Account Information
        </h2>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4 sm:gap-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0 group">
            <div className="relative">
              <img
                src={
                  userData?.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="Profile"
                className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 cursor-pointer"
                onClick={onOpenEditProfile}
              />

              {/* Interactive overlay on hover */}
              <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                </div>
              </div>

              {/* UPDATED: Real-Time Presence Status Indicator */}
              <div
                className={`absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 ${statusConfig.color} border-3 sm:border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center`}
                title={statusConfig.title}
              >
                <div
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${statusConfig.innerDot} rounded-full ${statusConfig.pulse}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
                {userData?.displayName || currentUser?.displayName || "User"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg mt-1 break-all sm:break-normal">
                {userData?.email || currentUser?.email}
              </p>

              {/* Real-Time Status Text */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <div
                  className={`w-2 h-2 ${statusConfig.color} rounded-full ${statusConfig.pulse}`}
                ></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {currentUserPresence.loading
                    ? "Loading status..."
                    : `Currently ${currentUserPresence.status || "offline"}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Notifications Section */}
          <NotificationSection
            settings={settings}
            toggleSetting={toggleSetting}
            settingsLoading={settingsLoading}
          />

          {/* Privacy Section */}
          <PrivacySection
            settings={settings}
            toggleSetting={toggleSetting}
            settingsLoading={settingsLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountSection;
