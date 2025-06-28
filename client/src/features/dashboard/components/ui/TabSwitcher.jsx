// TabSwitcher.jsx - Mobile tab switching component
import React from "react";

const TabSwitcher = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
      <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-hidden">
        {/* Background slider */}
        <div
          className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-500 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${
              tabs.findIndex((tab) => tab.id === activeTab) * 100
            }%)`,
          }}
        />

        {/* Tab buttons */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                isActive
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.badgeColor === "red"
                        ? "bg-red-500 text-white"
                        : tab.badgeColor === "indigo"
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabSwitcher;
