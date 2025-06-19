import React from "react";

const Modern3DHead = ({ step, captureSteps }) => {
  const currentStep = captureSteps[step];

  const getFaceStyle = () => {
    const baseStyle = {
      transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      transformStyle: "preserve-3d",
    };

    switch (currentStep.id) {
      case "front":
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(0deg) rotateX(0deg)",
        };
      case "right":
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(-25deg) rotateX(0deg)",
        };
      case "left":
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(25deg) rotateX(0deg)",
        };
      case "up":
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(0deg) rotateX(-15deg)",
        };
      case "down":
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(0deg) rotateX(15deg)",
        };
      default:
        return {
          ...baseStyle,
          transform: "perspective(200px) rotateY(0deg) rotateX(0deg)",
        };
    }
  };

  const getGradientColor = () => {
    switch (currentStep.id) {
      case "front":
        return "from-emerald-400 to-green-500";
      case "right":
        return "from-blue-400 to-cyan-500";
      case "left":
        return "from-purple-400 to-violet-500";
      case "up":
        return "from-amber-400 to-orange-500";
      case "down":
        return "from-red-400 to-pink-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
        Position Guide
      </div>

      {/* Modern 3D Face Avatar */}
      <div className="relative">
        {/* Glow effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getGradientColor()} rounded-2xl blur-xl opacity-30 animate-pulse`}
        ></div>

        {/* Main avatar container */}
        <div
          className="relative w-24 h-28 bg-gradient-to-b from-white to-gray-100 dark:from-gray-200 dark:to-gray-300 rounded-2xl shadow-2xl border-2 border-white/50 backdrop-blur-sm"
          style={getFaceStyle()}
        >
          {/* Face features */}
          <div className="absolute inset-2">
            {/* Eyes */}
            <div className="flex justify-between items-center mt-2 px-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
            </div>

            {/* Nose */}
            <div className="flex justify-center mt-2">
              <div className="w-1 h-3 bg-gray-400 rounded-full opacity-60"></div>
            </div>

            {/* Mouth */}
            <div className="flex justify-center mt-2">
              <div className="w-4 h-1 bg-gray-600 rounded-full"></div>
            </div>

            {/* Face outline highlight */}
            <div className="absolute inset-0 border-2 border-gray-400/30 rounded-xl"></div>
          </div>

          {/* Direction arrow overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentStep.id === "right" && (
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-blue-500 text-xl animate-bounce">
                →
              </div>
            )}
            {currentStep.id === "left" && (
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-purple-500 text-xl animate-bounce">
                ←
              </div>
            )}
            {currentStep.id === "up" && (
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-orange-500 text-xl animate-bounce">
                ↑
              </div>
            )}
            {currentStep.id === "down" && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-red-500 text-xl animate-bounce">
                ↓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced instruction text */}
      <div className="text-center space-y-2">
        <div
          className={`text-lg font-bold bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent`}
        >
          {currentStep.title}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
          {currentStep.tip}
        </div>

        {/* Animated instruction indicator */}
        <div className="flex justify-center items-center gap-2 mt-3">
          <div
            className={`w-2 h-2 bg-gradient-to-r ${getGradientColor()} rounded-full animate-ping`}
          ></div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Follow the avatar's position
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mt-4">
        {captureSteps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === step
                ? `bg-gradient-to-r ${getGradientColor()} shadow-lg`
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Modern3DHead;
