import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@shared/contexts/ThemeContext";
import {
  CameraIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const PublicHeader = ({ 
  showBackButton = true, 
  backButtonText = "Back to Home", 
  backButtonLink = "/",
  onSettingsClick = null, // Add settings callback
  className = "",
  actions = null // For custom actions like in BlogPage
}) => {
  const { theme, toggleTheme } = useTheme();

  const handleHomeClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <nav className={`relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" onClick={handleHomeClick} className="flex items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Custom Actions (for specific pages like Blog) */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}

            {showBackButton && (
              <Link
                to={backButtonLink}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">{backButtonText}</span>
              </Link>
            )}

            {/* Settings Button - Only show if callback provided */}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open accessibility and settings"
              >
                <CogIcon className="w-5 h-5" />
              </button>
            )}

            {/* Theme Toggle - Only show if no settings callback (to avoid duplication) */}
            {!onSettingsClick && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;