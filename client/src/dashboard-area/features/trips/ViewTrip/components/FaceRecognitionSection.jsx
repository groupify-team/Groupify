import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const FaceRecognitionSection = ({
  canFilterByFace,
  hasProfile,
  isLoadingProfile,
  isProcessingFaces,
  filterActive,
  filteredPhotos = [],
  faceRecognitionProgress,
  onFindMyPhotos,
  onCancelProcessing,
  onNavigateToProfile,
  onPhotoSelect,
}) => {
  const [showScanModal, setShowScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleExportPhotos = () => {
    const photosToExport = selectMode
      ? filteredPhotos.filter((p) => selectedPhotos.includes(p.id))
      : filteredPhotos;

    photosToExport.forEach((photo, index) => {
      const link = document.createElement("a");
      link.href = fixPhotoUrl(photo.downloadURL);
      link.download = photo.fileName || `my-photo-${index + 1}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const getProgressPercentage = () => {
    if (faceRecognitionProgress.total === 0) return 0;
    return Math.round(
      (faceRecognitionProgress.current / faceRecognitionProgress.total) * 100
    );
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds < 0) return "";
    if (seconds < 60) return `~${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `~${minutes}m ${remainingSeconds}s remaining`;
  };

  const ScanModal = () => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessingFaces) {
          setShowScanModal(false);
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              <h3 className="text-lg font-bold text-white">Find My Photos</h3>
            </div>
            {!isProcessingFaces && (
              <button
                onClick={() => setShowScanModal(false)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isProcessingFaces ? (
            /* Ready State */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to scan!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  AI will analyze all photos to find ones containing you
                </p>
              </div>

              {/* Profile Status */}
              <div
                className={`p-3 rounded-xl border ${
                  hasProfile
                    ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    : "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserCircleIcon
                    className={`w-5 h-5 ${
                      hasProfile
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      hasProfile
                        ? "text-green-700 dark:text-green-300"
                        : "text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {hasProfile ? "Face Profile Ready" : "No Face Profile"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {hasProfile ? (
                <button
                  onClick={() => {
                    onFindMyPhotos();
                    // Keep modal open to show progress
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-3 rounded-xl font-medium transition-all"
                >
                  Start Face Recognition
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowScanModal(false);
                    onNavigateToProfile();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-xl font-medium transition-all"
                >
                  Create Face Profile
                </button>
              )}
            </div>
          ) : (
            /* Processing State */
            <div className="space-y-6">
              {/* Progress */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-xl border-4 border-blue-300 dark:border-blue-700 animate-pulse"></div>
                  <MagnifyingGlassIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Scanning Photos...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {faceRecognitionProgress.phase || "Processing..."}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                {faceRecognitionProgress.estimatedTimeRemaining && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {formatTimeRemaining(
                      faceRecognitionProgress.estimatedTimeRemaining
                    )}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {faceRecognitionProgress.current || 0}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">
                    Processed
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center border border-green-200 dark:border-green-800">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {faceRecognitionProgress.matches?.length || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Found
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  onCancelProcessing();
                  setShowScanModal(false);
                }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all"
              >
                Cancel Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ResultsModal = () => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowResultsModal(false);
          setSelectMode(false);
          setSelectedPhotos([]);
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckIcon className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">Photos With Me</h3>
                <p className="text-emerald-100 text-sm">
                  {filteredPhotos.length} photo
                  {filteredPhotos.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {filteredPhotos.length > 0 && (
                <button
                  onClick={() => setSelectMode(!selectMode)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectMode
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                >
                  {selectMode ? "Cancel" : "Select"}
                </button>
              )}
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setSelectMode(false);
                  setSelectedPhotos([]);
                }}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredPhotos.length === 0 ? (
            /* No Results */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No photos containing you were detected. Try updating your face
                profile with more photos.
              </p>
            </div>
          ) : (
            /* Results Grid */
            <div className="p-4 space-y-4">
              {/* Selection Info */}
              {selectMode && selectedPhotos.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {selectedPhotos.length} photo
                      {selectedPhotos.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                </div>
              )}

              {/* Photos Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => {
                      if (selectMode) {
                        togglePhotoSelection(photo.id);
                      } else {
                        onPhotoSelect(photo);
                        setShowResultsModal(false);
                      }
                    }}
                  >
                    <img
                      src={fixPhotoUrl(photo.downloadURL)}
                      alt={photo.fileName}
                      className="w-full h-full object-cover rounded-lg"
                    />

                    {/* Selection Checkbox */}
                    {selectMode && (
                      <div className="absolute top-2 right-2 w-5 h-5 border-2 border-white rounded-full bg-white/90 flex items-center justify-center">
                        {selectedPhotos.includes(photo.id) && (
                          <CheckIcon className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                    )}

                    {/* Confidence Badge */}
                    {photo.faceMatch && (
                      <div className="absolute top-2 left-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                            photo.faceMatch.matchType === "strong"
                              ? "bg-green-500/90"
                              : "bg-blue-500/90"
                          }`}
                        >
                          {(photo.faceMatch.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleExportPhotos}
                  disabled={selectMode && selectedPhotos.length === 0}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Export{" "}
                  {selectMode && selectedPhotos.length > 0
                    ? `${selectedPhotos.length} `
                    : ""}
                  Photos
                </button>

                {selectMode && selectedPhotos.length > 0 && (
                  <button
                    onClick={() => {
                      // Handle delete logic here
                    }}
                    className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Show results modal when scan completes
  React.useEffect(() => {
    if (filterActive && filteredPhotos.length >= 0 && !isProcessingFaces) {
      setShowScanModal(false);
      setShowResultsModal(true);
    }
  }, [filterActive, filteredPhotos.length, isProcessingFaces]);

  return (
    <>
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
                  onClick={() => setShowResultsModal(true)}
                  className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all"
                  title="View Results"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowScanModal(true)}
                disabled={isLoadingProfile}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                {isLoadingProfile ? "Loading..." : "Find My Photos"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!filterActive ? (
            /* Ready State */
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

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
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
          ) : (
            /* Results Preview */
            <div className="space-y-4">
              {filteredPhotos.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No matching photos found
                  </p>
                </div>
              ) : (
                <>
                  {/* Preview Grid */}
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
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <EyeIcon className="w-5 h-5 text-white" />
                        </div>
                        {photo.faceMatch && (
                          <div className="absolute top-1 right-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                photo.faceMatch.matchType === "strong"
                                  ? "bg-green-400"
                                  : "bg-blue-400"
                              }`}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* View All Button */}
                  <button
                    onClick={() => setShowResultsModal(true)}
                    className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-medium transition-all border border-blue-200 dark:border-blue-800"
                  >
                    View All {filteredPhotos.length} Photos With Me
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showScanModal && <ScanModal />}
      {showResultsModal && <ResultsModal />}

      {/* Add CSS for smooth transitions */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slide-in-scale {
          animation: slideInScale 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FaceRecognitionSection;
