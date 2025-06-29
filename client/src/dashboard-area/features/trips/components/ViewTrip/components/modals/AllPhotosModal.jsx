import React from "react";
import {
  XMarkIcon,
  PhotoIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const AllPhotosModal = ({
  isOpen,
  photos,
  maxPhotos,
  isAdmin,
  selectMode,
  selectedPhotos,
  onClose,
  onPhotoSelect,
  onToggleSelectMode,
  onSelectPhoto,
  onDeleteSelected,
}) => {
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-5xl max-h-[75vh] overflow-hidden w-full border border-white/20 dark:border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 border-b border-purple-200/30 dark:border-purple-800/30 p-4 sm:p-5">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-300 hover:scale-110 z-20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          >
            <XMarkIcon className="w-6 h-6 stroke-2" />
          </button>

          <div className="pr-12">
            {/* Title and Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <PhotoIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  Trip Gallery
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    {photos.length} Photos
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round((photos.length / maxPhotos) * 100)}% used
                  </span>
                </div>
              </div>

              {/* Select/Cancel Button */}
              {isAdmin && (
                <button
                  onClick={onToggleSelectMode}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm shadow-lg transform hover:scale-105 ${
                    selectMode
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  }`}
                >
                  {selectMode ? "Cancel" : "Select"}
                </button>
              )}
            </div>

            {/* Selection Tools - Only shows when selecting */}
            {selectMode && (
              <div className="flex items-center justify-center gap-4 mt-4">
                {/* Selection Counter */}
                {selectedPhotos.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                        {selectedPhotos.length} selected
                      </span>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                {selectedPhotos.length > 0 && (
                  <button
                    onClick={onDeleteSelected}
                    className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg transform hover:scale-105 hover:shadow-xl"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Photo Grid */}
        <div className="p-4 sm:p-5">
          <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
            {photos.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <PhotoIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                  No photos yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Upload photos to start your gallery
                </p>
              </div>
            ) : (
              /* Photo Grid */
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3">
                {photos.map((photo, index) => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  return (
                    <div
                      key={`modal-${photo.id}`}
                      className={`relative cursor-pointer rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 group ${
                        selectMode && !isSelected
                          ? "opacity-60 hover:opacity-80"
                          : ""
                      } ${
                        isSelected
                          ? "ring-2 ring-purple-500 ring-offset-1 scale-105"
                          : ""
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          onSelectPhoto(photo.id);
                        } else {
                          onPhotoSelect(photo);
                          onClose();
                        }
                      }}
                    >
                      <img
                        src={fixPhotoUrl(photo.downloadURL)}
                        alt={photo.fileName}
                        className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-md"
                        loading="lazy"
                      />

                      {/* Selection Indicator */}
                      {selectMode && (
                        <div className="absolute top-1 right-1 w-5 h-5 border-2 border-white rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      )}

                      {/* Photo Number Badge */}
                      {!selectMode && (
                        <div className="absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-lg">
                          {index + 1}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 rounded-b-md opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs">
                            {new Date(photo.uploadedAt).toLocaleDateString()}
                          </span>
                          <EyeIcon className="w-3 h-3 text-white/80" />
                        </div>
                      </div>

                      {/* Hover Ring */}
                      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-purple-400/50 transition-all duration-300"></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPhotosModal;
