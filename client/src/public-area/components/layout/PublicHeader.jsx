import React from "react";
import { Link } from "react-router-dom";
import { CameraIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import AccessibilityButton from "@shared/components/accessibility/AccessibilityButton";

const PublicHeader = ({
  showBackButton = true,
  backButtonText = "Back to Home",
  backButtonLink = "/",
  onSettingsClick = null, // Add settings callback
  className = "",
  actions = null, // For custom actions like in BlogPage
  handleSmoothNavigation = null, // Add smooth navigation prop
}) => {
  const handleHomeClick = (e) => {
    if (handleSmoothNavigation) {
      e.preventDefault();
      handleSmoothNavigation("/");
    } else {
      window.scrollTo(0, 0);
    }
  };

  const handleBackClick = (e) => {
    if (handleSmoothNavigation) {
      e.preventDefault();
      handleSmoothNavigation(backButtonLink);
    } else {
      window.scrollTo(0, 0);
    }
  };

  return (
    <nav
      className={`relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              onClick={handleHomeClick}
              className="flex items-center"
            >
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
              <div className="flex items-center space-x-2">{actions}</div>
            )}

            {/* Accessibility Button - Always show */}
            <AccessibilityButton
              onSettingsClick={onSettingsClick}
              size="default"
              variant="default"
            />

            {showBackButton && (
              <Link
                to={backButtonLink}
                onClick={handleBackClick}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">{backButtonText}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;
