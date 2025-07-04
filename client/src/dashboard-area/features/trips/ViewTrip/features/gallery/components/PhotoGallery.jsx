import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { uploadPhoto } from "@shared/services/firebase/storage"; // Import the upload function
import { useAuth } from "@/auth-area/contexts/AuthContext"; // Import the auth context

import {
  PhotoIcon,
  EyeIcon,
  SparklesIcon,
  CameraIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PhotoGallery = ({
  photos = [],
  tripMembers = [],
  tripId, // Add this prop - it's needed for upload
  maxPhotos = 100,
  onPhotoSelect,
  onShowAllPhotos,
  onRandomPhoto,
  onUploadFirst,
  onPhotoUploaded, // This callback will be called when photos are uploaded
}) => {
  const { currentUser } = useAuth(); // Get current user from auth context
  const [showManageModal, setShowManageModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [gridCols, setGridCols] = useState(6);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  // Calculate responsive grid and overflow
  useEffect(() => {
    const calculateGrid = () => {
      const width = window.innerWidth;
      let cols;

      if (width < 640) cols = 4; // Mobile: 4 columns
      else if (width < 768) cols = 6; // Small tablet: 6 columns
      else if (width < 1024) cols = 8; // Tablet: 8 columns
      else cols = 10; // Desktop: 10 columns

      setGridCols(cols);
    };

    calculateGrid();
    window.addEventListener("resize", calculateGrid);
    return () => window.removeEventListener("resize", calculateGrid);
  }, []);

  const visiblePhotos = photos.slice(0, gridCols - 1);
  const overflowCount = Math.max(0, photos.length - visiblePhotos.length);
  const showOverflow = photos.length > gridCols - 1;

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleExportPhotos = () => {
    const photosToExport = selectMode
      ? photos.filter((p) => selectedPhotos.includes(p.id))
      : photos;

    photosToExport.forEach((photo, index) => {
      const link = document.createElement("a");
      link.href = fixPhotoUrl(photo.downloadURL);
      link.download = photo.fileName || `photo-${index + 1}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Fixed upload handler with actual Firebase integration
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (!tripId) {
      toast.error("Trip ID is missing. Cannot upload photos.");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("You must be logged in to upload photos.");
      return;
    }

    // Check photo limit
    const availableSlots = maxPhotos - photos.length;
    if (availableSlots <= 0) {
      toast.error("Photo limit reached! Please delete some photos first.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    const rejectedFiles = files.length - filesToUpload.length;

    if (rejectedFiles > 0) {
      toast.warning(
        `Only uploading ${filesToUpload.length} photos due to limit. ${rejectedFiles} photos rejected.`
      );
    }

    setUploading(true);
    const uploadedPhotos = [];
    const totalFiles = filesToUpload.length;

    try {
      // Show initial loading toast
      const loadingToast = toast.loading(
        `Uploading ${totalFiles} photo${totalFiles > 1 ? "s" : ""}...`
      );

      // Upload files one by one
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        try {
          // Get current user ID from auth context
          const userId = currentUser?.uid;

          if (!userId) {
            throw new Error("User not authenticated");
          }

          const photoData = await uploadPhoto(
            file,
            tripId,
            userId,
            {}, // metadata
            (percent) => {
              // Update progress for this specific file
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: percent,
              }));
            }
          );

          uploadedPhotos.push(photoData);

          // Update progress toast
          toast.dismiss(loadingToast);
          if (i < filesToUpload.length - 1) {
            toast.loading(`Uploading ${i + 2}/${totalFiles} photos...`);
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Clear progress
      setUploadProgress({});
      toast.dismiss();

      if (uploadedPhotos.length > 0) {
        // Call the callback to update the parent component
        if (onPhotoUploaded) {
          onPhotoUploaded(uploadedPhotos);
        }

        toast.success(
          `${uploadedPhotos.length} photo${
            uploadedPhotos.length > 1 ? "s" : ""
          } uploaded successfully!`
        );
        setShowUploadModal(false);
      } else {
        toast.error("No photos were uploaded successfully.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const ManagePhotosModal = () => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowManageModal(false);
          setSelectMode(false);
          setSelectedPhotos([]);
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 animate-slide-in-scale overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
              <h3 className="text-lg font-bold text-white">Manage Photos</h3>
            </div>
            <button
              onClick={() => {
                setShowManageModal(false);
                setSelectMode(false);
                setSelectedPhotos([]);
              }}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {photos.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Photos
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {Math.max(0, maxPhotos - photos.length)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Slots Left
                </p>
              </div>
            </div>

            {/* Selection Toggle */}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedPhotos([]);
              }}
              className={`w-full p-3 rounded-xl font-medium transition-all mb-4 ${
                selectMode
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
              }`}
            >
              {selectMode ? "Exit Selection Mode" : "Select Photos"}
            </button>

            {/* Selected Count */}
            {selectMode && selectedPhotos.length > 0 && (
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {selectedPhotos.length} photo
                    {selectedPhotos.length > 1 ? "s" : ""} selected
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
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
                  onClick={() => {}}
                  className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Photos Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative aspect-square cursor-pointer group ${
                    selectMode && selectedPhotos.includes(photo.id)
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                  onClick={() => {
                    if (selectMode) {
                      togglePhotoSelection(photo.id);
                    } else {
                      onPhotoSelect(photo);
                      setShowManageModal(false);
                    }
                  }}
                >
                  <img
                    src={fixPhotoUrl(photo.downloadURL)}
                    alt={photo.fileName}
                    className="w-full h-full object-cover rounded-lg"
                  />

                  {selectMode && (
                    <div className="absolute top-1 right-1 w-5 h-5 border-2 border-white rounded-full bg-white/90 flex items-center justify-center">
                      {selectedPhotos.includes(photo.id) && (
                        <CheckIcon className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <EyeIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UploadModal = () => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          setShowUploadModal(false);
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlusIcon className="w-6 h-6 text-white" />
              <h3 className="text-lg font-bold text-white">Upload Photos</h3>
            </div>
            {!uploading && (
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CameraIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop photos here
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse files
            </p>
            <label
              htmlFor="photo-upload"
              className={`bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? "Uploading..." : "Choose Files"}
            </label>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                await handleFileUpload(files);

                // Reset the input
                e.target.value = "";
              }}
            />
          </div>

          {/* Upload Progress */}
          {uploading && Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div
                  key={fileName}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Storage used</span>
              <span>
                {photos.length} / {maxPhotos}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(photos.length / maxPhotos) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-900/30 dark:to-pink-900/30 p-4 border-b border-purple-200/30 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <PhotoIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Trip Gallery
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {photos.length} photos •{" "}
                  {Math.max(0, maxPhotos - photos.length)} slots left
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
                className={`bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                {uploading ? "Uploading..." : "Add Photos"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {photos.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CameraIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No photos yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm mx-auto">
                Start building your trip memories by uploading your first photos
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
                className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <PlusIcon className="w-5 h-5" />
                {uploading ? "Uploading..." : "Upload First Photos"}
              </button>
            </div>
          ) : (
            /* Photos Grid */
            <div className="space-y-4">
              {/* Responsive Preview Grid */}
              <div
                className={`grid gap-2`}
                style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
              >
                {visiblePhotos.map((photo, index) => (
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
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}

                {/* Overflow indicator - always in the same row */}
                {showOverflow && (
                  <div
                    className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all"
                    onClick={onShowAllPhotos}
                  >
                    <div className="text-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        +{overflowCount}
                      </span>
                      <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                        more
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* View All Button */}
              {photos.length > 0 && (
                <button
                  onClick={onShowAllPhotos}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 py-3 rounded-xl font-medium transition-all border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700"
                >
                  View All {photos.length} Photos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showManageModal && <ManagePhotosModal />}
      {showUploadModal && <UploadModal />}
    </>
  );
};

export default PhotoGallery;
