// src/dashboard-area/features/settings/components/ui/SettingToggle.jsx
import React from 'react';

const SettingToggle = ({ 
  id, 
  label, 
  description, 
  icon, 
  checked, 
  onChange, 
  disabled = false,
  color = "blue" 
}) => {
  const colorClasses = {
    blue: "peer-checked:from-blue-500 peer-checked:to-indigo-600 hover:border-blue-200 dark:hover:border-blue-600/30",
    green: "peer-checked:from-green-500 peer-checked:to-emerald-600 hover:border-green-200 dark:hover:border-green-600/30",
    purple: "peer-checked:from-purple-500 peer-checked:to-pink-600 hover:border-purple-200 dark:hover:border-purple-600/30"
  };

  return (
    <div className="group">
      <label className={`flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent ${colorClasses[color]} ${disabled ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {icon}
          <div>
            <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors block">
              {label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </span>
          </div>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
          />
          <div className={`w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r ${colorClasses[color].split(' ')[0]} transition-all duration-300 shadow-inner`}></div>
          <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
        </div>
      </label>
    </div>
  );
};

export default SettingToggle;