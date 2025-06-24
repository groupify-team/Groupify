import React, { useState, useEffect, useRef } from "react";
import {
  UserGroupIcon,
  MapPinIcon,
  CameraIcon,
  HeartIcon,
  BuildingOffice2Icon,
  MusicalNoteIcon,
  FaceSmileIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import {
  Buildings,
  Bank,
  TreePalm,
  MapPin,
  UsersThree,
  Camera,
} from "@phosphor-icons/react";

const PhotoStack3D = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("scattered");
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Photo data with different trip categories
  const photos = [
    {
      id: 1,
      trip: "Dubai",
      type: "landmark",
      icon: <Buildings size={32} color="white" weight="bold" />,
      color: "from-yellow-500 to-orange-400",
      shadowColor: "shadow-yellow-500/30",
      glowColor: "shadow-orange-400/50",
      people: 3,
      location: "Burj Khalifa",
    },
    {
      id: 2,
      trip: "New York",
      type: "landmark",
      icon: <Bank size={32} color="white" weight="bold" />,
      color: "from-indigo-600 to-blue-500",
      shadowColor: "shadow-indigo-600/30",
      glowColor: "shadow-blue-500/50",
      people: 4,
      location: "Statue of Liberty",
    },
    {
      id: 3,
      trip: "Rio de Janeiro",
      type: "landscape",
      icon: <TreePalm size={32} color="white" weight="bold" />,
      color: "from-green-500 to-lime-400",
      shadowColor: "shadow-green-500/30",
      glowColor: "shadow-lime-400/50",
      people: 2,
      location: "Christ the Redeemer",
    },
    {
      id: 4,
      trip: "London",
      type: "group",
      icon: <UsersThree size={32} color="white" weight="bold" />,
      color: "from-red-500 to-pink-400",
      shadowColor: "shadow-red-500/30",
      glowColor: "shadow-pink-400/50",
      people: 5,
      location: "Big Ben",
    },
    {
      id: 5,
      trip: "Beijing",
      type: "historic",
      icon: <Buildings size={32} color="white" weight="bold" />,
      color: "from-orange-500 to-yellow-400",
      shadowColor: "shadow-orange-500/30",
      glowColor: "shadow-yellow-400/50",
      people: 0,
      location: "Great Wall of China",
    },
    {
      id: 6,
      trip: "Cairo",
      type: "historic",
      icon: <Bank size={32} color="white" weight="bold" />,
      color: "from-yellow-600 to-amber-500",
      shadowColor: "shadow-yellow-600/30",
      glowColor: "shadow-amber-500/50",
      people: 1,
      location: "Pyramids of Giza",
    },
    {
      id: 7,
      trip: "Sydney",
      type: "architecture",
      icon: <Buildings size={32} color="white" weight="bold" />,
      color: "from-cyan-500 to-blue-400",
      shadowColor: "shadow-cyan-500/30",
      glowColor: "shadow-blue-400/50",
      people: 3,
      location: "Sydney Opera House",
    },
    {
      id: 8,
      trip: "San Francisco",
      type: "landmark",
      icon: <MapPin size={32} color="white" weight="bold" />,
      color: "from-rose-500 to-pink-400",
      shadowColor: "shadow-rose-500/30",
      glowColor: "shadow-pink-400/50",
      people: 0,
      location: "Golden Gate Bridge",
    },
  ];

  // Mouse tracking for 3D effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setMousePosition({
          x: (e.clientX - centerX) / (rect.width / 2),
          y: (e.clientY - centerY) / (rect.height / 2),
        });
      }
    };

    if (isHovered) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isHovered]);

  // Auto-cycle through animation phases
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => {
        switch (prev) {
          case "scattered":
            return "organizing";
          case "organizing":
            return "detecting";
          case "detecting":
            return "sharing";
          case "sharing":
            return "scattered";
          default:
            return "scattered";
        }
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getPhotoStyle = (photo, index) => {
    const baseDelay = index * 100;
    let transform = "";
    let zIndex = photos.length - index;

    if (isHovered) {
      // Fan out effect on hover
      const angle = (index - photos.length / 2) * 15;
      const distance = 80 + index * 10;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;
      const rotateY = mousePosition.x * 10;
      const rotateX = -mousePosition.y * 10;

      transform = `translate3d(${x}px, ${y}px, ${index * 10}px) rotateX(${
        rotateX + angle * 0.5
      }deg) rotateY(${rotateY}deg) rotateZ(${angle * 0.3}deg)`;
      zIndex = index + 50;
    } else {
      switch (animationPhase) {
        case "scattered":
          // Random scattered positions - CENTERED
          const scatterX = Math.sin(index * 0.7) * 80;
          const scatterY = Math.cos(index * 0.9) * 60;
          const scatterRotate = Math.sin(index) * 20;
          transform = `translate3d(${scatterX}px, ${scatterY}px, 0px) rotateZ(${scatterRotate}deg)`;
          break;

        case "organizing":
          // Group by trip/location - CENTERED
          const tripGroups = { Paris: 0, Tokyo: 1, Rome: 2, Bali: 3 };
          const groupIndex = tripGroups[photo.trip] || 0;
          const positionInGroup = photos
            .filter((p) => p.trip === photo.trip)
            .indexOf(photo);
          const groupX = (groupIndex - 1.5) * 80; // Reduced from 100
          const groupY = positionInGroup * 12; // Reduced from 15
          transform = `translate3d(${groupX}px, ${groupY}px, ${
            positionInGroup * 5
          }px) rotateZ(${positionInGroup * 5}deg)`;
          break;

        case "detecting":
          // Highlight photos with people - CENTERED
          if (photo.people > 0) {
            const bounceY = Math.sin(Date.now() * 0.003 + index) * 10;
            transform = `translate3d(0px, ${bounceY}px, 20px) rotateY(5deg)`;
            zIndex = photos.length + 10;
          } else {
            transform = `translate3d(0px, 0px, 0px) rotateZ(${
              index * 3
            }deg) scale(0.9)`;
          }
          break;

        case "sharing":
          // Circular formation for sharing - CENTERED
          const shareAngle = (index / photos.length) * 360;
          const shareRadius = 90; // Reduced from 120
          const shareX = Math.cos((shareAngle * Math.PI) / 180) * shareRadius;
          const shareY = Math.sin((shareAngle * Math.PI) / 180) * shareRadius;
          transform = `translate3d(${shareX}px, ${shareY}px, 10px) rotateZ(${shareAngle}deg)`;
          break;

        default:
          // Default centered stack
          transform = `translate3d(0px, ${index * 3}px, ${
            index * -2
          }px) rotateZ(${index * 2}deg)`;
      }
    }

    return {
      transform: `translate(-50%, -50%) ${transform}`, // Add this translate(-50%, -50%) before existing transform
      zIndex,
      transitionDelay: `${baseDelay}ms`,
    };
  };

  const getPhotoClasses = (photo, index) => {
    let classes = `absolute w-24 h-32 bg-gradient-to-br ${photo.color} rounded-2xl shadow-2xl ${photo.shadowColor} transition-all duration-700 ease-out cursor-pointer border-2 border-white/20 backdrop-blur-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`;

    if (isHovered) {
      classes += ` hover:scale-110 ${photo.glowColor}`;
    }

    if (animationPhase === "detecting" && photo.people > 0) {
      classes += ` ring-2 ring-green-400/70 ${photo.glowColor}`;
    }

    if (animationPhase === "sharing") {
      classes += ` ${photo.glowColor} ring-2 ring-blue-400/50`;
    }

    return classes;
  };

  return (
    <div className="relative w-full min-h-[500px] flex items-center justify-center p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-gray-800/30 dark:to-gray-900/30 rounded-3xl backdrop-blur-sm"></div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-40 animate-float"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Main Photo Stack Container */}
      <div
        ref={containerRef}
        className="relative w-96 h-96 mx-auto perspective-1000"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Photo Stack */}
        {photos.map((photo, index) => {
          const photoStyle = getPhotoStyle(photo, index);

          return (
            <div
              key={photo.id}
              className={getPhotoClasses(photo, index)}
              style={{
                ...photoStyle,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Photo Content */}
              <div className="relative w-full h-full p-3 flex flex-col justify-between">
                {/* Top Section - Trip Name */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {photo.trip}
                  </span>
                  {photo.people > 0 && (
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="w-3 h-3 text-white/80" />
                      <span className="text-xs text-white/80">
                        {photo.people}
                      </span>
                    </div>
                  )}
                </div>

                {/* Center - Large Icon */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative">
                    {/* Icon Glow Background */}
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md scale-150 animate-pulse"></div>
                    {/* Main Icon */}
                    <div className="relative text-4xl filter drop-shadow-2xl transform hover:scale-110 transition-transform duration-300">
                      <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
                        {photo.icon}
                      </div>
                    </div>
                    {/* Sparkle Effects */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
                    <div
                      className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                </div>

                {/* Bottom Section - Location */}
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="w-3 h-3 text-white/70" />
                  <span className="text-xs text-white/90 font-medium truncate">
                    {photo.location}
                  </span>
                </div>

                {/* Hover Overlay */}
                {isHovered && (
                  <div className="absolute inset-0 bg-black/10 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white/90 text-center">
                      <CameraIcon className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">View Photo</div>
                    </div>
                  </div>
                )}

                {/* Detection Indicators */}
                {animationPhase === "detecting" && photo.people > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Sharing Indicators */}
                {animationPhase === "sharing" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                    <HeartIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Photo Shadow/Reflection */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none"
                style={{
                  transform: "translateZ(-1px)",
                }}
              />
            </div>
          );
        })}

        {/* Central Processing Indicator */}
        {(animationPhase === "organizing" ||
          animationPhase === "detecting") && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-spin">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <div className="text-white text-lg">🧠</div>
                </div>
              </div>
            </div>

            {/* Processing Rings */}
            <div className="absolute inset-0 w-16 h-16 border-2 border-blue-400/50 rounded-full animate-ping"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-2 border-purple-400/50 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 dark:border-gray-700/50 shadow-lg">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              animationPhase === "scattered"
                ? "bg-gray-400"
                : animationPhase === "organizing"
                ? "bg-blue-500"
                : animationPhase === "detecting"
                ? "bg-green-500"
                : "bg-purple-500"
            }`}
          ></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {animationPhase === "scattered" && "Photos Scattered"}
            {animationPhase === "organizing" && "AI Organizing by Trip"}
            {animationPhase === "detecting" && "Face Detection Active"}
            {animationPhase === "sharing" && "Ready to Share"}
          </span>
        </div>
      </div>

      {/* Interaction Hint */}
      {!isHovered && (
        <div className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1 rounded-full animate-bounce">
          Hover to explore
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
  .perspective-1000 {
    perspective: 1000px;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
      opacity: 0.8;
    }
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
`}</style>
    </div>
  );
};

export default PhotoStack3D;
