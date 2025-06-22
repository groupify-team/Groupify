import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { uploadPhoto } from "../../services/firebase/storage";
import { storage } from "../../services/firebase/config";
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

console.log("🔍 STORAGE:", storage);

const PhotoUpload = ({ 
  tripId, 
  onPhotoUploaded, 
  maxPhotos = Infinity, 
  currentPhotoCount = 0,
  title = "Upload Photos",
  subtitle = "Add memories to your trip",
  acceptedFormats = "JPG, PNG, GIF",
  maxFileSize = "10MB",
  showLimitWarning = false,
  limitWarningText = "",
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const { currentUser } = useAuth();

  // Calculate remaining slots
  const remainingSlots = maxPhotos === Infinity ? Infinity : Math.max(0, maxPhotos - currentPhotoCount);
  const isAtLimit = remainingSlots <= 0;

  const handleFileChange = (e) => {
    if (e.target.files) {
      let filesArray = Array.from(e.target.files);
      
      // Limit files to remaining slots if there's a limit
      if (remainingSlots !== Infinity && filesArray.length > remainingSlots) {
        filesArray = filesArray.slice(0, remainingSlots);
        setError(`Only ${remainingSlots} more photos can be uploaded. Selected first ${remainingSlots} files.`);
      } else {
        setError(null);
      }
      
      setSelectedFiles(filesArray);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      let filesArray = Array.from(e.dataTransfer.files);
      
      // Limit files to remaining slots if there's a limit
      if (remainingSlots !== Infinity && filesArray.length > remainingSlots) {
        filesArray = filesArray.slice(0, remainingSlots);
        setError(`Only ${remainingSlots} more photos can be uploaded. Selected first ${remainingSlots} files.`);
      } else {
        setError(null);
      }
      
      setSelectedFiles(filesArray);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    // Final check before upload
    if (remainingSlots !== Infinity && selectedFiles.length > remainingSlots) {
      setError(`Cannot upload ${selectedFiles.length} photos. Only ${remainingSlots} slots remaining.`);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploadedPhotos = [];
      let completed = 0;

      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/")) {
          setError(
            `File ${file.name} is not an image. Only images are allowed.`
          );
          continue;
        }

        const uploadedPhoto = await uploadPhoto(
          file,
          tripId,
          currentUser.uid,
          {
            originalName: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          },
          (percent) => {
            const overall = Math.round(
              ((completed + percent / 100) / selectedFiles.length) * 100
            );
            setUploadProgress(overall);
          }
        );

        uploadedPhotos.push(uploadedPhoto);
        completed++;
        setUploadProgress(Math.round((completed / selectedFiles.length) * 100));
      }

      setSelectedFiles([]);
      setUploadProgress(0);

      if (onPhotoUploaded && uploadedPhotos.length > 0) {
        onPhotoUploaded(uploadedPhotos);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      setError("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Don't render if disabled and at limit
  if (disabled || isAtLimit) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
          <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {title}
            {remainingSlots !== Infinity && (
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                ({remainingSlots} slots left)
              </span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Limit Warning */}
      {showLimitWarning && limitWarningText && (
        <div className="bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-sm border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{limitWarningText}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
          Select Photos
        </label>

        <div
          className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CloudArrowUpIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {dragActive ? "Drop photos here" : "Drag & drop photos"}
            </h4>

            <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm">
              or{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300">
                browse files
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                {acceptedFormats}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                Up to {maxFileSize} each
              </span>
              {remainingSlots !== Infinity && (
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  {remainingSlots} slots left
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 px-3 py-2 rounded-lg sm:rounded-xl">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            {remainingSlots !== Infinity && (
              <span className="ml-2">
                ({remainingSlots - selectedFiles.length} slots will remain)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Selected Files
          </h4>
          <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-600/50"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <DocumentIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="p-1 sm:p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md sm:rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading...
            </span>
            <span className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 sm:h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uploading Photos...
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}
            Photo{selectedFiles.length !== 1 ? "s" : ""}
          </>
        )}
      </button>
    </div>
  );
};

export default PhotoUpload;