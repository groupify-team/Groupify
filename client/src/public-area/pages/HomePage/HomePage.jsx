import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../auth-area/contexts/AuthContext";
import { toast } from "react-hot-toast";

// New Architecture Components
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { FeatureGrid } from "../../components/ui/FeatureCard";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";

// Other Components
import SettingsModal from "../../../dashboard-area/features/settings/components/SettingsModal";
import PhotoStack3D from "../../../auth-area/components/ui/3DInteractivePhotoStack";

// Icons
import {
  CameraIcon,
  UserGroupIcon,
  ShareIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// Launch Animation Component (extracted from original)
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
  const location = useLocation();
  const navigate = useNavigate();
  const { handleGetStarted, handleSignIn } = usePublicNavigation();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showLaunch, setShowLaunch] = useState(() => {
    return !localStorage.getItem("hasSeenLaunchAnimation");
  });

  // Features data for FeatureGrid
  const features = [
    {
      id: 1,
      icon: CameraIcon,
      title: "Smart Photo Organization",
      description: "Upload and automatically organize trip photos with intelligent categorization and tagging.",
      variant: "default",
    },
    {
      id: 2,
      icon: SparklesIcon,
      title: "AI Face Recognition",
      description: "Find yourself in group photos instantly with our advanced face recognition technology.",
      variant: "default",
    },
    {
      id: 3,
      icon: UserGroupIcon,
      title: "Collaborative Sharing",
      description: "Share trips with friends and family. Everyone can contribute photos and memories.",
      variant: "default",
    },
    {
      id: 4,
      icon: ShareIcon,
      title: "Seamless Access",
      description: "Access your memories anywhere, anytime. Cloud-synchronized across all your devices.",
      variant: "default",
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
    if (location.state?.message && location.state?.verified) {
      toast.success(location.state.message, {
        duration: 5000,
      });
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleAnimationComplete = () => {
    localStorage.setItem("hasSeenLaunchAnimation", "true");
    setShowLaunch(false);
  };

  // Show launch animation first
  if (showLaunch) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <PublicLayout
      headerType="home"
      footerType="extended"
      headerProps={{ 
        onSettingsClick: () => setShowSettings(true)
      }}
      className={`transition-all duration-1000 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{ 
          icon: SparklesIcon, 
          text: "AI-Powered Photo Management" 
        }}
        title={
          <>
            <span className="block">Share Your</span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Trip Memories
            </span>
          </>
        }
        description="Upload photos, find yourself with AI face recognition, and relive the moments together. The smartest way to organize and share your travel memories."
        primaryCTA={{
          text: "Start Organizing Photos",
          href: "/signup",
          onClick: handleGetStarted,
          icon: ArrowRightIcon,
        }}
        secondaryCTA={{
          text: "Sign In",
          href: "/signin",
          onClick: handleSignIn,
        }}
        additionalContent={
          // Success message banner
          location.state?.verified && (
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
                      You can now sign in and start organizing your travel photos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      />

      {/* Features Section */}
      <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2 sm:px-0">
              Everything you need to organize your memories
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-2 sm:px-0">
              Powerful features designed to make photo sharing and organization effortless
            </p>
          </div>

          <FeatureGrid 
            features={features}
            columns={4}
            variant="default"
            isLoaded={isLoaded}
          />
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
            Join thousands of users who are already using Groupify to organize and share their travel photos.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started Free
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </PublicLayout>
  );
};

export default HomePage;