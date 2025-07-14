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
        <div className="flex flex-col sm:flex-row h-auto sm:h-28 lg:h-32">
          {/* Event Image/Cover - Responsive sizing */}
          <div className="relative w-full sm:w-32 lg:w-40 h-32 sm:h-full flex-shrink-0 overflow-hidden">
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

          {/* Event Content - Responsive layout with more details */}
          <div className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between min-w-0">
            {/* Left side - Event info with better typography */}
            <div className="flex-1 min-w-0 mb-3 sm:mb-0 sm:mr-4">
              {/* Event Title - Responsive sizing */}
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                {event.name}
              </h3>

              {/* Description on mobile, location on desktop */}
              <div className="mb-2 sm:hidden">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {event.description || "No description provided"}
                </p>
              </div>

              {/* Responsive details layout */}
              <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4 lg:gap-6">
                {/* Location - Always visible */}
                {event.location && (
                  <div className="flex items-center gap-1.5 text-sm sm:text-xs lg:text-sm text-gray-600 dark:text-gray-300">
                    <MapPinIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-indigo-500 flex-shrink-0" />
                    <span className="truncate font-medium sm:max-w-20 lg:max-w-32">
                      {event.location}
                    </span>
                  </div>
                )}

                {/* Date - Responsive formatting */}
                <div className="flex items-center gap-1.5 text-sm sm:text-xs lg:text-sm text-gray-600 dark:text-gray-300">
                  <CalendarIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">
                    {event.startDate ? (
                      <>
                        <span className="sm:hidden">
                          {formatEventDate(event.startDate)}
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

                {/* Members - Always visible */}
                <div className="flex items-center gap-1.5 text-sm sm:text-xs lg:text-sm text-gray-600 dark:text-gray-300">
                  <UserGroupIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-indigo-500 flex-shrink-0" />
                  <span>
                    <span className="font-medium">
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

                {/* Photos - Show on larger screens */}
                <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <PhotoIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>
                    <span className="font-medium">{event.photoCount || 0}</span>{" "}
                    photos
                  </span>
                </div>
              </div>

              {/* Additional details on larger screens */}
              <div className="hidden sm:block mt-2 lg:mt-3">
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 line-clamp-1 lg:line-clamp-2 leading-relaxed">
                  {event.description || "No description provided"}
                </p>
              </div>
            </div>

            {/* Right side - Action button with responsive sizing */}
            <div className="flex-shrink-0 flex justify-end sm:justify-center">
              <button
                onClick={() => onViewEvent && onViewEvent(event.id)}
                className="inline-flex items-center gap-1.5 sm:gap-1 lg:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm sm:text-xs lg:text-sm"
              >
                <EyeIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                <span className="sm:hidden lg:inline">View Event</span>
                <span className="hidden sm:inline lg:hidden">View</span>
                <ChevronRightIcon className="w-3 h-3 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 transition-transform group-hover:translate-x-0.5" />
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
