import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../shared/contexts/ThemeContext";
import { CameraIcon, SunIcon, MoonIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const AuthHeader = ({ 
  showBackButton = true, 
  backTo = "/",
  showLogo = true,
  className = ""
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center justify-between p-4 sm:p-6 md:px-6 lg:px-12 xl:px-20 2xl:px-24 md:py-8 lg:py-12 ${className}`}>
      {/* Left Side - Back Button or Logo */}
      <div className="flex items-center">
        {showBackButton ? (
          <Link
            to={backTo}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        ) : showLogo ? (
          <Link to="/" className="flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Groupify
            </span>
          </Link>
        ) : (
          <div></div> // Empty div for spacing
        )}
      </div>

      {/* Right Side - Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default AuthHeader;