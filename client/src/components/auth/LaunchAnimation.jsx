import React, { useState, useEffect } from "react";
import { CameraIcon, SparklesIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";

const LaunchAnimation = ({ onAnimationComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const triggerExitAnimation = () => {
    setIsExiting(true);
    setTimeout(() => {
      onAnimationComplete?.();
    }, 800);
  };

  const handleProgressComplete = () => {
    setTimeout(triggerExitAnimation, 500);
  };

  const loadingTexts = [
    "Initializing your experience...",
    "Loading smart photo tools...",
    "Preparing AI recognition...",
    "Almost ready!",
  ];

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          handleProgressComplete();
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Cycle through loading texts
    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-all duration-800 ${
        isExiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-80 h-80 bg-gradient-to-br from-blue-400/25 to-indigo-400/25 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`particle-${i}-${Math.floor(Math.random() * 1000000)}`}
          className="absolute w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-60 animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Glow Effect */}
          <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-60 animate-pulse"></div>

          {/* Logo Container */}
          <div className="relative w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform transition-all duration-1000 hover:scale-110">
            <CameraIcon className="w-12 h-12 text-white animate-pulse" />

            {/* Rotating Border */}
            <div
              className="absolute inset-0 w-24 h-24 border-4 border-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-3xl animate-spin"
              style={{
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "xor",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                animationDuration: "3s",
              }}
            ></div>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-pulse">
          Groupify
        </h1>

        {/* Tagline with Icon */}
        <div className="flex items-center mb-12 px-6 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/50">
          <SparklesIcon
            className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2 animate-spin"
            style={{ animationDuration: "2s" }}
          />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            AI-Powered Photo Management
          </span>
        </div>

        {/* Loading Text */}
        <div className="mb-8 h-6">
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center transition-all duration-500 transform">
            {loadingTexts[currentText]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 max-w-sm">
          {/* Progress Container */}
          <div className="relative w-full h-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/50 overflow-hidden">
            {/* Progress Fill */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>

            {/* Progress Glow */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-sm opacity-50 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress Percentage */}
          <div className="text-center mt-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {progress}%
            </span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2 mt-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={`dot-${i}`}
              className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

LaunchAnimation.propTypes = {
  onAnimationComplete: PropTypes.func,
};

// Example usage component showing how to integrate with your existing HomePage
const App = () => {
  const [showLaunch, setShowLaunch] = useState(true);

  const handleAnimationComplete = () => {
    setShowLaunch(false);
  };

  if (showLaunch) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  // Your existing HomePage component would render here
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Groupify!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Launch animation completed. Your main content loads here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
