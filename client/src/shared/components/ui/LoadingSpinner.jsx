// Unified Loading Spinner Component
import React, { memo } from "react";

const LoadingSpinner = memo(
  ({
    size = "medium",
    color = "indigo",
    text = null,
    overlay = false,
    className = "",
    fullPage = false,
    message = "Loading...",
    centered = false,
  }) => {
    // Size configurations
    const sizeClasses = {
      small: "w-4 h-4",
      medium: "w-8 h-8",
      large: "w-12 h-12",
      xlarge: "w-16 h-16",
    };

    // Color configurations
    const colorClasses = {
      indigo: "border-indigo-600 dark:border-indigo-400",
      purple: "border-purple-600 dark:border-purple-400",
      blue: "border-blue-600 dark:border-blue-400",
      green: "border-green-600 dark:border-green-400",
      red: "border-red-600 dark:border-red-400",
      gray: "border-gray-600 dark:border-gray-400",
      white: "border-white",
    };

    // Border light colors for the spinning effect
    const borderLightClasses = {
      indigo: "border-t-indigo-200 dark:border-t-indigo-600",
      purple: "border-t-purple-200 dark:border-t-purple-600",
      blue: "border-t-blue-200 dark:border-t-blue-600",
      green: "border-t-green-200 dark:border-t-green-600",
      red: "border-t-red-200 dark:border-t-red-600",
      gray: "border-t-gray-200 dark:border-t-gray-600",
      white: "border-t-gray-300",
    };

    // Spinner element
    const spinnerElement = (
      <div
        className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${borderLightClasses[color]} 
        border-4 rounded-full animate-spin
        ${className}
      `}
      />
    );

    // Full page loader
    if (fullPage) {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
          <div className="text-center">
            {/* Enhanced loading animation */}
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 dark:border-t-purple-500 rounded-full animate-spin mx-auto"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <p className="text-xl text-gray-800 dark:text-white font-medium mb-2">
              {message}
            </p>
            <div className="flex space-x-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Overlay loader
    if (overlay) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              {spinnerElement}
              {text && (
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {text}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Centered loader
    if (centered) {
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="text-center">
            {spinnerElement}
            {text && (
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-4">
                {text}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Standard inline loader
    return (
      <div className="flex items-center gap-3">
        {spinnerElement}
        {text && (
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            {text}
          </span>
        )}
      </div>
    );
  }
);

// Dashboard Skeleton Component
export const DashboardSkeleton = memo(() => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-full px-6">
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-300 dark:bg-gray-600 rounded"
              ></div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-300 dark:bg-gray-600 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";
DashboardSkeleton.displayName = "DashboardSkeleton";

export default LoadingSpinner;
