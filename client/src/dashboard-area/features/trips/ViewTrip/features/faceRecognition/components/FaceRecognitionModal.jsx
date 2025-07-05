import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const FaceRecognitionModal = ({
  isOpen,
  hasProfile,
  isProcessingFaces,
  faceRecognitionProgress,
  onClose,
  onStartFaceRecognition,
  onCancelProcessing,
  onNavigateToProfile,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading time when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      // LISTEN FOR MODEL LOADING PROGRESS
      if (
        faceRecognitionProgress?.phase?.includes("Loading") ||
        faceRecognitionProgress?.phase?.includes("Initializing")
      ) {
        setIsLoading(true);
      } else if (
        faceRecognitionProgress?.phase?.includes("ready") ||
        faceRecognitionProgress?.phase?.includes("scan")
      ) {
        setIsLoading(false);
      } else {
        // Default loading time
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, faceRecognitionProgress?.phase]);

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

  //  circular progress with smooth animation
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
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
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
            className="transition-all duration-300 ease-out" // 🔥 SHORTER TRANSITION
            style={{
              filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
            }}
          />
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

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {Math.round(animatedPercentage)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Complete
            </div>
          </div>
        </div>

        <div className="absolute inset-2 rounded-full border-2 border-blue-400/20 animate-pulse"></div>
      </div>
    );
  };

  // Loading Component
  const LoadingScreen = () => (
    <div className="p-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-20 animate-pulse"></div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Preparing Face Recognition...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Loading AI models and initializing face detection
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This will only take a moment...
          </p>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              <h3 className="text-lg font-bold text-white">Find My Photos</h3>
            </div>
            {!isProcessingFaces && !isLoading && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-200"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingScreen />
        ) : !isProcessingFaces ? (
          /* Ready State */
          <div className="p-6">
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
                className={`p-3 rounded-xl border transition-all duration-300 ${
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
                  onClick={onStartFaceRecognition}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Start Face Recognition
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToProfile();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Create Face Profile
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Processing State */
          <div className="p-6">
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

              {/* Real-time match counter */}
              {faceRecognitionProgress?.matches &&
                faceRecognitionProgress.matches.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-3 border border-emerald-200/30 dark:border-emerald-800/30 animate-pulse">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                          Matches Found
                        </p>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
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
                onClick={onCancelProcessing}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                Cancel Scan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes animate-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes animate-scale-in {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .animate-fade-in {
            animation: animate-fade-in 0.3s ease-out;
          }

          .animate-scale-in {
            animation: animate-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}
      </style>
    </div>
  );
};

export default FaceRecognitionModal;
