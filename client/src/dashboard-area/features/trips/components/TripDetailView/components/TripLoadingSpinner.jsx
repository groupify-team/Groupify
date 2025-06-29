// components/TripDetailView/components/TripLoadingSpinner.jsx
import React from "react";

const TripLoadingSpinner = ({ message = "Loading trip details..." }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 relative mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-200/30 dark:border-indigo-800/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-transparent border-t-purple-500 dark:border-t-purple-400 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
            <div
              className="absolute inset-4 border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            ></div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-8 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-60"></div>
            <div className="absolute top-12 right-6 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-500"></div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {message}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Getting everything ready for your amazing memories...
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripLoadingSpinner;
