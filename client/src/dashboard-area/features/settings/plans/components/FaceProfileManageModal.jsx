// features/face-recognition/components/FaceProfileManageModal.jsx
import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
  UserCircleIcon,
  CameraIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  addPhotosToProfile,
  removePhotosFromProfile,
  optimizeProfile,
  deleteFaceProfile,
  getFaceProfile,
  getProfilePhotos,
} from "@shared/services/faceRecognitionService";
import { deleteFaceProfileFromStorage } from "@firebase-services/faceProfiles";
import { uploadPhoto } from "@firebase-services/storage";

const FaceProfileManageModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [selectedPhotosToRemove, setSelectedPhotosToRemove] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      loadProfileData();
    }
  }, [isOpen, currentUser]);

  const loadProfileData = () => {
    try {
      const currentProfile = getFaceProfile(currentUser.uid);
      const photos = getProfilePhotos(currentUser.uid);
      setProfile(currentProfile);
      setProfilePhotos(photos);
    } catch (error) {
      console.error("❌ Error loading profile data:", error);
    }
  };

  // Helper function for uploading files using your existing uploadPhoto function
  const uploadProfilePhotos = async (files, userId) => {
    const uploadPromises = files.map(async (file, index) => {
      // Create a temporary tripId for face profile uploads or use a special identifier
      const tempTripId = `face-profile-${userId}`;

      const uploadedPhoto = await uploadPhoto(file, tempTripId, userId, {
        originalName: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        isFaceProfile: true, // Flag to identify face profile photos
      });

      return uploadedPhoto.downloadURL || uploadedPhoto.url;
    });

    return await Promise.all(uploadPromises);
  };

  // Handle file selection
  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      toast.error("Only image files are allowed");
    }

    setUploadingPhotos(validFiles);
  };

  // Add more photos to existing profile
  const addMorePhotosToProfile = async () => {
    if (uploadingPhotos.length === 0) {
      toast.error("Please select images to add");
      return;
    }

    setIsProcessing(true);

    try {
      const imageUrls = await uploadProfilePhotos(
        uploadingPhotos,
        currentUser.uid
      );

      const updatedProfile = await addPhotosToProfile(
        currentUser.uid,
        imageUrls.map((url) => ({ url })),
        (progress) => console.log("Adding photos progress:", progress)
      );

      setProfile(updatedProfile);
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      setUploadingPhotos([]);

      toast.success(`Added ${uploadingPhotos.length} photos to your profile!`);

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Failed to add photos:", error);
      toast.error(error.message || "Failed to add photos to profile");
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove selected photos from profile
  const removeSelectedPhotos = async () => {
    if (selectedPhotosToRemove.length === 0) {
      toast.error("Please select photos to remove");
      return;
    }

    if (profilePhotos.length - selectedPhotosToRemove.length < 2) {
      toast.error(
        "Cannot remove - would leave less than 2 photos. Delete the profile instead."
      );
      return;
    }

    setIsProcessing(true);

    try {
      await removePhotosFromProfile(currentUser.uid, selectedPhotosToRemove);

      setProfile(getFaceProfile(currentUser.uid));
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      setSelectedPhotosToRemove([]);

      toast.success(
        `Removed ${selectedPhotosToRemove.length} photos from profile`
      );

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Failed to remove photos:", error);
      toast.error(error.message || "Failed to remove photos");
    } finally {
      setIsProcessing(false);
    }
  };

  // Optimize profile by removing low quality photos
  const optimizeCurrentProfile = async () => {
    setIsProcessing(true);

    try {
      const optimizedProfile = optimizeProfile(currentUser.uid, 0.6);
      setProfile(optimizedProfile);
      setProfilePhotos(getProfilePhotos(currentUser.uid));

      toast.success("Profile optimized - removed low quality photos");

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Failed to optimize profile:", error);
      toast.error(error.message || "Failed to optimize profile");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete current face profile
  const deleteCurrentProfile = async () => {
    setIsProcessing(true);

    try {
      // Delete from memory
      deleteFaceProfile(currentUser.uid);

      // Delete from Firebase Storage
      try {
        await deleteFaceProfileFromStorage(currentUser.uid);
      } catch (storageError) {
        console.warn(
          "⚠️ Could not delete from Firebase Storage:",
          storageError
        );
      }

      toast.success("🗑️ Face profile deleted successfully");

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Failed to delete profile:", error);
      toast.error("Failed to delete profile: " + error.message);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Toggle photo selection for removal
  const togglePhotoSelection = (photoUrl) => {
    setSelectedPhotosToRemove((prev) =>
      prev.includes(photoUrl)
        ? prev.filter((url) => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                  Manage Face Profile
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Add, remove, or optimize your photos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {profile?.metadata?.method === "guided" ? (
            /* Smart Face Scan Profile */
            <div className="space-y-4 sm:space-y-6">
              {/* Status Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 rounded-full font-semibold text-sm sm:text-base mb-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Smart Face Scan Active
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  AI-guided scanning with {profilePhotos.length} scan points
                </p>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                      {profilePhotos.length}
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                      Scan Points
                    </p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      High
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                      Quality
                    </p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">
                      Active
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                      Status
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isProcessing}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:transform-none disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delete Profile
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Done
                  </button>
                </div>
              </div>

              {/* Profile Preview for Guided */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                <h5 className="font-bold text-gray-800 dark:text-white mb-4 text-center text-lg sm:text-xl">
                  Scan Preview
                </h5>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
                  {profilePhotos.slice(0, 20).map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.url}
                        alt={`Scan ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                      />
                    </div>
                  ))}
                  {profilePhotos.length > 20 && (
                    <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        +{profilePhotos.length - 20}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                  These photos were captured during your face scanning session
                </p>
              </div>
            </div>
          ) : (
            /* Photo Upload Profile */
            <div className="space-y-4 sm:space-y-6">
              {/* Status Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-4 py-2 rounded-full font-semibold text-sm sm:text-base mb-3">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  Photo Upload Profile Active
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Recognition based on {profilePhotos.length} uploaded photos
                </p>
              </div>

              {/* Upload Method Controls */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                  Add More Photos
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6">
                  Upload additional clear photos to improve recognition accuracy
                </p>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 sm:p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                    <div className="flex flex-col items-center gap-4">
                      <CameraIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Choose photos to upload
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Select multiple clear photos of yourself
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="w-full text-sm sm:text-base text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6 file:rounded-xl file:border-0 file:text-sm sm:file:text-base file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 file:transition-colors file:cursor-pointer cursor-pointer"
                      />
                    </div>
                  </div>
                  {uploadingPhotos.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Ready to upload {uploadingPhotos.length} photo
                        {uploadingPhotos.length > 1 ? "s" : ""}
                      </p>
                      <button
                        onClick={addMorePhotosToProfile}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:opacity-50"
                      >
                        {isProcessing
                          ? "Adding Photos..."
                          : `Add ${uploadingPhotos.length} Photo${
                              uploadingPhotos.length > 1 ? "s" : ""
                            }`}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Photos Management */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <h5 className="font-bold text-gray-800 dark:text-white text-lg sm:text-xl text-center sm:text-left">
                    Current Photos ({profilePhotos.length})
                  </h5>
                  {selectedPhotosToRemove.length > 0 && (
                    <button
                      onClick={removeSelectedPhotos}
                      disabled={isProcessing}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove {selectedPhotosToRemove.length} Photo
                      {selectedPhotosToRemove.length > 1 ? "s" : ""}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto">
                  {profilePhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                          selectedPhotosToRemove.includes(photo.url)
                            ? "border-red-500 bg-red-100 dark:bg-red-900/30 scale-95"
                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                        }`}
                        onClick={() => togglePhotoSelection(photo.url)}
                      >
                        <img
                          src={photo.url}
                          alt="Profile"
                          className="w-full aspect-square object-cover"
                        />
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-all ${
                            selectedPhotosToRemove.includes(photo.url)
                              ? "bg-red-500 bg-opacity-60"
                              : "bg-black bg-opacity-0 group-hover:bg-opacity-20"
                          }`}
                        >
                          {selectedPhotosToRemove.includes(photo.url) && (
                            <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          )}
                        </div>
                      </div>
                      {/* Quality indicator */}
                      <div className="absolute top-1 right-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            photo.quality > 0.8
                              ? "bg-green-500"
                              : photo.quality > 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Click photos to select for removal. Quality indicated by
                  colored dots.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={optimizeCurrentProfile}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isProcessing ? "Optimizing..." : "Optimize Photos"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Delete Profile
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Delete Face Profile?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This will permanently remove your face profile and all
                recognition data. You can always create a new one later.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isProcessing}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Keep Profile
              </button>
              <button
                onClick={deleteCurrentProfile}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceProfileManageModal;
