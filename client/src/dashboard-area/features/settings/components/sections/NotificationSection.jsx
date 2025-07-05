// src/dashboard-area/features/settings/components/sections/NotificationSection.jsx
import React from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { NOTIFICATION_SETTINGS } from "../../constants/settingsConstants";

const NotificationSection = ({ settings, toggleSetting, settingsLoading }) => {
  return (
    <div className="space-y-3 sm:space-y-4" data-section="notifications">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
          Notifications
        </h4>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
        Choose which notifications you'd like to receive
      </p>

      <div className="space-y-2 sm:space-y-3">
        {NOTIFICATION_SETTINGS.map((item) => {
          // Check if setting should be disabled
          const isDisabled =
            item.id !== "emailNotifications" &&
            !settings.notifications?.emailNotifications;

          return (
            <div key={item.id} className="group">
              <label
                className={`flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-600/30 ${
                  isDisabled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  {item.icon}
                  <div>
                    <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors block">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={
                      settings.notifications?.[item.id] ??
                      item.defaultChecked
                    }
                    onChange={() =>
                      toggleSetting("notifications", item.id)
                    }
                    disabled={settingsLoading || isDisabled}
                  />
                  <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 transition-all duration-300 shadow-inner"></div>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationSection;