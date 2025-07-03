import React from "react";
import {
  PhotoIcon,
  EyeIcon,
  SparklesIcon,
  CameraIcon,
  PlusIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const PhotoGallery = ({
  photos,
  tripMembers,
  maxPhotos,
  onPhotoSelect,
  onShowAllPhotos,
  onRandomPhoto,
  onUploadFirst,
}) => {
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  return (
    <div className="relative group h-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-5 border border-white/20 dark:border-gray-700/50 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <PhotoIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                All Trip Photos
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  {photos.length}
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Collection of shared memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShowAllPhotos}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              View All
            </button>
            {photos.length > 0 && (
              <button
                onClick={onRandomPhoto}
                className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Random</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {photos.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                    <CameraIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                  No photos yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4">
                  Start by uploading some amazing memories to share with your
                  group!
                </p>
                {onUploadFirst && (
                  <button
                    onClick={onUploadFirst}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Upload First Photo
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Photos Grid */
            <div className="flex-1 flex flex-col">
              {/* Photo scroll container - Smaller and more compact */}
              <div className="relative flex-1 max-h-48">
                <div className="h-full overflow-x-auto">
                  <div className="flex gap-3 h-full py-2 px-1">
                    {photos.slice(0, 8).map((photo, index) => (
                      <div
                        key={`preview-${photo.id}`}
                        className="flex-shrink-0 w-28 cursor-pointer group relative"
                        onClick={() => onPhotoSelect(photo)}
                      >
                        <div className="relative overflow-hidden rounded-lg shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 h-full">
                          <img
                            src={fixPhotoUrl(photo.downloadURL)}
                            alt={photo.fileName}
                            className="w-full h-full object-cover rounded-md"
                          />

                          {/* Hover overlay */}
                          <div className="absolute inset-1 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md flex items-end">
                            <div className="p-2 w-full">
                              <p className="text-white text-xs font-medium">
                                {new Date(
                                  photo.uploadedAt
                                ).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <EyeIcon className="w-3 h-3 text-white/80" />
                                <span className="text-white/80 text-xs">
                                  View
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Photo number badge */}
                          <div className="absolute top-2 left-2 w-5 h-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-lg">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show more card if there are additional photos */}
                    {photos.length > 8 && (
                      <div
                        className="flex-shrink-0 w-32 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300 group"
                        onClick={onShowAllPhotos}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg">
                            <span className="text-white font-bold text-sm">
                              +{photos.length - 8}
                            </span>
                          </div>
                          <p className="text-purple-700 dark:text-purple-400 font-medium text-xs">
                            More photos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Section - Compact and clean */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-purple-200/30 dark:border-purple-800/30 mt-4">
                <div className="text-center p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30 hover:scale-105 transition-transform duration-300">
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                    <PhotoIcon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                    {photos.length}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-500">
                    Photos
                  </p>
                </div>

                <div className="text-center p-2 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg border border-pink-200/30 dark:border-pink-800/30 hover:scale-105 transition-transform duration-300">
                  <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                    <ClockIcon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-bold text-pink-700 dark:text-pink-400">
                    {photos.length > 0
                      ? Math.ceil(
                          (Date.now() -
                            Math.min(
                              ...photos.map((p) =>
                                new Date(p.uploadedAt).getTime()
                              )
                            )) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0}
                  </p>
                  <p className="text-xs text-pink-600 dark:text-pink-500">
                    Days
                  </p>
                </div>

                <div className="text-center p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30 hover:scale-105 transition-transform duration-300">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                    <UserGroupIcon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {tripMembers.length}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">
                    Users
                  </p>
                </div>

                <div className="text-center p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30 hover:scale-105 transition-transform duration-300">
                  <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                    <SparklesIcon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {photos.length > 0
                      ? Math.round(
                          (photos.length / Math.max(tripMembers.length, 1)) * 10
                        ) / 10
                      : 0}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Avg
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery;
