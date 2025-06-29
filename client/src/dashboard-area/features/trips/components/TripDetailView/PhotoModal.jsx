// components/TripDetailView/PhotoModal.jsx
import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const PhotoModal = ({ selectedPhoto, photos = [], onClose, onNavigate }) => {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedPhoto) return;

      const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) {
            onNavigate(photos[currentIndex - 1]);
          } else {
            onNavigate(photos[photos.length - 1]); // Loop to last
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentIndex < photos.length - 1) {
            onNavigate(photos[currentIndex + 1]);
          } else {
            onNavigate(photos[0]); // Loop to first
          }
          break;

        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    // Only add listener when modal is open
    if (selectedPhoto) {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }
  }, [selectedPhoto, photos, onNavigate, onClose]);

  if (!selectedPhoto) return null;

  const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);

  const navigateTo = (direction) => {
    if (direction === "prev") {
      if (currentIndex > 0) {
        onNavigate(photos[currentIndex - 1]);
      } else {
        onNavigate(photos[photos.length - 1]);
      }
    } else {
      if (currentIndex < photos.length - 1) {
        onNavigate(photos[currentIndex + 1]);
      } else {
        onNavigate(photos[0]);
      }
    }
  };

  return (
    <div
      className="fixed bg-black/95 backdrop-blur-lg flex items-center justify-center z-[9999]"
      style={{
        position: "fixed",
        top: "-10px",
        left: "-10px",
        right: "-10px",
        bottom: "-10px",
        width: "calc(100vw + 20px)",
        height: "calc(100vh + 20px)",
        margin: 0,
        padding: 0,
      }}
      onClick={onClose}
    >
      {/* Fixed container with consistent dimensions */}
      <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-4">
        {/* Image container with fixed aspect ratio */}
        <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          <img
            src={
              selectedPhoto.downloadURL?.replace?.(
                "groupify-77202.appspot.com",
                "groupify-77202.firebasestorage.app"
              ) || selectedPhoto.downloadURL
            }
            alt="Full view"
            className="max-w-full max-h-full object-contain"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
            }}
          />

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-6 right-6 w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors shadow-xl z-20"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Left Arrow - Fixed position */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateTo("prev");
            }}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-300 hover:scale-110 shadow-xl z-20"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Right Arrow - Fixed position */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateTo("next");
            }}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-300 hover:scale-110 shadow-xl z-20"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Photo counter - Fixed position */}
          <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium shadow-xl z-20">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Photo info overlay - Fixed position */}
          <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl">
            <p className="font-medium text-lg">{selectedPhoto.fileName}</p>
            <p className="text-sm text-white/80 mt-1">
              {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
            </p>
            {selectedPhoto.faceMatch && (
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPhoto.faceMatch.matchType === "strong"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  Face Match:{" "}
                  {(selectedPhoto.faceMatch.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
