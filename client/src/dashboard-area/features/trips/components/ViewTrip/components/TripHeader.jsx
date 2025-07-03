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
        {/* Mobile/Tablet Layout */}
        <div className="block xl:hidden">
          <div className="flex flex-col gap-4">
            {/* Trip Title and Location */}
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <MapPinIcon className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {trip.name}
                </h1>
              </div>
              {trip.location && (
                <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1 justify-center">
                  <MapPinIcon className="w-3 h-3" />
                  {trip.location}
                </p>
              )}
            </div>

            {/* Stats and Actions in Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stats Column */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 justify-center">
                    <PhotoIcon className="w-4 h-4" />
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                      {photos.length}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Photos</p>
                </div>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 justify-center">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      {tripMembers.length}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Members</p>
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex flex-col gap-2">
                {isAdmin && (
                  <button
                    onClick={onEditTrip}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-3 h-3" />
                    Edit Trip
                  </button>
                )}
                <button
                  onClick={onToggleUploadForm}
                  disabled={photoLimitStatus === "full"}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs flex items-center justify-center gap-2 ${
                    photoLimitStatus === "full"
                      ? "bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      : photoLimitStatus === "warning"
                      ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  }`}
                >
                  <PlusIcon className="w-3 h-3" />
                  Add Photos ({remainingPhotoSlots})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden xl:flex flex-col gap-6">
          <div className="flex items-center justify-between">
            {/* Left side - Trip Info */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPinIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {trip.name}
                </h1>
                {trip.location && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {trip.location}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Stats & Actions */}
            <div className="flex items-center gap-6">
              {/* Trip Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <PhotoIcon className="w-5 h-5" />
                    <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">
                      {photos.length}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Photos</p>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <UserGroupIcon className="w-5 h-5" />
                    <span className="font-bold text-xl text-purple-600 dark:text-purple-400">
                      {tripMembers.length}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Members</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isAdmin && (
                  <button
                    onClick={onEditTrip}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Trip
                  </button>
                )}
                <button
                  onClick={onToggleUploadForm}
                  disabled={photoLimitStatus === "full"}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2 ${
                    photoLimitStatus === "full"
                      ? "bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      : photoLimitStatus === "warning"
                      ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  }`}
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Photos ({remainingPhotoSlots} left)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Description */}
        {trip.description && (
          <div className="mt-4 xl:mt-6 pt-4 xl:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm xl:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {trip.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripHeader;
