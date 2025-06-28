// QuickStatsCard.jsx - Quick data overview widget
import React from "react";
import {
  CameraIcon,
  MapIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const QuickStatsCard = ({ trips, friends, profilePhotos, hasProfile }) => {
  const stats = [
    {
      id: "trips",
      label: "Trips",
      value: trips.length,
      icon: MapIcon,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient:
        "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      borderColor: "border-blue-200/30 dark:border-blue-700/30",
      textColor: "text-blue-800 dark:text-blue-200",
      subColor: "text-blue-600 dark:text-blue-400",
      description: "Created",
    },
    {
      id: "friends",
      label: "Friends",
      value: friends.length,
      icon: UserGroupIcon,
      gradient: "from-green-500 to-emerald-600",
      bgGradient:
        "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      borderColor: "border-green-200/30 dark:border-green-700/30",
      textColor: "text-green-800 dark:text-green-200",
      subColor: "text-green-600 dark:text-green-400",
      description: "Connected",
    },
    {
      id: "photos",
      label: "Photos",
      value: hasProfile ? profilePhotos.length : 0,
      icon: CameraIcon,
      gradient: "from-purple-500 to-pink-600",
      bgGradient:
        "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      borderColor: "border-purple-200/30 dark:border-purple-700/30",
      textColor: "text-purple-800 dark:text-purple-200",
      subColor: "text-purple-600 dark:text-purple-400",
      description: "In Profile",
    },
    {
      id: "recognition",
      label: "AI Status",
      value: hasProfile ? "Active" : "Inactive",
      icon: SparklesIcon,
      gradient: hasProfile
        ? "from-orange-500 to-red-500"
        : "from-gray-400 to-gray-500",
      bgGradient: hasProfile
        ? "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
        : "from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20",
      borderColor: hasProfile
        ? "border-orange-200/30 dark:border-orange-700/30"
        : "border-gray-200/30 dark:border-gray-600/30",
      textColor: hasProfile
        ? "text-orange-800 dark:text-orange-200"
        : "text-gray-600 dark:text-gray-400",
      subColor: hasProfile
        ? "text-orange-600 dark:text-orange-400"
        : "text-gray-500 dark:text-gray-500",
      description: "Recognition",
    },
  ];

  const getTotalActivity = () => {
    return (
      trips.length + friends.length + (hasProfile ? profilePhotos.length : 0)
    );
  };

  const getActivityLevel = () => {
    const total = getTotalActivity();
    if (total === 0)
      return { level: "Getting Started", color: "text-gray-500", emoji: "🌱" };
    if (total < 10)
      return { level: "Building Up", color: "text-blue-500", emoji: "🚀" };
    if (total < 25)
      return { level: "Active User", color: "text-green-500", emoji: "⭐" };
    if (total < 50)
      return { level: "Power User", color: "text-purple-500", emoji: "🔥" };
    return { level: "Super User", color: "text-orange-500", emoji: "🏆" };
  };

  const activityLevel = getActivityLevel();

  return (
    <div className="space-y-4">
      {/* Activity Level Header */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-700/40 border border-gray-200/50 dark:border-gray-600/50`}
        >
          <span className="text-lg">{activityLevel.emoji}</span>
          <span className={`font-semibold ${activityLevel.color}`}>
            {activityLevel.level}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            • {getTotalActivity()} total items
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.id}
              className={`bg-gradient-to-r ${stat.bgGradient} rounded-lg p-4 sm:p-6 text-center border ${stat.borderColor} hover:scale-105 transition-all duration-200 cursor-pointer group`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:shadow-md transition-shadow`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              {/* Value */}
              <p
                className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.textColor} mb-1`}
              >
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>

              {/* Label */}
              <p className={`text-xs sm:text-sm ${stat.subColor} font-medium`}>
                {stat.label}
              </p>

              {/* Description */}
              <p className={`text-xs ${stat.subColor} opacity-75 mt-1`}>
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Account Completion */}
        <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200/30 dark:border-gray-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Setup
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {hasProfile
                ? "100%"
                : Math.round(
                    (((trips.length > 0 ? 1 : 0) +
                      (friends.length > 0 ? 1 : 0)) /
                      3) *
                      100
                  )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{
                width: `${
                  hasProfile
                    ? 100
                    : Math.round(
                        (((trips.length > 0 ? 1 : 0) +
                          (friends.length > 0 ? 1 : 0)) /
                          3) *
                          100
                      )
                }%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {hasProfile ? "Complete!" : "Add face profile to complete"}
          </p>
        </div>

        {/* Social Engagement */}
        <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200/30 dark:border-gray-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Social Level
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.min(Math.round((friends.length / 10) * 100), 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.round((friends.length / 10) * 100),
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {friends.length >= 10
              ? "Social butterfly!"
              : `${10 - friends.length} more to max`}
          </p>
        </div>

        {/* Trip Activity */}
        <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200/30 dark:border-gray-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trip Explorer
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.min(Math.round((trips.length / 5) * 100), 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.round((trips.length / 5) * 100),
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {trips.length >= 5
              ? "Travel expert!"
              : `${5 - trips.length} more to level up`}
          </p>
        </div>
      </div>

      {/* Quick Actions Based on Stats */}
      {getTotalActivity() === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              🎉 Welcome to Groupify!
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Start by creating your first trip or adding friends to begin your
              journey.
            </p>
          </div>
        </div>
      )}

      {getTotalActivity() > 0 && !hasProfile && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
              ✨ Enhance Your Experience
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Add a face profile to enable automatic photo recognition in your
              trips!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStatsCard;
