// components/TripDetailView/PhotosSection.jsx
import React from "react";
import {
  PhotoIcon,
  EyeIcon,
  SparklesIcon,
  PlusIcon,
  CameraIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const PhotosSection = ({
  photos = [],
  onPhotoClick,
  onViewAllClick,
  onRandomPhotoClick,
  onUploadClick,
  tripMembers = [],
  MAX_PHOTOS_PER_TRIP,
}) => {
  if (photos.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Trip Photos
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Collection of shared memories
              </p>
            </div>
          </div>

          <div className="text-center py-12 sm:py-16">
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl sm:rounded-2xl blur-xl"></div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              No photos yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4 sm:mb-6">
              Start by uploading some amazing memories to share with your group!
            </p>
            <button
              onClick={onUploadClick}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto text-sm"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload First Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3">
                All Trip Photos
                <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  {photos.length}
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Collection of shared memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onViewAllClick}
              className="flex-1 sm:flex-none px-3 py-2 sm:px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              View All
            </button>
            {photos.length > 0 && (
              <button
                onClick={onRandomPhotoClick}
                className="px-3 py-2 sm:px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Random</span>
              </button>
            )}
          </div>
        </div>

        {/* Photo Preview Grid */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="flex overflow-x-auto space-x-2 sm:space-x-3 pb-3 sm:pb-4 px-1 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
              {photos.slice(0, 8).map((photo, index) => (
                <div
                  key={`preview-${photo.id}`}
                  className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-44 cursor-pointer group relative"
                  onClick={() => onPhotoClick && onPhotoClick(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1.5 sm:p-2">
                    <img
                      src={
                        photo.downloadURL?.replace?.(
                          "groupify-77202.appspot.com",
                          "groupify-77202.firebasestorage.app"
                        ) || photo.downloadURL
                      }
                      alt={photo.fileName}
                      className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-md sm:rounded-lg"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-1.5 sm:inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md sm:rounded-lg flex items-end">
                      <div className="p-1.5 sm:p-3 w-full">
                        <p className="text-white text-xs sm:text-sm font-medium mb-1">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                          <span className="text-white/80 text-xs">
                            Click to view
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Photo number badge */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more card */}
              {photos.length > 8 && (
                <div
                  className="flex-shrink-0 w-32 sm:w-48 md:w-56 h-20 sm:h-40 md:h-44 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg sm:rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300 group"
                  onClick={onViewAllClick}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <span className="text-white font-bold text-sm sm:text-lg">
                        +{photos.length - 8}
                      </span>
                    </div>
                    <p className="text-purple-700 dark:text-purple-400 font-medium text-xs sm:text-sm">
                      View all photos
                    </p>
                    <p className="text-purple-600 dark:text-purple-500 text-xs mt-1 hidden sm:block">
                      Click to explore
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gradient fade */}
            <div className="absolute top-0 right-0 w-6 sm:w-8 h-full bg-gradient-to-l from-white/80 dark:from-gray-800/80 to-transparent pointer-events-none rounded-r-xl"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-purple-200/30 dark:border-purple-800/30">
            <div className="text-center p-2 sm:p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30 hover:scale-105 transition-transform duration-300">
              <p className="text-sm sm:text-lg font-bold text-purple-700 dark:text-purple-400">
                {photos.length}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-500">
                Total Photos
              </p>
            </div>

            <div className="text-center p-2 sm:p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg border border-pink-200/30 dark:border-pink-800/30 hover:scale-105 transition-transform duration-300">
              <p className="text-sm sm:text-lg font-bold text-pink-700 dark:text-pink-400">
                {photos.length > 0
                  ? Math.ceil(
                      (Date.now() -
                        Math.min(
                          ...photos.map((p) => new Date(p.uploadedAt).getTime())
                        )) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}
              </p>
              <p className="text-xs text-pink-600 dark:text-pink-500">
                Days Active
              </p>
            </div>

            <div className="text-center p-2 sm:p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30 hover:scale-105 transition-transform duration-300">
              <p className="text-sm sm:text-lg font-bold text-blue-700 dark:text-blue-400">
                {tripMembers.length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Contributors
              </p>
            </div>

            <div className="text-center p-2 sm:p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30 hover:scale-105 transition-transform duration-300">
              <p className="text-sm sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {photos.length > 0
                  ? Math.round(
                      (photos.length / Math.max(tripMembers.length, 1)) * 10
                    ) / 10
                  : 0}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">
                Avg per Member
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotosSection;
