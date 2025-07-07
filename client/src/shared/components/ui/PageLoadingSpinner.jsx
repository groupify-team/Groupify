import React, { memo } from "react";

export const PageLoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xl text-gray-800 dark:text-white font-medium">
        {message}
      </p>
    </div>
  </div>
));

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
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

PageLoadingSpinner.displayName = "PageLoadingSpinner";
DashboardSkeleton.displayName = "DashboardSkeleton";

export default PageLoadingSpinner;



