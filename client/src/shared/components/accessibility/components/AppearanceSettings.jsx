import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const AppearanceSettings = ({ theme, toggleTheme }) => {
  const currentTheme = theme || "light";

  const handleThemeToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        {currentTheme === "dark" ? (
          <MoonIcon className="w-5 h-5 mr-2" />
        ) : (
          <SunIcon className="w-5 h-5 mr-2" />
        )}
        Appearance
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center">
            {currentTheme === "dark" ? (
              <MoonIcon className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <SunIcon className="w-5 h-5 mr-3 text-yellow-600" />
            )}
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Dark Mode
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
          </div>
          <button
            onClick={handleThemeToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              currentTheme === "dark" ? "bg-indigo-600" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={currentTheme === "dark"}
            aria-label="Toggle dark mode"
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                currentTheme === "dark"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;