import React from "react";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const FaceRecognitionCard = ({
  hasProfile,
  isLoadingProfile,
  isLoadingFaceRecognition,
  filterActive,
  filteredPhotos = [],
  onFindMyPhotos,
  onPhotoSelect,
  onViewAllResults,
}) => {
  // Helper function to fix photo URLs
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 border-b border-blue-200/30 dark:border-blue-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <MagnifyingGlassIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Photos With Me
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filterActive
                  ? `${filteredPhotos.length} photos found`
                  : "AI-powered face detection"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filterActive && filteredPhotos.length > 0 && (
              <button
                onClick={onViewAllResults}
                className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
                title="View Results"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onFindMyPhotos}
              disabled={isLoadingProfile || isLoadingFaceRecognition}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 disabled:hover:scale-100"
            >
              {isLoadingFaceRecognition ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  Find My Photos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filterActive && filteredPhotos.length > 0 ? (
          // Show results preview
          <div className="space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {filteredPhotos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => onPhotoSelect(photo)}
                >
                  <img
                    src={fixPhotoUrl(photo.downloadURL)}
                    alt={photo.fileName}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <EyeIcon className="w-5 h-5 text-white" />
                  </div>
                  {photo.faceMatch && (
                    <div className="absolute top-1 right-1">
                      <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={onViewAllResults}
              className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-medium transition-all border border-blue-200 dark:border-blue-800 duration-300 hover:scale-105"
            >
              View All {filteredPhotos.length} Photos With Me
            </button>
          </div>
        ) : (
          // Show initial state
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {hasProfile
                ? "Ready to find your photos!"
                : "Setup your face profile"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm mx-auto">
              {hasProfile
                ? "Use AI face recognition to automatically identify photos containing you."
                : "Create a face profile in your Dashboard to enable photo detection."}
            </p>
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                hasProfile
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  hasProfile ? "bg-green-500" : "bg-orange-500"
                } ${hasProfile ? "animate-pulse" : ""}`}
              ></div>
              {hasProfile ? "Profile Ready" : "No Profile"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognitionCard;
