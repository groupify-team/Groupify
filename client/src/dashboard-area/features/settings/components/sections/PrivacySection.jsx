// src/dashboard-area/features/settings/components/sections/PrivacySection.jsx
import React from "react";
import { PRIVACY_SETTINGS } from "../../constants/settingsConstants";

const PrivacySection = ({ settings, toggleSetting, settingsLoading }) => {
  return (
    <div className="space-y-3 sm:space-y-4" data-section="privacy">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
          Privacy Settings
        </h4>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
        Control your privacy and data sharing preferences
      </p>

      <div className="space-y-2 sm:space-y-3">
        {PRIVACY_SETTINGS.map((item) => (
          <div key={item.id} className="group">
            <label className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-600/30">
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
                    settings.privacy?.[item.id] ?? item.defaultChecked
                  }
                  onChange={() => toggleSetting("privacy", item.id)}
                  disabled={settingsLoading}
                />
                <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 transition-all duration-300 shadow-inner"></div>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacySection;