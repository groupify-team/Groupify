// REPLACE YOUR ENTIRE Modern3DHead.jsx FILE WITH THIS:

import React from "react";

const Modern3DHead = ({ step, captureSteps }) => {
  // Add safety checks
  if (!captureSteps || !captureSteps[step]) {
    return null;
  }

  const currentStep = captureSteps[step];

  const getFaceStyle = () => {
    const baseStyle = {
      transition: "all 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)",
      transformStyle: "preserve-3d",
    };

    switch (currentStep.id) {
      case "front":
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(0deg) rotateX(0deg) translateZ(10px)",
        };
      case "slight_right":
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(-20deg) rotateX(0deg) translateZ(10px)",
        };
      case "slight_left":
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(20deg) rotateX(0deg) translateZ(10px)",
        };
      case "up_face":
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(0deg) rotateX(-15deg) translateZ(10px)",
        };
      case "down_face":
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(0deg) rotateX(15deg) translateZ(10px)",
        };
      default:
        return {
          ...baseStyle,
          transform:
            "perspective(300px) rotateY(0deg) rotateX(0deg) translateZ(10px)",
        };
    }
  };

  const getGradientColor = () => {
    switch (currentStep.id) {
      case "front":
        return "from-emerald-400 via-green-400 to-teal-500";
      case "slight_right":
        return "from-blue-400 via-cyan-400 to-sky-500";
      case "slight_left":
        return "from-purple-400 via-violet-400 to-indigo-500";
      case "up_face":
        return "from-orange-400 via-red-400 to-pink-500";
      case "down_face":
        return "from-pink-400 via-rose-400 to-red-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getPulseColor = () => {
    switch (currentStep.id) {
      case "front":
        return "shadow-emerald-400/50";
      case "slight_right":
        return "shadow-blue-400/50";
      case "slight_left":
        return "shadow-purple-400/50";
      case "up_face":
        return "shadow-orange-400/50";
      case "down_face":
        return "shadow-pink-400/50";
      default:
        return "shadow-gray-400/50";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Enhanced 3D Face Avatar */}
      <div className="relative">
        {/* Multiple glow layers for depth */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getGradientColor()} rounded-3xl blur-2xl opacity-40 animate-pulse scale-110`}
        ></div>
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getGradientColor()} rounded-3xl blur-xl opacity-30 animate-pulse scale-105`}
        ></div>

        {/* Main avatar container with enhanced 3D effect */}
        <div
          className={`relative w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 rounded-3xl shadow-2xl ${getPulseColor()} border-3 border-white/80 backdrop-blur-sm overflow-hidden`}
          style={getFaceStyle()}
        >
          {/* Enhanced face features with better proportions */}
          <div className="absolute inset-0 p-2 sm:p-3">
            {/* Forehead highlight */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-white/20 rounded-full blur-sm"></div>

            {/* Eyes with enhanced animation */}
            <div className="flex justify-between items-center mt-3 sm:mt-4 px-2 sm:px-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-800 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/40 rounded-full animate-ping"></div>
              </div>
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-800 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/40 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Nose with shadow */}
            <div className="flex justify-center mt-2 sm:mt-3">
              <div className="relative">
                <div className="w-1 h-3 sm:h-4 bg-gray-400/60 rounded-full"></div>
                <div className="absolute -right-0.5 top-1 w-1 h-2 bg-gray-300/40 rounded-full blur-sm"></div>
              </div>
            </div>

            {/* Mouth with subtle smile */}
            <div className="flex justify-center mt-2 sm:mt-3">
              <div className="w-4 sm:w-5 h-1 bg-gray-600 rounded-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-full"></div>
              </div>
            </div>

            {/* Enhanced face outline with multiple layers */}
            <div className="absolute inset-1 border-2 border-gray-300/20 rounded-2xl"></div>
            <div className="absolute inset-2 border border-gray-400/10 rounded-xl"></div>
          </div>

          {/* Dynamic direction indicators with enhanced animations */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {currentStep.id === "slight_right" && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                <div
                  className={`text-blue-500 text-lg sm:text-xl animate-bounce bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent font-bold`}
                >
                  →
                </div>
                <div className="absolute inset-0 text-blue-300 text-lg sm:text-xl animate-ping opacity-50">
                  →
                </div>
              </div>
            )}
            {currentStep.id === "slight_left" && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                <div
                  className={`text-purple-500 text-lg sm:text-xl animate-bounce bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent font-bold`}
                >
                  ←
                </div>
                <div className="absolute inset-0 text-purple-300 text-lg sm:text-xl animate-ping opacity-50">
                  ←
                </div>
              </div>
            )}
            {currentStep.id === "up_face" && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                <div
                  className={`text-orange-500 text-lg sm:text-xl animate-bounce bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent font-bold`}
                >
                  ↑
                </div>
                <div className="absolute inset-0 text-orange-300 text-lg sm:text-xl animate-ping opacity-50">
                  ↑
                </div>
              </div>
            )}
            {currentStep.id === "down_face" && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                <div
                  className={`text-pink-500 text-lg sm:text-xl animate-bounce bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent font-bold`}
                >
                  ↓
                </div>
                <div className="absolute inset-0 text-pink-300 text-lg sm:text-xl animate-ping opacity-50">
                  ↓
                </div>
              </div>
            )}
            {currentStep.id === "front" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`w-1 h-1 bg-gradient-to-r ${getGradientColor()} rounded-full animate-ping`}
                ></div>
              </div>
            )}
          </div>

          {/* Scanning line effect */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div
              className={`absolute inset-x-0 h-0.5 bg-gradient-to-r ${getGradientColor()} opacity-60 animate-pulse animate-scanning-line`}
            ></div>
          </div>
        </div>

        {/* Floating particles for premium feel */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-gradient-to-r ${getGradientColor()} rounded-full opacity-40 animate-float`}
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced instruction with better typography */}
      <div className="text-center mt-3 space-y-1">
        <div
          className={`text-sm sm:text-base font-bold bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent drop-shadow-sm`}
        >
          {currentStep.title}
        </div>

        {/* Animated instruction indicator */}
        <div className="flex justify-center items-center gap-1">
          <div
            className={`w-1 h-1 bg-gradient-to-r ${getGradientColor()} rounded-full animate-ping`}
          ></div>
          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            {currentStep.icon}
          </span>
          <div
            className={`w-1 h-1 bg-gradient-to-r ${getGradientColor()} rounded-full animate-ping`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Modern3DHead;
