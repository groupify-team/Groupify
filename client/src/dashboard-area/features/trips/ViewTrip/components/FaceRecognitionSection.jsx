import React from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  FireIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const FaceRecognitionSection = ({
  canFilterByFace,
  hasProfile,
  isLoadingProfile,
  isProcessingFaces,
  filterActive,
  filteredPhotos,
  faceRecognitionProgress,
  onFindMyPhotos,
  onCancelProcessing,
  onNavigateToProfile,
  onPhotoSelect,
}) => {
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds < 0) return "";

    if (seconds < 60) {
      return `~${seconds}s remaining`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `~${minutes}m ${remainingSeconds}s remaining`;
    }
  };

  const getProgressPercentage = () => {
    if (faceRecognitionProgress.total === 0) return 0;
    return Math.round(
      (faceRecognitionProgress.current / faceRecognitionProgress.total) * 100
    );
  };

  const handleToggleFilter = () => {
    if (filterActive) {
      // Turn off filter - this would need to be handled by parent
      // setFilterActive(false);
      // setFilteredPhotos([]);
    } else {
      onFindMyPhotos();
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Photos With Me
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                AI-powered face recognition to find photos containing you
              </p>
            </div>
          </div>

          {!isProcessingFaces && (
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Status Indicators */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {isLoadingProfile ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm">
                    <div className="animate-spin w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Loading...
                    </span>
                  </div>
                ) : hasProfile ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-green-100 dark:bg-green-900/30 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Profile Ready
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-orange-100 dark:bg-orange-900/30 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm border border-orange-200 dark:border-orange-800">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-700 dark:text-orange-400 font-medium">
                      No Profile
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleToggleFilter}
                  disabled={!canFilterByFace || isLoadingProfile}
                  className={`w-full sm:w-auto px-3 py-2 sm:px-5 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg ${
                    canFilterByFace && !isLoadingProfile
                      ? filterActive
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                        : hasProfile
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  {filterActive
                    ? "Hide Results"
                    : hasProfile
                    ? "Find My Photos"
                    : "Need Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing UI */}
        {isProcessingFaces ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  Processing Photos
                </span>
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className="relative w-full h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Status Cards - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                  <FireIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  Status
                </h4>
                <p className="text-blue-700 dark:text-blue-300 font-medium text-xs sm:text-sm">
                  {faceRecognitionProgress.phase || "Processing..."}
                </p>
                {faceRecognitionProgress.estimatedTimeRemaining && (
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    ⏱️{" "}
                    {formatTimeRemaining(
                      faceRecognitionProgress.estimatedTimeRemaining
                    )}
                  </p>
                )}
              </div>

              {faceRecognitionProgress.matches?.length > 0 && (
                <div className="bg-green-50/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                    <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Matches Found
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-xl sm:text-2xl font-bold">
                    {faceRecognitionProgress.matches.length}
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    Found so far...
                  </p>
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <button
              onClick={onCancelProcessing}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm text-sm"
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Cancel Processing
            </button>
          </div>
        ) : filterActive && filteredPhotos.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <MagnifyingGlassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              No matches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              No photos containing you were found using your face profile.
            </p>
          </div>
        ) : filterActive ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Photos Grid - Responsive */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={`filtered-${photo.id}`}
                  className="group cursor-pointer"
                  onClick={() => onPhotoSelect(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 sm:p-2">
                    <img
                      src={fixPhotoUrl(photo.downloadURL)}
                      alt={photo.fileName}
                      className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-md sm:rounded-lg"
                    />

                    {/* Match confidence badge */}
                    {photo.faceMatch && (
                      <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3">
                        <div
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm ${
                            photo.faceMatch.matchType === "strong"
                              ? "bg-green-500/90"
                              : "bg-blue-500/90"
                          }`}
                        >
                          {(photo.faceMatch.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-1 sm:inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md sm:rounded-lg flex items-end">
                      <div className="p-1.5 sm:p-2 w-full">
                        <p className="text-white text-xs font-medium">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <MagnifyingGlassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              {hasProfile
                ? "Ready to find your photos!"
                : "Setup your face profile"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 sm:mb-8 max-w-md mx-auto">
              {hasProfile
                ? 'Click "Find My Photos" to automatically identify photos containing you using AI face recognition.'
                : "You need to create a face profile in your Dashboard before you can find photos with yourself."}
            </p>
            {!hasProfile && (
              <button
                onClick={onNavigateToProfile}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2 sm:gap-3 mx-auto text-sm"
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Setup Face Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognitionSection;
