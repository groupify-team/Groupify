import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../auth-area/contexts/AuthContext";
import { useTheme } from "../../../shared/contexts/ThemeContext";

import { toast } from "react-hot-toast";
import {
  CameraIcon,
  UserGroupIcon,
  ShareIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import PublicFooter from "../../components/layout/PublicFooter";

// Import components that provide functionality
import AccessibilityModal from "@/shared/components/accessibility/AccessibilityModal";

// Launch Animation Component (keep exactly as before)
const LaunchAnimation = ({ onAnimationComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

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
          // Start exit animation
          setTimeout(() => {
            setIsExiting(true);
            // Complete animation after exit transition
            setTimeout(() => {
              onAnimationComplete?.();
            }, 800);
          }, 500);
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
          key={i}
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
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Custom Styles for Shimmer Animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

const HomePage = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Need both for SettingsModal
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);

  // ADD ALL THE MISSING STATE FROM ORIGINAL
  const [showSettings, setShowSettings] = useState(false);
  const [showLaunch, setShowLaunch] = useState(() => {
    // Only show launch animation if user hasn't seen it before
    return !localStorage.getItem("hasSeenLaunchAnimation");
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Success message handling from email verification
  useEffect(() => {
    // Check if there's a success message from email verification
    if (location.state?.message && location.state?.verified) {
      toast.success(location.state.message, {
        duration: 5000,
      });

      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // ADD THIS FUNCTION TO HANDLE ANIMATION COMPLETION
  const handleAnimationComplete = () => {
    localStorage.setItem("hasSeenLaunchAnimation", "true");
    setShowLaunch(false);
  };

  // ADD SMOOTH NAVIGATION FUNCTIONALITY
  const handleLinkClick = (to) => {
    document.body.style.opacity = "0";
    setTimeout(() => {
      window.location.href = to;
    }, 200);
  };

  // ADD THIS CHECK TO SHOW LAUNCH ANIMATION FIRST
  if (showLaunch) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  const features = [
    {
      icon: CameraIcon,
      title: "Smart Photo Organization",
      description:
        "Upload and automatically organize trip photos with intelligent categorization and tagging.",
    },
    {
      icon: SparklesIcon,
      title: "AI Face Recognition",
      description:
        "Find yourself in group photos instantly with our advanced face recognition technology.",
    },
    {
      icon: UserGroupIcon,
      title: "Collaborative Sharing",
      description:
        "Share trips with friends and family. Everyone can contribute photos and memories.",
    },
    {
      icon: ShareIcon,
      title: "Seamless Access",
      description:
        "Access your memories anywhere, anytime. Cloud-synchronized across all your devices.",
    },
  ];

  const benefits = [
    "Never lose track of your photos again",
    "Find yourself in group shots effortlessly",
    "Share memories with loved ones instantly",
    "Organize trips automatically",
    "Access from any device",
    "Privacy-focused and secure",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header - UPDATED: Removed theme toggle button, only settings remains */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </div>
            </div>

            {/* Navigation Links - UPDATED: Only settings button, theme toggle moved to accessibility settings */}
            <div className="flex items-center space-x-4">
              {/* Settings Toggle - Dark mode toggle is now inside accessibility settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open accessibility and settings"
              >
                <CogIcon className="w-5 h-5" />
              </button>

              {/* Auth Links - WITH PROPER NAVIGATION */}
              {!currentUser && (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/signin"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/signin");
                    }}
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/signup");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className={`relative overflow-hidden transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/50 mb-8">
              <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI-Powered Photo Management
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="block">Share Your</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Trip Memories
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              Upload photos, find yourself with AI face recognition, and relive
              the moments together. The smartest way to organize and share your
              travel memories.
            </p>

            {/* Success Message Banner */}
            {location.state?.verified && (
              <div className="mb-8 max-w-2xl mx-auto">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                        Email Verified Successfully! 🎉
                      </h3>
                      <p className="text-green-700 dark:text-green-300 mt-1">
                        You can now sign in and start organizing your travel
                        photos.
                      </p>
                      <Link
                        to="/signin"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/signin");
                        }}
                        className="inline-block mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Sign In Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Buttons - WITH PROPER NAVIGATION */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick("/signup");
                }}
                className="group inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Start Organizing Photos
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/signin"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick("/signin");
                }}
                className="inline-flex items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold border border-white/20 dark:border-gray-700/50 transition-all duration-200 hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to organize your memories
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
              Powerful features designed to make photo sharing and organization
              effortless
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  isLoaded
                    ? `opacity-100 translate-y-0 delay-${index * 100}`
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Benefits List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
                Why choose Groupify?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={`flex items-center p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300 ${
                      isLoaded
                        ? `opacity-100 translate-x-0 delay-${index * 100}`
                        : "opacity-0 -translate-x-8"
                    }`}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
                <div className="grid grid-cols-3 gap-4 p-8">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg shadow-lg transition-all duration-500 hover:scale-110 ${
                        isLoaded
                          ? `opacity-100 scale-100 delay-${i * 50}`
                          : "opacity-0 scale-95"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to organize your memories?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
            Join thousands of users who are already using Groupify to organize
            and share their travel photos.
          </p>
          <Link
            to="/signup"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("/signup");
            }}
            className="inline-flex items-center bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started Free
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer(imported)  */}
      <PublicFooter />

      {/* Settings Modal - Contains accessibility settings including dark mode toggle */}
      <AccessibilityModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
};

export default HomePage;