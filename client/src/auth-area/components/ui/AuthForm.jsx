import React from "react";
import { CameraIcon } from "@heroicons/react/24/outline";

const AuthForm = ({ 
  title,
  subtitle,
  showLogo = true,
  logoGradient = "from-indigo-600 to-purple-600",
  children,
  maxWidth = "max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md",
  className = ""
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-6 lg:px-12 xl:px-20 2xl:px-24 py-4 sm:py-6 md:py-8">
      <div className={`mx-auto w-full ${maxWidth} ${className}`}>
        {/* Logo and Title */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          {showLogo && (
            <div className="flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r ${logoGradient} rounded-xl flex items-center justify-center`}>
                <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <span className={`ml-2 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r ${logoGradient} bg-clip-text text-transparent`}>
                Groupify
              </span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Content */}
        {children}
      </div>
    </div>
  );
};

export default AuthForm;
