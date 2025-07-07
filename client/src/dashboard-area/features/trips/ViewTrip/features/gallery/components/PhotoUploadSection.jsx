import React, { useState, useCallback, useRef } from "react";
import { 
  XMarkIcon, 
  PhotoIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpIcon
} from "@heroicons/react/24/outline";
import { usePhotoUploadLimits } from "../hooks/usePhotoUploadLimits";
import { toast } from "react-hot-toast";

const PhotoUploadSection = ({
  isOpen,
  onClose,
  tripId,
  currentPhotoCount = 0,
  onUploadComplete = () => {},
  onUploadStart = () => {},
}) => {
  const {
    validatePhotoUpload,
    canUploadMore,
    getRemainingPhotoSlots,
    getPhotoLimitStatus,
    getFormattedLimits,
    getPhotoUpgradeSuggestions,
    isApproachingPhotoLimit,
    trackUploadProgress,
    removeUploadProgress,
    uploadProgress,
    isValidating,
    planLimits,
    isFreePlan,
    isPremiumPlan,
  } = usePhotoUploadLimits(tripId, currentPhotoCount);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const limitStatus = getPhotoLimitStatus();
  const remainingSlots = getRemainingPhotoSlots();
  const formattedLimits = getFormattedLimits();
  const upgradeSuggestions = getPhotoUpgradeSuggestions();

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const validation = await validatePhotoUpload(files);
    
    if (validation.allowed && validation.files.length > 0) {
      setSelectedFiles(validation.files);
      setUploadStatus("ready");
      
      if (validation.rejectedFiles.length > 0) {
        toast.error(`${validation.rejectedFiles.length} files were rejected`);
      }
    } else {
      setSelectedFiles([]);
      setUploadStatus("error");
    }
  }, [validatePhotoUpload]);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  // Mock upload function - replace with your actual upload implementation
  const uploadFiles = useCallback(async () => {
    if (!selectedFiles.length) return;

    setIsUploading(true);
    setUploadStatus("uploading");
    onUploadStart();

    try {
      // Simulate upload progress for each file
      for (const fileData of selectedFiles) {
        // Track progress for this file
        for (let progress = 0; progress <= 100; progress += 10) {
          trackUploadProgress(fileData.id, progress);
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate upload time
        }
        
        // Remove progress tracking when complete
        removeUploadProgress(fileData.id);
      }

      // Simulate successful upload
      setUploadStatus("success");
      toast.success(`${selectedFiles.length} photos uploaded successfully!`);
      
      // Call completion callback
      onUploadComplete(selectedFiles);
      
      // Reset state
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadStatus(null);
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, trackUploadProgress, removeUploadProgress, onUploadStart, onUploadComplete, onClose]);

  // Clear selected files
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <PhotoIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Upload Photos</h3>
                <p className="text-white/70 text-xs">
                  {formattedLimits?.photos?.formatted || "Add memories to your trip"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Limit Status Warnings */}
          {limitStatus === "full" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 dark:text-red-400">
                      Photo Limit Reached
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      This trip has reached the maximum of {planLimits.photosPerTrip} photos.
                      {isFreePlan || isPremiumPlan ? " Upgrade to add more photos!" : " Delete some photos to upload new ones."}
                    </p>
                  </div>
                  {(isFreePlan || isPremiumPlan) && (
                    <button className="bg-white/20 hover:bg-white/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : limitStatus === "warning" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400">
                      Almost Full
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Only {remainingSlots} photo slots remaining out of {planLimits.photosPerTrip}.
                      {isApproachingPhotoLimit && " Consider upgrading for more space!"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Upload Progress Bar */}
          {formattedLimits?.photos && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {formattedLimits.photos.formatted}
                </span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {formattedLimits.photos.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${formattedLimits.photos.percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {limitStatus !== "full" && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                
                {/* Drag and Drop Zone */}
                <div
                  className={`relative p-8 border-2 border-dashed transition-all duration-300 ${
                    dragActive
                      ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isUploading || isValidating}
                  />

                  {/* Upload UI */}
                  <div className="text-center">
                    {uploadStatus === "uploading" ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto">
                          <CloudArrowUpIcon className="w-8 h-8 text-white animate-bounce" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          Uploading Photos...
                        </h3>
                        <div className="space-y-2">
                          {selectedFiles.map((fileData) => (
                            <div key={fileData.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                  {fileData.name}
                                </span>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                  {uploadProgress[fileData.id] || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : uploadStatus === "success" ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto">
                          <CheckCircleIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-400">
                          Upload Complete!
                        </h3>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} uploaded successfully
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                          {dragActive ? (
                            <ArrowUpIcon className="w-8 h-8 text-white animate-bounce" />
                          ) : (
                            <PhotoIcon className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                            {dragActive ? "Drop files here" : "Upload Photos"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {dragActive 
                              ? "Release to upload your photos"
                              : remainingSlots === "unlimited" 
                                ? "Drag & drop photos or click to browse"
                                : `${remainingSlots} slots remaining`
                            }
                          </p>
                        </div>

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && uploadStatus === "ready" && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-gray-800 dark:text-white">
                                Selected Files ({selectedFiles.length})
                              </h4>
                              <button
                                onClick={clearSelection}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                              {selectedFiles.map((fileData) => (
                                <div key={fileData.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-2">
                                  <PhotoIcon className="w-4 h-4 text-indigo-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {fileData.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {(fileData.size / 1024 / 1024).toFixed(1)}MB
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          {selectedFiles.length > 0 && uploadStatus === "ready" ? (
                            <>
                              <button
                                onClick={clearSelection}
                                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={uploadFiles}
                                disabled={isUploading}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50"
                              >
                                Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading || isValidating}
                              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isValidating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Validating...
                                </>
                              ) : (
                                <>
                                  <PhotoIcon className="w-4 h-4" />
                                  Choose Photos
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Suggestions */}
          {(limitStatus === "full" || isApproachingPhotoLimit) && upgradeSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-purple-800 dark:text-purple-300">
                  Need More Space?
                </h4>
              </div>
              <div className="space-y-2">
                {upgradeSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white capitalize">
                          {suggestion.targetPlan} Plan
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.benefit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 dark:text-purple-400">
                          {suggestion.price}
                        </p>
                        <p className="text-xs text-purple-500 dark:text-purple-400">
                          {suggestion.highlight}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadSection;