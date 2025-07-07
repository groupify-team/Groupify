import React, { Suspense, memo } from "react";
import LoadingSpinner, {
  DashboardSkeleton,
} from "@/shared/components/ui/LoadingSpinner";

// Enhanced loading component with smooth transitions
const SmoothLoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div
          className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        {message}
      </p>
    </div>
  </div>
));

SmoothLoadingSpinner.displayName = "SmoothLoadingSpinner";

const SuspenseWrapper = memo(
  ({ children, fallback, useSkeleton = false, useSmooth = false }) => (
    <Suspense
      fallback={
        useSkeleton ? (
          <DashboardSkeleton />
        ) : useSmooth ? (
          <SmoothLoadingSpinner />
        ) : (
          fallback || <LoadingSpinner fullPage />
        )
      }
    >
      {children}
    </Suspense>
  )
);

SuspenseWrapper.displayName = "SuspenseWrapper";

export default SuspenseWrapper;
