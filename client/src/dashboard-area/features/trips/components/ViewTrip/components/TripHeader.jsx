import React from "react";
import {
  MapPinIcon,
  PhotoIcon,
  UserGroupIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const TripHeader = ({
  trip,
  photos,
  tripMembers,
  isAdmin,
  showUploadForm,
  photoLimitStatus,
  remainingPhotoSlots,
  onEditTrip,
  onToggleUploadForm,
}) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col gap-3 sm:gap-6">
          {/* Left side - Navigation & Trip Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 flex-1">
            <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

            <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {trip.name}
                  </h1>
                  {trip.location && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm flex items-center gap-1 justify-center sm:justify-start">
                      <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {trip.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Stats & Actions */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4">
            {/* Trip Stats */}
            <div className="flex items-center gap-3 sm:gap-6 justify-center sm:justify-start">
              <div className="text-center">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                  <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-bold text-base sm:text-lg lg:text-xl text-indigo-600 dark:text-indigo-400">
                    {photos.length}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                  Photos
                </p>
              </div>

              <div className="w-px h-6 sm:h-8 bg-gray-300 dark:bg-gray-600"></div>

              <div className="text-center">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-bold text-base sm:text-lg lg:text-xl text-purple-600 dark:text-purple-400">
                    {tripMembers.length}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                  Members
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {isAdmin && (
                <button
                  onClick={onEditTrip}
                  className="w-full sm:w-auto px-1 xs:px-2 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm max-[320px]:px-0.5 max-[320px]:text-[10px] max-[320px]:gap-1"
                >
                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  Edit Trip
                </button>
              )}
              <button
                onClick={onToggleUploadForm}
                disabled={photoLimitStatus === "full" && !showUploadForm}
                className={`w-full sm:w-auto px-1 xs:px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm max-[320px]:px-0.5 max-[320px]:text-[10px] max-[320px]:gap-1 ${
                  photoLimitStatus === "full" && !showUploadForm
                    ? "bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    : showUploadForm
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    : photoLimitStatus === "warning"
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                }`}
              >
                {photoLimitStatus === "full" && !showUploadForm ? (
                  <>
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                      />
                    </svg>
                    Limit Reached
                  </>
                ) : showUploadForm ? (
                  <>
                    <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Add Photos ({remainingPhotoSlots} left)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trip Description */}
        {trip.description && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {trip.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripHeader;
