// src/dashboard-area/features/settings/components/ui/SettingCard.jsx
import React from 'react';

const SettingCard = ({ 
  title, 
  description, 
  icon, 
  children, 
  className = "",
  gradient = "from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20"
}) => {
  return (
    <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center justify-center gap-2 mb-4 p-6 pb-0">
          {icon}
          <div className="text-center">
            {title && (
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 m-6 border border-gray-200/50 dark:border-gray-700/50`}>
        {children}
      </div>
    </div>
  );
};

export default SettingCard;