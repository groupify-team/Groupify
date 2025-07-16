// components/EventCard.jsx - Responsive compact design with better typography and more details
import React, { memo } from "react";
import {
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon,
  EyeIcon,
  ChevronRightIcon,
  SparklesIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { formatEventDate, getEventstatus } from "@events/utils/eventHelpers";

const EventCard = memo(({ event, onViewEvent }) => {
  const eventstatus = getEventstatus(event);

  return (
    <div className="group relative" data-event-id={event.id}>
      {/* Compact Responsive Glass morphism card */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:bg-white/80 dark:hover:bg-gray-800/80 relative z-10">
        <div className="flex flex-row h-28 sm:h-28 lg:h-32">
          {" "}
          {/* Event Image/Cover - Consistent sizing across all screens */}
          <div className="relative w-20 sm:w-32 lg:w-40 h-full flex-shrink-0 overflow-hidden">
            {event.coverPhoto ? (
              <img
                src={event.coverPhoto}
                alt={event.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden">
                {/* Responsive icon sizing */}
                <div className="relative z-10 flex flex-col items-center text-white">
                  <SparklesIcon className="w-8 h-8 sm:w-6 sm:h-6 lg:w-8 lg:h-8 drop-shadow-lg" />
                </div>
              </div>
            )}

            {/* Responsive Status Badge */}
            <div className="absolute top-2 left-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                  eventstatus.color === "green"
                    ? "bg-emerald-100/90 text-emerald-800 border-emerald-200"
                    : eventstatus.color === "blue"
                    ? "bg-blue-100/90 text-blue-800 border-blue-200"
                    : eventstatus.color === "purple"
                    ? "bg-purple-100/90 text-purple-800 border-purple-200"
                    : "bg-gray-100/90 text-gray-800 border-gray-200"
                }`}
              >
                {/* Responsive badge text */}
                <span className="sm:hidden">
                  {eventstatus.status === "completed" && "✓"}
                  {eventstatus.status === "upcoming" && "⏰"}
                  {eventstatus.status === "ongoing" && "🔴"}
                  {eventstatus.status === "draft" && "📝"}
                </span>
                <span className="hidden sm:inline">
                  {eventstatus.status === "completed" && "Done"}
                  {eventstatus.status === "upcoming" && "Soon"}
                  {eventstatus.status === "ongoing" && "Live"}
                  {eventstatus.status === "draft" && "Draft"}
                </span>
              </span>
            </div>
          </div>
          {/* Event Content - Responsive layout with better data organization */}
          <div className="flex-1 p-3 sm:p-5 lg:p-6 flex flex-row items-center justify-between min-w-0">
            {/* Left side - Event info with responsive typography */}
            <div className="flex-1 min-w-0 mr-2 sm:mr-4">
              {/* Event Title - No truncation on larger screens */}
              <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-3 lg:mb-4 line-clamp-1 sm:line-clamp-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                {event.name}
              </h3>

              {/* Description on mobile only */}
              <div className="mb-2 sm:hidden">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {event.description || "No description provided"}
                </p>
              </div>

              {/* Use all available space - no wrapping on larger screens */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 lg:gap-6">
                {/* Location - No truncation, use available space */}
                {event.location && (
                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-sm sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
                    <MapPinIcon className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium">{event.location}</span>
                  </div>
                )}

                {/* Date - Better formatting and sizing */}
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-sm sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
                  <CalendarIcon className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-indigo-500 flex-shrink-0" />
                  <span className="truncate font-medium">
                    {event.startDate ? (
                      <>
                        <span className="sm:hidden">
                          {formatEventDate(event.startDate).split(",")[0]}
                        </span>
                        <span className="hidden sm:inline lg:hidden">
                          {formatEventDate(event.startDate).split(",")[0]}
                        </span>
                        <span className="hidden lg:inline">
                          {formatEventDate(event.startDate)}
                        </span>
                      </>
                    ) : (
                      <span className="italic text-gray-400">No date</span>
                    )}
                  </span>
                </div>

                {/* Members - Better sizing for larger screens */}
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-sm sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
                  <UserGroupIcon className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-indigo-500 flex-shrink-0" />
                  <span className="font-medium">
                    <span className="font-bold">
                      {event.members?.length || 1}
                    </span>
                    <span className="hidden sm:inline lg:hidden"> mbr</span>
                    <span className="sm:hidden lg:inline">
                      {" "}
                      {(event.members?.length || 1) === 1
                        ? "member"
                        : "members"}
                    </span>
                  </span>
                </div>

                {/* Photos - Better presentation on larger screens */}
                <div className="hidden lg:flex items-center gap-3 text-base text-gray-600 dark:text-gray-300">
                  <PhotoIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">
                    <span className="font-bold">{event.photoCount || 0}</span>{" "}
                    photos
                  </span>
                </div>
              </div>

              {/* Additional details - better spacing and sizing */}
              <div className="hidden sm:block mt-3 lg:mt-4">
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 line-clamp-1 lg:line-clamp-2 leading-relaxed">
                  {event.description || "No description provided"}
                </p>
              </div>
            </div>

            {/* Right side - Action button consistent sizing */}
            <div className="flex-shrink-0 flex justify-center">
              <button
                onClick={() => onViewEvent && onViewEvent(event.id)}
                className="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-xs sm:text-sm"
              >
                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">View</span>
                <ChevronRightIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

EventCard.displayName = "EventCard";

export default EventCard;
