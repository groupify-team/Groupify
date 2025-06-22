import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createFaceProfile } from "../../services/faceRecognitionService";
import { saveFaceProfileToStorage } from "../../services/firebase/faceProfiles";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../services/firebase/config";
import SmartFaceScan from "./SmartFaceScan"; // We'll create this next
import {
  XMarkIcon,
  CameraIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  SparklesIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

const FaceProfileModal = ({ isOpen, onClose, onProfileCreated }) => {
  const { currentUser } = useAuth();

  // Setup method selection
  const [setupMethod, setSetupMethod] = useState(null); // null, 'guided', 'upload'

  // Manual upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Common states
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    setSetupMethod(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError("");
    setSuccess(false);
    setProgress(null);
    setIsCreating(false);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  // Manual upload functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      if (selectedFiles.length >= 5) {
        setError("Maximum 5 photos allowed");
        return;
      }

      const url = URL.createObjectURL(file);
      setSelectedFiles((prev) => [...prev, file]);
      setPreviewUrls((prev) => [...prev, url]);
      setError("");
    });
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to Firebase Storage
  const uploadFiles = async (files) => {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `profile_photos/${currentUser.uid}/${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  };

  // Create face profile using the face-api.js service
  const handleCreateProfile = async () => {
    if (selectedFiles.length < 2) {
      setError("Please select at least 2 photos");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      setProgress({
        phase: "Uploading photos...",
        current: 0,
        total: selectedFiles.length,
      });

      // Upload files first
      const imageUrls = await uploadFiles(selectedFiles);

      // Create profile using face-api.js service
      const profile = await createFaceProfile(
        currentUser.uid,
        imageUrls.map((url) => ({ url })),
        (progressData) => {
          setProgress(progressData);
        }
      );

      // Save to Firebase
      await saveFaceProfileToStorage(currentUser.uid, {
        images: imageUrls.map((url, index) => ({
          url,
          uploadedAt: new Date().toISOString(),
          filename: selectedFiles[index].name,
          captureMethod: "upload",
        })),
        createdAt: new Date().toISOString(),
        method: "upload",
        engine: "face-api.js",
        metadata: profile.metadata,
      });

      setSuccess(true);
      setProgress({
        phase: "Face profile created successfully!",
        current: 100,
        total: 100,
      });

      if (onProfileCreated) {
        onProfileCreated(true);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating face profile:", error);
      setError(error.message || "Failed to create face profile");
    } finally {
      setIsCreating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  if (!isOpen) return null;

  // If user selected guided method, show SmartFaceScan component
  if (setupMethod === "guided") {
    return (
      <SmartFaceScan
        isOpen={isOpen}
        onClose={handleClose}
        onProfileCreated={onProfileCreated}
        onBack={() => setSetupMethod(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl lg:max-w-[95vw] xl:max-w-[90vw] mx-auto min-h-[85vh] sm:min-h-[80vh] lg:min-h-[75vh] border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="w-6"></div> {/* Smaller spacer */}
          <div className="flex items-center gap-3 -ml-4">
            {" "}
            {/* Added negative margin to shift left */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Face Profile Setup
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Enhanced AI recognition
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {/* Error/Success/Progress Display */}
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-400">
                  Enhanced face profile created successfully!
                </p>
              </div>
            </div>
          )}

          {progress && (
            <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  {progress.phase}
                </p>
              </div>
              {progress.current && progress.total && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Method Selection */}
          {!setupMethod && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">
                      🚀 Enhanced Face Recognition
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Powered by <strong>face-api.js</strong> for 90%+ accuracy
                      with proper lighting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Method Selection Cards */}
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                {/* Smart Face Scan Option */}
                <div
                  onClick={() => setSetupMethod("guided")}
                  className="relative cursor-pointer group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Best Accuracy Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-2 py-1 sm:px-3 sm:py-1 md:px-2 md:py-0.5 lg:px-3 lg:py-1 xl:px-4 xl:py-1.5 rounded-full shadow-lg text-xs sm:text-xs md:text-[10px] lg:text-xs xl:text-sm">
                        ✨ BEST ACCURACY
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform mt-8">
                      <CameraIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 text-center">
                      Smart Face Scan
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 text-center px-2">
                      AI-guided capture with quality assessment - only 5
                      optimized photos needed
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {[
                        "99%+ face-api.js accuracy",
                        "Real-time quality checking",
                        "Fewer false positives",
                        "128D face embeddings",
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg">
                      <PlayIcon className="w-5 h-5" />
                      Start Smart Setup
                    </button>
                  </div>
                </div>

                {/* Manual Upload Option */}
                <div
                  onClick={() => setSetupMethod("upload")}
                  className="cursor-pointer group h-full"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all duration-300 group-hover:scale-[1.02] h-full flex flex-col">
                    {/* Icon */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform mt-8">
                      <PhotoIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 text-center">
                      Upload Photos
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 text-center px-2">
                      Upload 2-5 existing high-quality photos of yourself
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {[
                        "Use existing photos",
                        "No camera required",
                        "Quality auto-assessment",
                        "Depends on photo quality",
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg">
                      <PhotoIcon className="w-5 h-5" />
                      Choose Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Upload Flow */}
          {setupMethod === "upload" && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setSetupMethod(null)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
              >
                ← Back to methods
              </button>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group"
              >
                <PhotoIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 mb-4 transition-colors" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2 transition-colors text-center">
                  Upload Your Photos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm">
                  Select 2-5 clear, high-quality photos of yourself
                  <br />
                  <span className="text-xs">Maximum 10MB per photo</span>
                </p>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium group-hover:scale-105 transition-transform shadow-lg">
                  Choose Files
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Selected Photos Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-indigo-600" />
                    Selected Photos ({selectedFiles.length}/5)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 sm:h-28 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          disabled={isCreating}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Create Profile Button for Upload */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleCreateProfile}
                      disabled={isCreating || selectedFiles.length < 2}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-8 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none flex items-center gap-2"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      {isCreating
                        ? "Creating Enhanced Profile..."
                        : "Create Enhanced Profile"}
                    </button>
                  </div>
                </div>
              )}

              {/* Tips Section */}
              <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                  📸 Tips for Best Results
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  {[
                    "Upload 2-5 high-quality, well-lit photos",
                    "Include different angles but keep face clearly visible",
                    "Avoid sunglasses, masks, or heavy shadows",
                    "Photos should be sharp and at least 300x300 pixels",
                    "AI will automatically assess photo quality and optimize recognition",
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceProfileModal;
