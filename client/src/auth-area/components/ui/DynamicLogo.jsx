import React from "react";
import { CameraIcon } from "@heroicons/react/24/outline";

const DynamicLogo = ({ variant = "default", size = "large" }) => {
  const sizeClasses = {
    small: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-2xl",
      subtitle: "text-xs",
    },
    medium: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      text: "text-3xl",
      subtitle: "text-sm",
    },
    large: {
      container: "w-24 h-24",
      icon: "w-12 h-12",
      text: "text-4xl",
      subtitle: "text-base",
    },
  };

  const variantClasses = {
    default: "from-indigo-600 via-purple-600 to-blue-600",
    purple: "from-purple-600 via-indigo-600 to-blue-600",
    travel: "from-orange-500 via-pink-500 to-purple-600",
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className="flex flex-col items-center mb-8">
      {/* Animated Logo Container */}
      <div className="relative group cursor-pointer">
        {/* Outer glow effect */}
        <div
          className={`absolute inset-0 ${currentSize.container} bg-gradient-to-r ${currentVariant} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}
        ></div>

        {/* Main logo container */}
        <div
          className={`relative ${currentSize.container} bg-gradient-to-r ${currentVariant} rounded-3xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-2xl`}
        >
          {/* Animated background dots */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-1/2 right-1 w-1 h-1 bg-white/25 rounded-full animate-pulse delay-700"></div>
          </div>

          {/* Camera icon with rotation animation */}
          <CameraIcon
            className={`${currentSize.icon} text-white transform group-hover:rotate-12 transition-transform duration-300 relative z-10`}
          />

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full opacity-70 group-hover:animate-bounce delay-100"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full opacity-60 group-hover:animate-bounce delay-300"></div>
      </div>

      {/* App Name with Gradient Text */}
      <div className="text-center mt-4">
        <h1
          className={`${currentSize.text} font-bold bg-gradient-to-r ${currentVariant} bg-clip-text text-transparent mb-1 tracking-tight`}
        >
          Groupify
        </h1>
        <p
          className={`${currentSize.subtitle} text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase`}
        >
          AI Photo Organizer
        </p>
      </div>

      {/* Animated underline */}
      <div className="mt-2 w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
    </div>
  );
};

export default DynamicLogo;


