import React, { useState } from "react";
import {
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import JSZip from "jszip";

const FaceRecognitionResults = ({
  isOpen,
  filteredPhotos = [],
  onClose,
  onPhotoSelect,
  onRescan,
}) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

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
                  onClick={onRescan}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-white/20 hover:bg-white/30 text-white transition-all flex items-center gap-1"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  Rescan
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
                      onPhotoSelect(photo);
                      onClose();
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

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                // 🔥 REPLACE the export button section:
                <button
                  onClick={() => {
                    // 🔥 ADD REAL EXPORT FUNCTIONALITY
                    const downloadPhotos = async () => {
                      try {
                        const zip = new JSZip(); // You'll need to install jszip: npm install jszip

                        for (let i = 0; i < filteredPhotos.length; i++) {
                          const photo = filteredPhotos[i];
                          const response = await fetch(
                            fixPhotoUrl(photo.downloadURL)
                          );
                          const blob = await response.blob();
                          zip.file(`photo_${i + 1}_${photo.fileName}`, blob);
                        }

                        const content = await zip.generateAsync({
                          type: "blob",
                        });
                        const url = window.URL.createObjectURL(content);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `my_photos_${
                          new Date().toISOString().split("T")[0]
                        }.zip`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);

                        toast.success("Photos exported successfully!");
                      } catch (error) {
                        console.error("Export failed:", error);
                        toast.error("Failed to export photos");
                      }
                    };

                    downloadPhotos();
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Export Photos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
