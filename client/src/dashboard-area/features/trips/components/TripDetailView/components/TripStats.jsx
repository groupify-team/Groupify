// components/TripDetailView/components/TripStats.jsx
import React, { useMemo } from "react";
import {
  PhotoIcon,
  UserGroupIcon,
  ClockIcon,
  TrendingUpIcon,
} from "@heroicons/react/24/outline";

const TripStats = ({ photos = [], members = [], trip }) => {
  const stats = useMemo(() => {
    const totalPhotos = photos.length;
    const totalMembers = members.length;

    // Calculate days active
    const daysActive =
      photos.length > 0
        ? Math.ceil(
            (Date.now() -
              Math.min(
                ...photos.map((p) => new Date(p.uploadedAt).getTime())
              )) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    // Calculate average photos per member
    const avgPhotosPerMember =
      totalMembers > 0 ? Math.round((totalPhotos / totalMembers) * 10) / 10 : 0;

    return {
      totalPhotos,
      totalMembers,
      daysActive,
      avgPhotosPerMember,
    };
  }, [photos, members]);

  const statItems = [
    {
      label: "Total Photos",
      value: stats.totalPhotos,
      icon: PhotoIcon,
      color: "purple",
      bgColor: "bg-purple-50/50 dark:bg-purple-900/20",
      borderColor: "border-purple-200/30 dark:border-purple-800/30",
      textColor: "text-purple-700 dark:text-purple-400",
    },
    {
      label: "Days Active",
      value: stats.daysActive,
      icon: ClockIcon,
      color: "pink",
      bgColor: "bg-pink-50/50 dark:bg-pink-900/20",
      borderColor: "border-pink-200/30 dark:border-pink-800/30",
      textColor: "text-pink-700 dark:text-pink-400",
    },
    {
      label: "Contributors",
      value: stats.totalMembers,
      icon: UserGroupIcon,
      color: "blue",
      bgColor: "bg-blue-50/50 dark:bg-blue-900/20",
      borderColor: "border-blue-200/30 dark:border-blue-800/30",
      textColor: "text-blue-700 dark:text-blue-400",
    },
    {
      label: "Avg per Member",
      value: stats.avgPhotosPerMember,
      icon: TrendingUpIcon,
      color: "emerald",
      bgColor: "bg-emerald-50/50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200/30 dark:border-emerald-800/30",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-purple-200/30 dark:border-purple-800/30">
      {statItems.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.label}
            className={`text-center p-2 sm:p-3 ${stat.bgColor} rounded-lg border ${stat.borderColor} hover:scale-105 transition-transform duration-300 cursor-default`}
          >
            <div className="flex items-center justify-center mb-1">
              <IconComponent className={`w-4 h-4 ${stat.textColor} mr-1`} />
              <p className={`text-sm sm:text-lg font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            <p
              className={`text-xs ${stat.textColor
                .replace("700", "600")
                .replace("400", "500")}`}
            >
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TripStats;
