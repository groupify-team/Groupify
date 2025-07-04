import React from "react";
import {
  MapPinIcon,
  PencilIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const TripHeader = ({ trip, photos, tripMembers, isAdmin, onEditTrip }) => {
  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return null;

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    };

    if (startDate && !endDate) return `Starting ${formatDate(startDate)}`;
    if (!startDate && endDate) return `Ending ${formatDate(endDate)}`;
    if (startDate === endDate) return formatDate(startDate);

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Mobile Layout */}
        <div className="block lg:hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPinIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {trip.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  {trip.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      <span className="truncate">{trip.location}</span>
                    </div>
                  )}
                  {dateRange && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span className="text-xs">{dateRange}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={onEditTrip}
                className="ml-3 p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block p-6">
          <div className="flex items-center justify-between">
            {/* Left - Trip Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPinIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {trip.name}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  {trip.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="text-sm">{trip.location}</span>
                    </div>
                  )}
                  {dateRange && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">{dateRange}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Edit Button Only */}
            {isAdmin && (
              <button
                onClick={onEditTrip}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Trip
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {trip.description && (
          <div className="px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {trip.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripHeader;
