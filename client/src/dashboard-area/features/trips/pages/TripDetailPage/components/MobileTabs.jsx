import React from "react";
import { MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const MobileTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="xl:hidden relative">
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
        <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {/* Background slider */}
          <div
            className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-300 ease-in-out transform ${
              activeTab === "trip" ? "translate-x-0" : "translate-x-full"
            }`}
          />

          {/* Tab buttons */}
          <button
            onClick={() => onTabChange("trip")}
            className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
              activeTab === "trip"
                ? "text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPinIcon className="w-4 h-4" />
              <span>Trip</span>
            </div>
          </button>

          <button
            onClick={() => onTabChange("members")}
            className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
              activeTab === "members"
                ? "text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              <span>Members</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileTabs;
