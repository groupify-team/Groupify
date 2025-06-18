import React from "react";

const Modern3DHead = ({ step, captureSteps }) => {
  const currentStep = captureSteps[step];

  const getFaceStyle = () => {
    const baseStyle = {
      transition: "all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      transformStyle: "preserve-3d",
      transform: "perspective(800px)",
    };

    switch (currentStep.id) {
      case "front":
        return {
          ...baseStyle,
          transform:
            "perspective(800px) rotateY(0deg) rotateX(0deg) rotateZ(0deg)",
        };
      case "right":
        return {
          ...baseStyle,
          transform:
            "perspective(800px) rotateY(-30deg) rotateX(0deg) rotateZ(0deg)",
        };
      case "left":
        return {
          ...baseStyle,
          transform:
            "perspective(800px) rotateY(30deg) rotateX(0deg) rotateZ(0deg)",
        };
      case "up":
        return {
          ...baseStyle,
          transform:
            "perspective(800px) rotateY(0deg) rotateX(-20deg) rotateZ(0deg)",
        };
      case "down":
        return {
          ...baseStyle,
          transform:
            "perspective(800px) rotateY(0deg) rotateX(20deg) rotateZ(0deg)",
        };
      default:
        return baseStyle;
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
    <div className="flex flex-col items-center space-y-6">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-widest uppercase">
        AI Guide
      </div>

      {/* Modern 3D AI Human Face */}
      <div className="relative flex justify-center items-center w-64 h-72">
        {/* Ambient lighting */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getGradientColor()} rounded-full blur-3xl opacity-15 animate-pulse scale-125`}
        ></div>

        {/* Main 3D Head Container */}
        <div
          className="relative w-52 h-64 overflow-visible"
          style={{
            ...getFaceStyle(),
            filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.3))",
          }}
        >
          {/* 3D Neck */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-20"
            style={{
              background:
                "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              borderRadius: "40% 40% 20% 20%",
              transform: "translateZ(-20px) translateX(-50%)",
              boxShadow:
                "inset 0 -10px 20px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* Neck depth */}
            <div
              className="absolute inset-0 rounded-inherit"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)",
              }}
            />
          </div>

          {/* 3D Head Base */}
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-44 h-52"
            style={{
              background:
                "linear-gradient(135deg, #fef3c7 0%, #fbbf24 25%, #f59e0b 75%, #d97706 100%)",
              borderRadius: "50% 50% 45% 45%",
              transform: "translateZ(0px) translateX(-50%)",
              boxShadow: `
                inset -10px -10px 20px rgba(0,0,0,0.1),
                inset 10px 10px 20px rgba(255,255,255,0.3),
                0 20px 40px rgba(0,0,0,0.2)
              `,
            }}
          >
            {/* Face depth layers */}
            <div
              className="absolute inset-2 rounded-inherit"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
              }}
            />
          </div>

          {/* Forehead 3D */}
          <div
            className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-16"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translateZ(5px) translateX(-50%)",
            }}
          />

          {/* 3D Eyes Container */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex gap-8">
            {/* Left Eye 3D */}
            <div className="relative">
              {/* Eye socket */}
              <div
                className="absolute -top-2 -left-2 w-12 h-8"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                  transform: "translateZ(-3px)",
                }}
              />

              {/* Eyeball */}
              <div
                className="w-8 h-6 bg-white overflow-hidden relative"
                style={{
                  borderRadius: "50%",
                  transform: "translateZ(2px)",
                  boxShadow:
                    "inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {/* Iris */}
                <div
                  className="absolute top-1 left-2 w-4 h-4"
                  style={{
                    background:
                      "radial-gradient(circle, #3b82f6 0%, #1e40af  70%, #1e3a8a 100%)",
                    borderRadius: "50%",
                    transform: "translateZ(1px)",
                  }}
                >
                  {/* Pupil */}
                  <div
                    className="absolute top-1 left-1 w-2 h-2 bg-black"
                    style={{
                      borderRadius: "50%",
                      transform: "translateZ(1px)",
                    }}
                  >
                    {/* Eye shine */}
                    <div
                      className="absolute top-0 left-0.5 w-1 h-1 bg-white"
                      style={{
                        borderRadius: "50%",
                        transform: "translateZ(1px)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Eyelid */}
              <div
                className="absolute -top-1 left-0 w-8 h-3"
                style={{
                  background:
                    "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
                  borderRadius: "50% 50% 0 0",
                  transform: "translateZ(3px)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />

              {/* Eyebrow 3D */}
              <div
                className="absolute -top-6 left-0 w-10 h-2"
                style={{
                  background:
                    "linear-gradient(90deg, #92400e 0%, #78350f 50%, #92400e 100%)",
                  borderRadius: "50%",
                  transform: "translateZ(1px)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              />
            </div>

            {/* Right Eye 3D */}
            <div className="relative">
              {/* Eye socket */}
              <div
                className="absolute -top-2 -left-2 w-12 h-8"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                  transform: "translateZ(-3px)",
                }}
              />

              {/* Eyeball */}
              <div
                className="w-8 h-6 bg-white overflow-hidden relative"
                style={{
                  borderRadius: "50%",
                  transform: "translateZ(2px)",
                  boxShadow:
                    "inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {/* Iris */}
                <div
                  className="absolute top-1 left-1.5 w-4 h-4"
                  style={{
                    background:
                      "radial-gradient(circle, #3b82f6 0%, #1e40af 70%, #1e3a8a 100%)",
                    borderRadius: "50%",
                    transform: "translateZ(1px)",
                  }}
                >
                  {/* Pupil */}
                  <div
                    className="absolute top-1 left-1 w-2 h-2 bg-black"
                    style={{
                      borderRadius: "50%",
                      transform: "translateZ(1px)",
                    }}
                  >
                    {/* Eye shine */}
                    <div
                      className="absolute top-0 left-0.5 w-1 h-1 bg-white"
                      style={{
                        borderRadius: "50%",
                        transform: "translateZ(1px)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Eyelid */}
              <div
                className="absolute -top-1 left-0 w-8 h-3"
                style={{
                  background:
                    "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
                  borderRadius: "50% 50% 0 0",
                  transform: "translateZ(3px)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />

              {/* Eyebrow 3D */}
              <div
                className="absolute -top-6 left-0 w-10 h-2"
                style={{
                  background:
                    "linear-gradient(90deg, #92400e 0%, #78350f 50%, #92400e 100%)",
                  borderRadius: "50%",
                  transform: "translateZ(1px)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          </div>

          {/* 3D Nose */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
            {/* Nose bridge */}
            <div
              className="w-2 h-8"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, #f59e0b 50%, #d97706 100%)",
                borderRadius: "50%",
                transform: "translateZ(8px)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            />

            {/* Nose tip */}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-4"
              style={{
                background:
                  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                borderRadius: "50%",
                transform: "translateZ(10px) translateX(-50%)",
                boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
              }}
            >
              {/* Nostrils */}
              <div
                className="absolute bottom-0 left-1 w-1 h-1.5"
                style={{
                  background:
                    "radial-gradient(ellipse, #78350f 0%, #451a03 100%)",
                  borderRadius: "50%",
                  transform: "translateZ(-2px)",
                }}
              />
              <div
                className="absolute bottom-0 right-1 w-1 h-1.5"
                style={{
                  background:
                    "radial-gradient(ellipse, #78350f 0%, #451a03 100%)",
                  borderRadius: "50%",
                  transform: "translateZ(-2px)",
                }}
              />
            </div>
          </div>

          {/* 3D Mouth */}
          <div className="absolute top-42 left-1/2 transform -translate-x-1/2">
            {/* Upper lip */}
            <div
              className="w-10 h-2"
              style={{
                background: "linear-gradient(180deg, #ec4899 0%, #db2777 100%)",
                borderRadius: "50% 50% 0 0",
                transform: "translateZ(5px)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />

            {/* Lower lip */}
            <div
              className="w-10 h-3 mt-0.5"
              style={{
                background: "linear-gradient(180deg, #db2777 0%, #be185d 100%)",
                borderRadius: "0 0 50% 50%",
                transform: "translateZ(6px)",
                boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
              }}
            />
          </div>

          {/* 3D Cheekbones */}
          <div
            className="absolute top-28 left-8 w-8 h-12"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translateZ(4px) rotateZ(15deg)",
            }}
          />
          <div
            className="absolute top-28 right-8 w-8 h-12"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translateZ(4px) rotateZ(-15deg)",
            }}
          />

          {/* 3D Jaw line */}
          <div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-8"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)",
              borderRadius: "50%",
              transform: "translateZ(-2px) translateX(-50%)",
            }}
          />

          {/* Enhanced Direction Indicators */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {currentStep.id === "right" && (
              <div
                className="absolute right-0 top-1/2 transform -translate-y-1/2"
                style={{ transform: "translateZ(50px) translateY(-50%)" }}
              >
                <div className="relative">
                  <div
                    className="text-blue-400 text-6xl font-black animate-pulse filter drop-shadow-lg"
                    style={{
                      textShadow:
                        "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                      animation:
                        "bounce 1s infinite, glow 2s ease-in-out infinite alternate",
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            )}
            {currentStep.id === "left" && (
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2"
                style={{ transform: "translateZ(50px) translateY(-50%)" }}
              >
                <div className="relative">
                  <div
                    className="text-purple-400 text-6xl font-black animate-pulse filter drop-shadow-lg"
                    style={{
                      textShadow:
                        "0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)",
                      animation:
                        "bounce 1s infinite, glow 2s ease-in-out infinite alternate",
                    }}
                  >
                    ←
                  </div>
                </div>
              </div>
            )}
            {currentStep.id === "up" && (
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2"
                style={{ transform: "translateZ(50px) translateX(-50%)" }}
              >
                <div className="relative">
                  <div
                    className="text-orange-400 text-6xl font-black animate-pulse filter drop-shadow-lg"
                    style={{
                      textShadow:
                        "0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)",
                      animation:
                        "bounce 1s infinite, glow 2s ease-in-out infinite alternate",
                    }}
                  >
                    ↑
                  </div>
                </div>
              </div>
            )}
            {currentStep.id === "down" && (
              <div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                style={{ transform: "translateZ(50px) translateX(-50%)" }}
              >
                <div className="relative">
                  <div
                    className="text-red-400 text-6xl font-black animate-pulse filter drop-shadow-lg"
                    style={{
                      textShadow:
                        "0 0 20px rgba(248, 113, 113, 0.5), 0 0 40px rgba(248, 113, 113, 0.3)",
                      animation:
                        "bounce 1s infinite, glow 2s ease-in-out infinite alternate",
                    }}
                  >
                    ↓
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern instruction display */}
      <div className="text-center space-y-3 max-w-sm">
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getGradientColor()} text-white font-semibold text-sm shadow-lg`}
        >
          {currentStep.title}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          {currentStep.tip}
        </p>
      </div>

      <style jsx>{`
        @keyframes glow {
          from {
            filter: brightness(1) drop-shadow(0 0 10px currentColor);
          }
          to {
            filter: brightness(1.2) drop-shadow(0 0 20px currentColor);
          }
        }
      `}</style>
    </div>
  );
};

export default Modern3DHead;
