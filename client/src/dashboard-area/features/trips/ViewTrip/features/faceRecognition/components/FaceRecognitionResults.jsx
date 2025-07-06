import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const FaceRecognitionResults = ({
  isOpen,
  filteredPhotos = [],
  onClose,
  onPhotoSelect,
  onRescan,
  onClearScan,
}) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [photosToExport, setPhotosToExport] = useState([]);

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const isSelected = prev.some((p) => p.id === photo.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== photo.id);
      } else {
        return [...prev, photo];
      }
    });
  };

  const handleDeleteSelected = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = () => {
    if (selectedPhotos.length === 0) return;
    const remainingPhotos = filteredPhotos.filter(
      (photo) => !selectedPhotos.some((selected) => selected.id === photo.id)
    );
    onPhotosRemoved(remainingPhotos);
    setSelectedPhotos([]);
    setSelectMode(false);
    setShowDeleteConfirm(false);
    toast.success(`${selectedPhotos.length} photos removed from results`);
  };

  const handleExportPhotos = async (photosToExport) => {
    try {
      if (photosToExport.length === 1) {
        const photo = photosToExport[0];
        const link = document.createElement("a");
        link.href = fixPhotoUrl(photo.downloadURL);
        link.download = photo.fileName || `photo_${photo.id}.jpg`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const downloadData = photosToExport.map((photo) => ({
          url: fixPhotoUrl(photo.downloadURL),
          filename: photo.fileName || `photo_${photo.id}.jpg`,
        }));
        downloadData.forEach((item, index) => {
          setTimeout(() => {
            const link = document.createElement("a");
            link.href = item.url;
            link.download = item.filename;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 500); // Delay to avoid browser blocking
        });
      }

      toast.success(
        `Downloading ${photosToExport.length} photo${
          photosToExport.length > 1 ? "s" : ""
        }...`
      );
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export photos");
    }
  };

  const handleExportAsZip = async (photosToExport) => {
    try {
      toast.info(
        `Preparing ${photosToExport.length} photos for ZIP download...`
      );
      setTimeout(() => {
        handleExportPhotos(photosToExport);
        toast.success(
          "Note: Individual downloads used (ZIP feature coming soon!)"
        );
      }, 1000);
    } catch (error) {
      console.error("ZIP export failed:", error);
      toast.error("Failed to create ZIP file");
    }
  };

  // Helper function to fix photo URLs
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
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
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-red-500/80 hover:bg-red-600/80 text-white transition-all flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredPhotos.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {filteredPhotos.length > 0
                  ? Math.round(
                      (filteredPhotos.reduce(
                        (sum, p) => sum + (p.faceMatch?.confidence || 0),
                        0
                      ) /
                        filteredPhotos.length) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Confidence
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {
                  filteredPhotos.filter(
                    (p) => (p.faceMatch?.confidence || 0) > 0.8
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                High Quality
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredPhotos.length === 0 ? (
            <div className="p-8 text-center">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No photos containing you were detected. Try updating your face
                profile.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => {
                      if (selectMode) {
                        togglePhotoSelection(photo);
                      } else {
                        onPhotoSelect(photo);
                        onClose();
                      }
                    }}
                  >
                    <img
                      src={fixPhotoUrl(photo.downloadURL)}
                      alt={photo.fileName}
                      className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {photo.faceMatch && (
                      <div className="absolute top-2 left-2">
                        <div className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg bg-green-500/90">
                          {(photo.faceMatch.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {selectMode && (
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedPhotos.some((p) => p.id === photo.id)
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white/80 border-gray-300"
                          }`}
                        >
                          {selectedPhotos.some((p) => p.id === photo.id) && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectMode(!selectMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectMode
                      ? "bg-gray-500 hover:bg-gray-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {selectMode ? "Cancel" : "Select"}
                </button>

                {selectMode && selectedPhotos.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setPhotosToExport(selectedPhotos);
                        setShowExportOptions(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      Export ({selectedPhotos.length})
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                    >
                      Delete ({selectedPhotos.length})
                    </button>
                  </>
                )}

                {!selectMode && (
                  <button
                    onClick={() => {
                      setPhotosToExport(filteredPhotos);
                      setShowExportOptions(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Export All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Selected Photos?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  Are you sure you want to delete {selectedPhotos.length}{" "}
                  selected photo{selectedPhotos.length > 1 ? "s" : ""}? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSelected}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Clear All Results?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  This will remove all scanned face recognition results. You'll
                  need to scan again to find your photos.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearScan();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDownTrayIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Export Photos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  Choose how you want to export {photosToExport.length} photo
                  {photosToExport.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleExportPhotos(photosToExport);
                      setShowExportOptions(false);
                    }}
                    className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Individual Files
                  </button>
                  <button
                    onClick={() => {
                      handleExportAsZip(photosToExport);
                      setShowExportOptions(false);
                    }}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Download as ZIP File
                  </button>
                  <button
                    onClick={() => setShowExportOptions(false)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes animate-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes animate-scale-in {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .animate-fade-in {
            animation: animate-fade-in 0.3s ease-out;
          }

          .animate-scale-in {
            animation: animate-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}
      </style>
    </div>
  );
};

export default FaceRecognitionResults;
