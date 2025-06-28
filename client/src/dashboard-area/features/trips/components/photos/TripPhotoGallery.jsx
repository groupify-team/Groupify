import React from "react";
import {
  PhotoIcon,
  CameraIcon,
  EyeIcon,
  PlusIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const TripPhotoGallery = ({
  photos,
  onPhotoSelect,
  onShowAllPhotos,
  maxPhotos,
}) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
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
              onClick={onShowAllPhotos}
              className="flex-1 sm:flex-none px-3 py-2 sm:px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              View All
            </button>
            {photos.length > 0 && (
              <button
                onClick={() => {
                  const randomIndex = Math.floor(Math.random() * photos.length);
                  onPhotoSelect(photos[randomIndex]);
                }}
                className="px-3 py-2 sm:px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Random</span>
              </button>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              No photos yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4 sm:mb-6">
              Start by uploading some amazing memories to share with your group!
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="flex overflow-x-auto space-x-2 sm:space-x-3 pb-3 sm:pb-4 px-1">
                {photos.slice(0, 8).map((photo, index) => (
                  <div
                    key={`preview-${photo.id}`}
                    className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-44 cursor-pointer group relative"
                    onClick={() => onPhotoSelect(photo)}
                  >
                    <div className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1.5 sm:p-2">
                      <img
                        src={photo.downloadURL}
                        alt={photo.fileName}
                        className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-md sm:rounded-lg"
                      />
                      <div className="absolute top-2 left-2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPhotoGallery;
