import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth-area/contexts/AuthContext.jsx";
import { useTheme } from "@shared/contexts/ThemeContext";
import {
  CameraIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const HomeHeader = ({ onSettingsClick, className = "" }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  const handleLinkClick = (to) => {
    document.body.style.opacity = "0";
    setTimeout(() => {
      window.location.href = to;
    }, 200);
  };

  return (
    <nav className={`relative z-10 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-0">
            {/* Settings Toggle */}
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <CogIcon className="w-5 h-5" />
            </button>

            {/* Auth Links */}
            {!currentUser && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/signin"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick("/signin");
                  }}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick("/signup");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeHeader;