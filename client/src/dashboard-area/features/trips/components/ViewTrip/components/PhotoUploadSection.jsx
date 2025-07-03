import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const PhotoUploadSection = ({
  isOpen,
  onClose,
  tripId,
  photoLimitStatus,
  remainingPhotoSlots,
  maxPhotos,
  currentPhotoCount,
  onPhotoUploaded,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Upload Photos</h3>
                <p className="text-white/70 text-xs">
                  Add memories to your trip
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Photo limit warning */}
          {photoLimitStatus === "full" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400">
                      Photo Limit Reached
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      This trip has reached the maximum of {maxPhotos} photos.
                      Please delete some photos before uploading new ones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : photoLimitStatus === "warning" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M12 17h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400">
                      Almost Full
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Only {remainingPhotoSlots} photo slots remaining out of{" "}
                      {maxPhotos}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* PhotoUpload Component Placeholder */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  Upload Photos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {remainingPhotoSlots} slots remaining out of {maxPhotos}
                </p>

                {/* Upload Status */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Used: {currentPhotoCount} / {maxPhotos}
                    </span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {Math.round((currentPhotoCount / maxPhotos) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentPhotoCount / maxPhotos) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {photoLimitStatus !== "full" && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    PhotoUpload component will be rendered here
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadSection;
