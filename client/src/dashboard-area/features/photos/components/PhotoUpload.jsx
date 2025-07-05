import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../auth-area/contexts/AuthContext";
import { uploadPhoto } from "../../../../shared/services/firebase/storage";
import { storage } from "../../../../shared/services/firebase/config";
import { usePlanLimits } from "../../../../shared/hooks/usePlanLimits";
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  StarIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

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
  disabled = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [planWarning, setPlanWarning] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { currentUser } = useAuth();

  // Plan limits integration
  const {
    canPerformAction,
    enforceLimit,
    getUsageInfo,
    getPlanFeatures,
    updateUsage,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
    loading: planLoading
  } = usePlanLimits();

  const usageInfo = getUsageInfo();
  const planFeatures = getPlanFeatures();

  // Enhanced limit calculations with plan integration
  const getActualLimits = () => {
    if (!planFeatures) {
      return {
        photosPerTrip: maxPhotos === Infinity ? 30 : maxPhotos, // Default free limit
        totalPhotos: Infinity,
        storage: 2 * 1024 * 1024 * 1024, // 2GB default
        remainingSlots: Math.max(0, 30 - currentPhotoCount)
      };
    }

    const photosPerTrip = planFeatures.photosPerTrip === 'unlimited' ? Infinity : planFeatures.photosPerTrip;
    const totalPhotos = planFeatures.photos === 'unlimited' ? Infinity : planFeatures.photos;
    const storage = planFeatures.storageBytes;

    // Calculate remaining slots based on the most restrictive limit
    let remainingSlots = Infinity;
    
    if (photosPerTrip !== Infinity) {
      remainingSlots = Math.min(remainingSlots, Math.max(0, photosPerTrip - currentPhotoCount));
    }
    
    if (totalPhotos !== Infinity && usageInfo) {
      remainingSlots = Math.min(remainingSlots, Math.max(0, totalPhotos - usageInfo.photos.used));
    }

    return {
      photosPerTrip,
      totalPhotos,
      storage,
      remainingSlots: remainingSlots === Infinity ? Infinity : remainingSlots
    };
  };

  const limits = getActualLimits();
  const isAtLimit = limits.remainingSlots <= 0;

  // Check plan limits when files are selected
  useEffect(() => {
    if (selectedFiles.length > 0) {
      checkPlanLimits();
    } else {
      setPlanWarning(null);
    }
  }, [selectedFiles, currentPhotoCount, usageInfo]);

  const checkPlanLimits = () => {
    if (!selectedFiles.length) return;

    const totalFileSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Check photo count limits
    const photoCheck = canPerformAction('upload_photos', {
      tripPhotoCount: currentPhotoCount,
      newPhotoCount: selectedFiles.length
    });

    if (!photoCheck.allowed) {
      setPlanWarning({
        type: 'photos',
        message: photoCheck.reason,
        upgradeRequired: photoCheck.upgradeRequired,
        currentUsage: photoCheck.currentUsage,
        limit: photoCheck.limit
      });
      return;
    }

    // Check storage limits
    const storageCheck = canPerformAction('upload_storage', {
      fileSize: totalFileSize
    });

    if (!storageCheck.allowed) {
      setPlanWarning({
        type: 'storage',
        message: storageCheck.reason,
        upgradeRequired: storageCheck.upgradeRequired,
        currentUsage: storageCheck.currentUsage,
        limit: storageCheck.limit,
        additionalNeeded: storageCheck.additionalNeeded
      });
      return;
    }

    setPlanWarning(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (filesArray) => {
    let processedFiles = [...filesArray];
    let warningMessage = null;

    // Limit files to remaining slots if there's a limit
    if (limits.remainingSlots !== Infinity && processedFiles.length > limits.remainingSlots) {
      processedFiles = processedFiles.slice(0, limits.remainingSlots);
      warningMessage = `Only ${limits.remainingSlots} more photos can be uploaded. Selected first ${limits.remainingSlots} files.`;
    }

    // Check file size limits
    const oversizedFiles = processedFiles.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      processedFiles = processedFiles.filter(file => file.size <= 10 * 1024 * 1024);
      warningMessage = `${oversizedFiles.length} file(s) exceeded 10MB limit and were removed.`;
    }

    setSelectedFiles(processedFiles);
    if (warningMessage) {
      setError(warningMessage);
      setTimeout(() => setError(null), 5000);
    } else {
      setError(null);
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
      processFiles(Array.from(e.dataTransfer.files));
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

    // Final plan limit enforcement
    if (!enforceLimit('upload_photos', {
      tripPhotoCount: currentPhotoCount,
      newPhotoCount: selectedFiles.length
    })) {
      return;
    }

    const totalFileSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (!enforceLimit('upload_storage', { fileSize: totalFileSize })) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploadedPhotos = [];
      let completed = 0;
      let totalStorageUsed = 0;

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
        totalStorageUsed += file.size;
        completed++;
        setUploadProgress(Math.round((completed / selectedFiles.length) * 100));
      }

      // Update usage statistics
      if (uploadedPhotos.length > 0) {
        updateUsage({
          photos: (usageInfo?.photos.used || 0) + uploadedPhotos.length,
          storage: (usageInfo?.storage.used || 0) + totalStorageUsed
        });
      }

      setSelectedFiles([]);
      setUploadProgress(0);
      setPlanWarning(null);

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

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  // Don't render if disabled and at limit, unless it's a plan limit
  if (disabled && !planWarning) {
    return null;
  }

  return (
    <>
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Header with Plan Status */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl flex items-center justify-center">
              <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {title}
                {limits.remainingSlots !== Infinity && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                    ({limits.remainingSlots} slots left)
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Plan Badge and Upgrade Button */}
          {!planLoading && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                isFreePlan 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  : isPremiumPlan
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                <StarIcon className="w-3 h-3" />
                {isFreePlan && 'Free'}
                {isPremiumPlan && 'Premium'}
                {isProPlan && 'Pro'}
              </div>
              
              {(isFreePlan || isPremiumPlan) && (
                <button
                  onClick={handleUpgradeClick}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium"
                >
                  <ArrowUpIcon className="w-3 h-3" />
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plan Usage Progress */}
        {usageInfo && !planLoading && (
          <div className="mb-4 sm:mb-6 space-y-3">
            {/* Photos Progress */}
            {planFeatures?.photos !== 'unlimited' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Total Photos</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {usageInfo.photos.used}/{planFeatures?.photos || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      usageInfo.photos.percentage > 90
                        ? 'bg-red-500'
                        : usageInfo.photos.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usageInfo.photos.percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Storage Progress */}
            {planFeatures?.storageBytes !== Number.MAX_SAFE_INTEGER && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {usageInfo.storage.usedFormatted}/{usageInfo.storage.limitFormatted}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      usageInfo.storage.percentage > 90
                        ? 'bg-red-500'
                        : usageInfo.storage.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usageInfo.storage.percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trip Photos Progress */}
            {planFeatures?.photosPerTrip !== 'unlimited' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Trip Photos</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {currentPhotoCount}/{planFeatures?.photosPerTrip || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      (currentPhotoCount / (planFeatures?.photosPerTrip || 1)) > 0.9
                        ? 'bg-red-500'
                        : (currentPhotoCount / (planFeatures?.photosPerTrip || 1)) > 0.75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((currentPhotoCount / (planFeatures?.photosPerTrip || 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Warning */}
        {planWarning && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1 text-sm">
                    Upload Limit Reached
                  </h4>
                  <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                    {planWarning.message}
                  </p>
                  {planWarning.upgradeRequired && (
                    <button
                      onClick={handleUpgradeClick}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
            className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
              dragActive
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : isAtLimit || planWarning
                ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
            } ${uploading || isAtLimit || planWarning ? "pointer-events-none" : ""}`}
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
              disabled={uploading || isAtLimit || !!planWarning}
            />

            {/* Content Layout */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Icon Section */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                  isAtLimit || planWarning
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30'
                }`}>
                  <CloudArrowUpIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    isAtLimit || planWarning
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`} />
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${
                  isAtLimit || planWarning
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {dragActive 
                    ? "Drop photos here" 
                    : isAtLimit 
                    ? "Upload limit reached" 
                    : planWarning
                    ? "Plan limit reached"
                    : "Drag & drop photos"
                  }
                </h4>

                {!isAtLimit && !planWarning && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 text-sm">
                    or{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300">
                      browse files
                    </span>
                  </p>
                )}

                {/* Info Tags */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    {acceptedFormats}
                  </span>
                  <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    Up to {maxFileSize}
                  </span>
                  {limits.remainingSlots !== Infinity && (
                    <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                      <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                      {limits.remainingSlots} slots left
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 px-3 py-2 rounded-lg sm:rounded-xl">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              {limits.remainingSlots !== Infinity && (
                <span className="ml-2">
                  ({Math.max(0, limits.remainingSlots - selectedFiles.length)} slots will remain)
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
          disabled={selectedFiles.length === 0 || uploading || !!planWarning}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading Photos...
            </>
          ) : planWarning ? (
            <>
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Plan Limit Reached
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 max-w-md w-full">
            {/* Upgrade Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">
              Upgrade Your Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Get more storage, photos, and features with a premium plan.
            </p>

            <div className="space-y-4 mb-6">
              {isPremiumPlan ? (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
                    Upgrade to Pro
                  </h4>
                  <ul className="text-purple-700 dark:text-purple-400 text-sm space-y-1">
                    <li>• Unlimited trips and photos</li>
                    <li>• 500GB storage</li>
                    <li>• Advanced AI recognition</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Upgrade to Premium
                  </h4>
                  <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
                    <li>• 50 trips with 500 photos each</li>
                    <li>• 50GB storage</li>
                    <li>• Advanced features</li>
                    <li>• Video support</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  // Navigate to upgrade page
                  console.log('Navigate to upgrade page');
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoUpload;