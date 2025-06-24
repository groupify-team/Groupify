import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import {
  CameraIcon,
  UserGroupIcon,
  ShareIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon,
  ArrowRightIcon,
  CheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import PhotoStack3D from "../components/auth/3DInteractivePhotoStack";

// Launch Animation Component (add this at the top of your file)
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);

  // MOVE THESE ARRAYS TO THE TOP - BEFORE useEFFECTS
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

  // ADD THIS STATE FOR LAUNCH ANIMATION
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

  // Benefits carousel animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % benefits.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [benefits.length]);

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

  const handleLinkClick = (to) => {
    document.body.style.opacity = "0";
    setTimeout(() => {
      navigate(to);
    }, 200);
  };

  // ADD THIS FUNCTION TO HANDLE ANIMATION COMPLETION
  const handleAnimationComplete = () => {
    localStorage.setItem("hasSeenLaunchAnimation", "true");
    setShowLaunch(false);
  };

  // ADD THIS CHECK TO SHOW LAUNCH ANIMATION FIRST
  if (showLaunch) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header */}
      <nav className="relative z-10">
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
              {/* Theme Toggle */}
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

      {/* Hero Section */}
      <div
        className={`relative overflow-hidden transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-16">
          <div className="text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/50 mb-6 sm:mb-8">
              <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                AI-Powered Photo Management
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              <span className="block">Share Your</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Trip Memories
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 md:mb-12 leading-relaxed px-2 sm:px-0">
              Upload photos, find yourself with AI face recognition, and relive
              the moments together. The smartest way to organize and share your
              travel memories.
            </p>

            {/* Success Message Banner */}
            {location.state?.verified && (
              <div className="mb-6 sm:mb-8 max-w-2xl mx-auto px-3 sm:px-0">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-200">
                        Email Verified Successfully! 🎉
                      </h3>
                      <p className="text-sm sm:text-base text-green-700 dark:text-green-300 mt-1">
                        You can now sign in and start organizing your travel
                        photos.
                      </p>
                      <Link
                        to="/signin"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/signin");
                        }}
                        className="inline-block mt-3 bg-green-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition-colors"
                      >
                        Sign In Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-10 sm:mb-14 px-3 sm:px-0">
              <Link
                to="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick("/signup");
                }}
                className="group inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto justify-center"
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
                className="inline-flex items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold border border-white/20 dark:border-gray-700/50 transition-all duration-200 hover:shadow-lg w-full sm:w-auto justify-center"
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
      <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2 sm:px-0">
              Everything you need to organize your memories
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-2 sm:px-0">
              Powerful features designed to make photo sharing and organization
              effortless
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group p-4 sm:p-5 md:p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  isLoaded
                    ? `opacity-100 translate-y-0 delay-${index * 100}`
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Benefits List - Left Side */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
                Why choose Groupify?
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={`flex items-center p-3 sm:p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/50 transition-all duration-500 ${
                      isLoaded
                        ? `opacity-100 translate-x-0 delay-${index * 100}`
                        : "opacity-0 -translate-x-8"
                    } ${
                      activeBenefit === index
                        ? "scale-105 bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 shadow-lg"
                        : "scale-100"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 transition-all duration-500 ${
                        activeBenefit === index ? "scale-110 bg-indigo-500" : ""
                      }`}
                    >
                      <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span
                      className={`text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium transition-all duration-500 ${
                        activeBenefit === index
                          ? "text-lg sm:text-xl font-semibold text-indigo-700 dark:text-indigo-300"
                          : ""
                      }`}
                    >
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - 3D Interactive Photo Stack */}
            <div className="relative">
              <PhotoStack3D />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-3 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to organize your memories?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
            Join thousands of users who are already using Groupify to organize
            and share their travel photos.
          </p>
          <Link
            to="/signup"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("/signup");
            }}
            className="inline-flex items-center bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started Free
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 md:py-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Desktop Layout (md and up) */}
          <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8 sm:mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                The smartest way to organize and share your travel memories
                using AI-powered face recognition and seamless photo management.
              </p>
              <div className="flex space-x-4">
                <a
                  href="mailto:groupify.ltd@gmail.com"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Email</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/signup"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/signup");
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signin"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/signin");
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/about"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Mobile & Tablet Layout (below md) */}
          <div className="md:hidden mb-8 sm:mb-12">
            {/* Brand Section - Centered */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                The smartest way to organize and share your travel memories
                using AI-powered face recognition and seamless photo management.
              </p>
              <div className="flex justify-center space-x-3 sm:space-x-4">
                <a
                  href="mailto:groupify.ltd@gmail.com"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Email</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product and Company Links - Side by side for all mobile/tablet sizes */}
            <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-sm sm:max-w-md mx-auto">
              {/* Product Links */}
              <div className="text-center">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-3 sm:mb-4">
                  Product
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link
                      to="/signup"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick("/signup");
                      }}
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signin"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick("/signin");
                      }}
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/features"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/pricing"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div className="text-center">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-3 sm:mb-4">
                  Company
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link
                      to="/about"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/blog"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/careers"
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section - Same for all sizes */}
          <div className="pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-6 mb-4 sm:mb-0">
                <Link
                  to="/privacy-policy"
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/help"
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  to="/status"
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Status
                </Link>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                © 2025 Groupify. Made with ❤️ for photo lovers.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
