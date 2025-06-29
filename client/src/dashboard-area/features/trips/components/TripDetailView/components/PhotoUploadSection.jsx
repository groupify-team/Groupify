// components/TripDetailView/components/PhotoUploadSection.jsx
import React from "react";
import PhotoUpload from "../../../photos/PhotoUpload";

const PhotoUploadSection = ({
  showUploadForm,
  tripId,
  onPhotoUploaded,
  getPhotoLimitStatus,
  getRemainingPhotoSlots,
  MAX_PHOTOS_PER_TRIP,
  currentPhotoCount,
}) => {
  if (!showUploadForm) return null;

  return (
    <div className="space-y-4">
      {/* Photo limit warnings */}
      {getPhotoLimitStatus() === "full" && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
            {/* Warning content */}
          </div>
        </div>
      )}

      {getPhotoLimitStatus() === "warning" && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
            {/* Warning content */}
          </div>
        </div>
      )}

      <PhotoUpload
        tripId={tripId}
        onPhotoUploaded={onPhotoUploaded}
        maxPhotos={MAX_PHOTOS_PER_TRIP}
        currentPhotoCount={currentPhotoCount}
        showLimitWarning={getPhotoLimitStatus() === "warning"}
        limitWarningText={`Only ${getRemainingPhotoSlots()} photo slots remaining out of ${MAX_PHOTOS_PER_TRIP}.`}
        disabled={getPhotoLimitStatus() === "full"}
      />
    </div>
  );
};

export default PhotoUploadSection;
