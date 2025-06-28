import React from "react";
import TripPhotoGallery from "./TripPhotoGallery";
import SmartPhotoFilter from "./SmartPhotoFilter";
import PhotoUploadSection from "./PhotoUploadSection";

const PhotoSection = ({
  tripId,
  photos,
  filteredPhotos,
  filterActive,
  showUploadForm,
  isProcessingFaces,
  faceRecognitionProgress,
  hasProfile,
  currentUser,
  onPhotoUploaded,
  onFilterToggle,
  onCancelFaceRecognition,
  onPhotoSelect,
  onShowAllPhotos,
  maxPhotos,
  getPhotoLimitStatus,
  getRemainingPhotoSlots,
}) => {
  return (
    <div className="space-y-6">
      {/* Upload Form */}
      {showUploadForm && (
        <PhotoUploadSection
          tripId={tripId}
          onPhotoUploaded={onPhotoUploaded}
          maxPhotos={maxPhotos}
          currentPhotoCount={photos.length}
          showLimitWarning={getPhotoLimitStatus() === "warning"}
          limitWarningText={`Only ${getRemainingPhotoSlots()} photo slots remaining out of ${maxPhotos}.`}
          disabled={getPhotoLimitStatus() === "full"}
        />
      )}

      {/* Photos Preview Section */}
      <TripPhotoGallery
        photos={photos}
        onPhotoSelect={onPhotoSelect}
        onShowAllPhotos={onShowAllPhotos}
        maxPhotos={maxPhotos}
      />

      {/* Face Recognition Section */}
      <SmartPhotoFilter
        tripId={tripId}
        photos={photos}
        filteredPhotos={filteredPhotos}
        filterActive={filterActive}
        isProcessingFaces={isProcessingFaces}
        faceRecognitionProgress={faceRecognitionProgress}
        hasProfile={hasProfile}
        currentUser={currentUser}
        onFilterToggle={onFilterToggle}
        onCancelFaceRecognition={onCancelFaceRecognition}
        onPhotoSelect={onPhotoSelect}
      />
    </div>
  );
};

export default PhotoSection;
