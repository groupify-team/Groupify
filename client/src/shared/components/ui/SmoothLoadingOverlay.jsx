import React, { useEffect, useState } from "react";

const SmoothLoadingOverlay = ({
  isVisible,
  message = "Loading...",
  onComplete,
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        setAnimationClass("loading-overlay-enter-active");
      }, 10);
    } else {
      setAnimationClass("loading-overlay-exit-active");
      // Remove from DOM after animation completes
      setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 300);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex items-center justify-center loading-overlay-enter ${animationClass}`}
      style={{
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Enhanced dual spinner */}
        <div className="relative">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-10 h-10 border-4 border-transparent border-t-purple-400 rounded-full animate-spin opacity-30"
            style={{
              animationDirection: "reverse",
              animationDuration: "1.5s",
            }}
          ></div>
        </div>

        {/* Loading message */}
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-3">
            {message}
          </p>

          {/* Animated dots */}
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
    </div>
  );
};

export default SmoothLoadingOverlay;
