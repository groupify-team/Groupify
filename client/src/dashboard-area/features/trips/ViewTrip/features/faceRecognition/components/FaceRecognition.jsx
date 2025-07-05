import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  PhotoIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const FaceRecognition = ({
  canFilterByFace,
  hasProfile,
  isLoadingProfile,
  isProcessingFaces,
  filterActive,
  filteredPhotos = [],
  faceRecognitionProgress,
  onFindMyPhotos,
  onCancelProcessing,
  onNavigateToProfile,
  onPhotoSelect,
}) => {
  // Modal states
  const [showScanModal, setShowScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Animation states
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [modalContent, setModalContent] = useState("scan");

  // Statistics state
  const [lastScanDate, setLastScanDate] = useState(null);
  const [totalPhotosScanned, setTotalPhotosScanned] = useState(0);

  // Helper functions
  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  const getProgressPercentage = () => {
    if (!faceRecognitionProgress || faceRecognitionProgress.total === 0)
      return 0;
    return Math.round(
      (faceRecognitionProgress.current / faceRecognitionProgress.total) * 100
    );
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds < 0) return "";
    if (seconds < 60) return `~${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `~${minutes}m ${remainingSeconds}s remaining`;
  };

  const formatLastScan = (date) => {
    if (!date) return "Never scanned";
    const now = new Date();
    const scanDate = new Date(date);
    const diffInHours = Math.floor((now - scanDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return scanDate.toLocaleDateString();
  };

  // Smooth modal transitions
  const handleModalTransition = (from, to, delay = 300) => {
    setIsModalAnimating(true);

    setTimeout(() => {
      if (from === "scan") setShowScanModal(false);
      if (from === "results") setShowResultsModal(false);

      setTimeout(() => {
        setModalContent(to);
        if (to === "scan") setShowScanModal(true);
        if (to === "results") setShowResultsModal(true);
        setIsModalAnimating(false);
      }, delay);
    }, delay);
  };

  // Enhanced handlers
  const handleStartScanning = () => {
    setTotalPhotosScanned(faceRecognitionProgress?.total || 0);
    onFindMyPhotos();
  };

  const handleRescan = () => {
    if (!isProcessingFaces) {
      setShowResultsModal(false);
      setTimeout(() => {
        setShowScanModal(true);
      }, 300);
    }
  };

  const handleExportPhotos = async (exportType) => {
    const photosToExport = selectMode
      ? filteredPhotos.filter((p) => selectedPhotos.includes(p.id))
      : filteredPhotos;

    if (photosToExport.length === 0) {
      toast.error("No photos to export");
      return;
    }

    const exportToast = toast.loading(
      `Preparing ${photosToExport.length} photo${
        photosToExport.length > 1 ? "s" : ""
      } for download...`
    );

    try {
      if (exportType === "individual") {
        for (let i = 0; i < photosToExport.length; i++) {
          const photo = photosToExport[i];
          const link = document.createElement("a");
          link.href = fixPhotoUrl(photo.downloadURL);
          link.download = photo.fileName || `my-photo-${i + 1}.jpg`;
          link.target = "_blank";
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (i < photosToExport.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
        toast.dismiss(exportToast);
        toast.success(
          `Downloaded ${photosToExport.length} photos individually`
        );
      } else if (exportType === "zip") {
        const zip = new JSZip();

        for (let i = 0; i < photosToExport.length; i++) {
          const photo = photosToExport[i];
          toast.loading(
            `Processing photo ${i + 1}/${photosToExport.length}...`,
            {
              id: exportToast,
            }
          );

          try {
            const response = await fetch(fixPhotoUrl(photo.downloadURL));
            const blob = await response.blob();
            zip.file(photo.fileName || `my-photo-${i + 1}.jpg`, blob);
          } catch (error) {
            console.error(`Failed to download ${photo.fileName}:`, error);
          }
        }

        toast.loading("Creating ZIP file...", { id: exportToast });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFilename = `my-photos-${
          new Date().toISOString().split("T")[0]
        }.zip`;

        saveAs(zipBlob, zipFilename);
        toast.dismiss(exportToast);
        toast.success(`ZIP file downloaded: ${zipFilename}`);
      }
      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.dismiss(exportToast);
      toast.error("Failed to export photos. Please try again.");
    }
  };

  // Enhanced circular progress with smooth animation
  const CircularProgress = ({ percentage }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    }, [percentage]);

    const radius = 56;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset =
      circumference - (animatedPercentage / 100) * circumference;

    return (
      <div className="relative w-36 h-36">
        <svg className="transform -rotate-90 w-36 h-36">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Animated progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glowing center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {animatedPercentage}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Complete
            </div>
          </div>
        </div>

        {/* Pulsing ring effect */}
        <div className="absolute inset-2 rounded-full border-2 border-blue-400/20 animate-pulse"></div>
      </div>
    );
  };

  // Statistics display
  const StatisticsCard = () => (
    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-800/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4" />
          Scan Statistics
        </h4>
        <button
          onClick={handleRescan}
          disabled={isProcessingFaces}
          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Rescan
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {filteredPhotos.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Found / {totalPhotosScanned}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
            <ClockIcon className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatLastScan(lastScanDate)}
          </div>
        </div>
      </div>

      {filteredPhotos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Success Rate:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {Math.round((filteredPhotos.length / totalPhotosScanned) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Export Modal (similar to AllPhotosModal)
  const ExportModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 smooth-modal-enter">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <ArrowDownTrayIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Export Photos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose download format for{" "}
                {selectMode && selectedPhotos.length > 0
                  ? selectedPhotos.length
                  : filteredPhotos.length}{" "}
                photos
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleExportPhotos("individual")}
              className="w-full p-4 border border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-lg text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Individual Downloads
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Download each photo separately
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExportPhotos("zip")}
              className="w-full p-4 border border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-lg text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    ZIP Archive
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Download all photos in a ZIP file
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Update scan completion effect
  useEffect(() => {
    if (
      !isProcessingFaces &&
      filterActive &&
      showScanModal &&
      !isModalAnimating
    ) {
      setLastScanDate(new Date());
      handleModalTransition("scan", "results", 800);
    }
  }, [isProcessingFaces, filterActive, showScanModal, isModalAnimating]);

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 border-b border-blue-200/30 dark:border-blue-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <MagnifyingGlassIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Photos With Me
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filterActive
                    ? `${filteredPhotos.length} photos found`
                    : "AI-powered face detection"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {filterActive && filteredPhotos.length > 0 && (
                <button
                  onClick={() => setShowResultsModal(true)}
                  className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all smooth-hover"
                  title="View Results"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowScanModal(true)}
                disabled={isLoadingProfile}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 smooth-hover"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                {isLoadingProfile ? "Loading..." : "Find My Photos"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!filterActive ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {hasProfile
                  ? "Ready to find your photos!"
                  : "Setup your face profile"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm mx-auto">
                {hasProfile
                  ? "Use AI face recognition to automatically identify photos containing you."
                  : "Create a face profile in your Dashboard to enable photo detection."}
              </p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  hasProfile
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasProfile ? "bg-green-500" : "bg-orange-500"
                  } ${hasProfile ? "animate-pulse" : ""}`}
                ></div>
                {hasProfile ? "Profile Ready" : "No Profile"}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistics Card */}
              <StatisticsCard />

              {filteredPhotos.length === 0 ? (
                <div className="text-center py-6">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No matching photos found
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {filteredPhotos.slice(0, 6).map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square cursor-pointer group"
                        onClick={() => onPhotoSelect(photo)}
                      >
                        <img
                          src={fixPhotoUrl(photo.downloadURL)}
                          alt={photo.fileName}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <EyeIcon className="w-5 h-5 text-white" />
                        </div>
                        {photo.faceMatch && (
                          <div className="absolute top-1 right-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                photo.faceMatch.matchType === "strong"
                                  ? "bg-green-400"
                                  : "bg-blue-400"
                              } shadow-lg`}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowResultsModal(true)}
                    className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-medium transition-all border border-blue-200 dark:border-blue-800 smooth-hover"
                  >
                    View All {filteredPhotos.length} Photos With Me
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 smooth-modal-backdrop">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 smooth-modal-enter">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MagnifyingGlassIcon className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Find My Photos
                  </h3>
                </div>
                {!isProcessingFaces && (
                  <button
                    onClick={() => setShowScanModal(false)}
                    className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors smooth-hover"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isProcessingFaces ? (
                /* Ready State */
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Ready to scan!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      AI will analyze all photos to find ones containing you
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      hasProfile
                        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        : "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <UserCircleIcon
                        className={`w-5 h-5 ${
                          hasProfile
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          hasProfile
                            ? "text-green-700 dark:text-green-300"
                            : "text-orange-700 dark:text-orange-300"
                        }`}
                      >
                        {hasProfile ? "Face Profile Ready" : "No Face Profile"}
                      </span>
                    </div>
                  </div>

                  {hasProfile ? (
                    <button
                      onClick={handleStartScanning}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-3 rounded-xl font-medium transition-all smooth-hover"
                    >
                      Start Face Recognition
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowScanModal(false);
                        onNavigateToProfile();
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-xl font-medium transition-all smooth-hover"
                    >
                      Create Face Profile
                    </button>
                  )}
                </div>
              ) : (
                /* Processing State */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <CircularProgress percentage={getProgressPercentage()} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Scanning Photos...
                    </h3>
                    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-blue-200/30 dark:border-blue-800/30">
                      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                        {faceRecognitionProgress?.phase || "Processing..."}
                      </p>
                      {faceRecognitionProgress?.estimatedTimeRemaining && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {formatTimeRemaining(
                            faceRecognitionProgress.estimatedTimeRemaining
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {faceRecognitionProgress?.current || 0}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Scanned
                        </div>
                        <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                          of {faceRecognitionProgress?.total || 0} photos
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {faceRecognitionProgress?.matches?.length || 0}
                        </div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          Found
                        </div>
                        <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">
                          matches detected
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simple Match Counter */}
                  {faceRecognitionProgress?.matches &&
                    faceRecognitionProgress.matches.length > 0 && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-3 border border-emerald-200/30 dark:border-emerald-800/30">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                              Matches Found
                            </p>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {faceRecognitionProgress.matches.length}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            photos found so far
                          </div>
                        </div>
                      </div>
                    )}

                  <button
                    onClick={() => {
                      onCancelProcessing();
                      setShowScanModal(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all smooth-hover"
                  >
                    Cancel Scan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 smooth-modal-backdrop">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 smooth-modal-enter">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckIcon className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Photos With Me
                    </h3>
                    <p className="text-emerald-100 text-sm">
                      {filteredPhotos.length} photo
                      {filteredPhotos.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {filteredPhotos.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setSelectMode(!selectMode);
                          if (selectMode) setSelectedPhotos([]);
                        }}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all smooth-hover ${
                          selectMode
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-white/20 hover:bg-white/30 text-white"
                        }`}
                      >
                        {selectMode ? "Cancel" : "Select"}
                      </button>
                      <button
                        onClick={handleRescan}
                        disabled={isProcessingFaces}
                        className="px-3 py-2 rounded-lg font-medium text-sm bg-white/20 hover:bg-white/30 text-white transition-all smooth-hover disabled:opacity-50 flex items-center gap-1"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Rescan
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowResultsModal(false);
                      setSelectMode(false);
                      setSelectedPhotos([]);
                    }}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors smooth-hover"
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
                    No photos containing you were detected. Try updating your
                    face profile.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Enhanced Statistics */}
                  <StatisticsCard />

                  {selectMode && selectedPhotos.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-2">
                        <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-700 dark:text-green-300">
                          {selectedPhotos.length} photo
                          {selectedPhotos.length > 1 ? "s" : ""} selected
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filteredPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square cursor-pointer group"
                        onClick={() => {
                          if (selectMode) {
                            setSelectedPhotos((prev) =>
                              prev.includes(photo.id)
                                ? prev.filter((id) => id !== photo.id)
                                : [...prev, photo.id]
                            );
                          } else {
                            onPhotoSelect(photo);
                            setShowResultsModal(false);
                          }
                        }}
                      >
                        <img
                          src={fixPhotoUrl(photo.downloadURL)}
                          alt={photo.fileName}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {selectMode && (
                          <div className="absolute top-2 right-2 w-5 h-5 border-2 border-white rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            {selectedPhotos.includes(photo.id) && (
                              <CheckIcon className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                        )}

                        {photo.faceMatch && (
                          <div className="absolute top-2 left-2">
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                                photo.faceMatch.matchType === "strong"
                                  ? "bg-green-500/90"
                                  : "bg-blue-500/90"
                              }`}
                            >
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
                    <button
                      onClick={() => setShowExportModal(true)}
                      disabled={selectMode && selectedPhotos.length === 0}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 smooth-hover disabled:opacity-50"
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
                        onClick={() => {
                          // Handle delete logic here
                        }}
                        className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 smooth-hover"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && <ExportModal />}

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .smooth-modal-backdrop {
          animation: modalBackdropEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .smooth-modal-enter {
          animation: modalContentEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .smooth-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .smooth-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        @keyframes modalBackdropEnter {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        @keyframes modalContentEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-50px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Enhanced progress ring animation */
        .progress-ring {
          transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Smooth photo grid animations */
        .photo-grid-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .photo-grid-item:hover {
          transform: scale(1.05);
          z-index: 10;
        }

        /* Statistics card animation */
        .stats-card {
          animation: statsSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes statsSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FaceRecognition;
