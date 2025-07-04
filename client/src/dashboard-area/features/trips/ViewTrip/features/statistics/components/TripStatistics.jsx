import React from "react";
import {
  PhotoIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

const TripStatistics = ({ trip, photos, tripMembers }) => {
  const getTripDuration = () => {
    if (!trip.startDate || !trip.endDate) return null;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (remainingDays === 0) return `${weeks} week${weeks > 1 ? "s" : ""}`;
      return `${weeks}w ${remainingDays}d`;
    }

    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  };

  const getPhotosPerDay = () => {
    if (!photos.length || !trip.startDate) return 0;

    const tripStart = new Date(trip.startDate);
    const now = new Date();
    const daysSinceStart = Math.max(
      1,
      Math.ceil((now - tripStart) / (1000 * 60 * 60 * 24))
    );

    return (photos.length / daysSinceStart).toFixed(1);
  };

  const getPhotosPerMember = () => {
    if (!photos.length || !tripMembers.length) return 0;
    return Math.round((photos.length / tripMembers.length) * 10) / 10;
  };

  const getDaysActive = () => {
    if (!photos.length) return 0;

    const dates = photos.map((p) => new Date(p.uploadedAt).getTime());
    const oldestDate = Math.min(...dates);
    const newestDate = Math.max(...dates);

    return Math.max(
      1,
      Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
    );
  };

  const getMostActiveDay = () => {
    if (!photos.length) return null;

    // Group photos by day
    const photosByDay = {};
    photos.forEach((photo) => {
      const day = new Date(photo.uploadedAt).toDateString();
      photosByDay[day] = (photosByDay[day] || 0) + 1;
    });

    // Find day with most photos
    const maxPhotos = Math.max(...Object.values(photosByDay));
    const mostActiveDay = Object.keys(photosByDay).find(
      (day) => photosByDay[day] === maxPhotos
    );

    return {
      day: new Date(mostActiveDay).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: maxPhotos,
    };
  };

  const duration = getTripDuration();
  const photosPerDay = getPhotosPerDay();
  const photosPerMember = getPhotosPerMember();
  const daysActive = getDaysActive();
  const mostActiveDay = getMostActiveDay();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 p-4 border-b border-emerald-200/30 dark:border-emerald-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Trip Statistics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Insights about your trip activity
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Photos */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/40 rounded-xl p-3 border border-indigo-200/50 dark:border-indigo-800/50">
            <div className="flex items-center gap-2 mb-2">
              <PhotoIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Photos
              </span>
            </div>
            <p className="text-xl font-bold text-indigo-900 dark:text-indigo-200">
              {photos.length}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              total uploaded
            </p>
          </div>

          {/* Total Members */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/40 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-2 mb-2">
              <UserGroupIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Members
              </span>
            </div>
            <p className="text-xl font-bold text-purple-900 dark:text-purple-200">
              {tripMembers.length}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              in this trip
            </p>
          </div>

          {/* Trip Duration */}
          {duration && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/40 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Duration
                </span>
              </div>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                {duration.split(" ")[0]}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {duration.split(" ")[1] || "duration"}
              </p>
            </div>
          )}

          {/* Photos per Day */}
          {photos.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/40 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Per Day
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                {photosPerDay}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                photos/day
              </p>
            </div>
          )}

          {/* Photos per Member */}
          {photos.length > 0 && tripMembers.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/40 rounded-xl p-3 border border-teal-200/50 dark:border-teal-800/50">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  Average
                </span>
              </div>
              <p className="text-xl font-bold text-teal-900 dark:text-teal-200">
                {photosPerMember}
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-400">
                per member
              </p>
            </div>
          )}

          {/* Most Active Day */}
          {mostActiveDay && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/40 rounded-xl p-3 border border-orange-200/50 dark:border-orange-800/50">
              <div className="flex items-center gap-2 mb-2">
                <FireIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Best Day
                </span>
              </div>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-200">
                {mostActiveDay.count}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                on {mostActiveDay.day}
              </p>
            </div>
          )}
        </div>

        {/* Additional Info Row */}
        {photos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  Active for {daysActive} day{daysActive > 1 ? "s" : ""}
                </span>
              </div>

              {trip.startDate && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    Started {new Date(trip.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <ChartBarIcon className="w-4 h-4" />
                <span>
                  {Math.round((photos.length / 100) * 100)}% storage used
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripStatistics;
