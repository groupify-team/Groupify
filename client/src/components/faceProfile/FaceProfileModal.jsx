import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createFaceProfile } from "../../services/faceRecognitionService"; // Updated import
import { saveFaceProfileToStorage } from "../../services/firebase/faceProfiles";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../services/firebase/config";
import Modern3DHead from "./Modern3DHead";
import {
  XMarkIcon,
  CameraIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  SparklesIcon,
  ArrowLeftIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const FaceProfileModal = ({ isOpen, onClose, onProfileCreated }) => {
  const { currentUser } = useAuth();

  // Setup method selection
  const [setupMethod, setSetupMethod] = useState(null); // null, 'guided', 'upload'

  // Guided capture states
  const [guidedStep, setGuidedStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Manual upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Common states
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stream, setStream] = useState(null);
  const [showMobileGuide, setShowMobileGuide] = useState(true);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isCapturingRef = useRef(false);

  // Enhanced capture steps for better face recognition (reduced to 3 for better quality)
  const captureSteps = [
    {
      id: "front",
      title: "Face Forward",
      instruction: "Look directly at the camera with a neutral expression",
      icon: "👤",
      tip: "Keep your face centered and well-lit. This is the most important photo.",
      color: "from-emerald-500 to-green-500",
    },
    {
      id: "slight_right",
      title: "Slight Right Turn",
      instruction: "Turn your head just 15-20° to the right",
      icon: "👤↗️",
      tip: "Gentle turn - both eyes should still be clearly visible",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "slight_left",
      title: "Slight Left Turn",
      instruction: "Turn your head just 15-20° to the left",
      icon: "👤↖️",
      tip: "Gentle turn - both eyes should still be clearly visible",
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "up_face",
      title: "Face Up",
      instruction: "Tilt your head slightly up (10-15°)",
      icon: "👤⬆️",
      tip: "Gentle upward tilt - keep eyes looking at camera",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "down_face",
      title: "Face Down",
      instruction: "Tilt your head slightly down (10-15°)",
      icon: "👤⬇️",
      tip: "Gentle downward tilt - keep eyes looking at camera",
      color: "from-pink-500 to-rose-500",
    },
  ];

  // Dynamic guide component
  const DynamicGuide = ({ step }) => {
    return <Modern3DHead step={step} captureSteps={captureSteps} />;
  };

  // Cleanup function
  const cleanup = () => {
    setSetupMethod(null);
    setGuidedStep(0);
    setCapturedPhotos([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError("");
    setSuccess(false);
    setProgress(null);
    setShowPreview(false);
    stopCamera();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setError("Could not access camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  const capturePhotoWithCountdown = () => {
    if (isCapturingRef.current) return;

    isCapturingRef.current = true;
    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setCountdown(0);

          setTimeout(() => {
            if (isCapturingRef.current) {
              captureCurrentStep();
            }
          }, 500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureCurrentStep = () => {
    if (!isCapturingRef.current || !videoRef.current || !canvasRef.current)
      return;

    isCapturingRef.current = false;
    setIsCapturing(false);
    setCountdown(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const currentStepIndex = capturedPhotos.length;
    const currentStep = captureSteps[currentStepIndex];

    if (!currentStep) {
      console.warn("⛔️ Tried to capture more steps than defined.");
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.warn("❗️ No image blob captured.");
          return;
        }

        const file = new File(
          [blob],
          `face-${currentStep.id}-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        setCapturedPhotos((prev) => {
          const newPhotos = [
            ...prev,
            {
              file,
              step: currentStep,
              url: URL.createObjectURL(file),
            },
          ];

          if (newPhotos.length >= captureSteps.length) {
            setTimeout(() => {
              setShowPreview(true);
              stopCamera();
            }, 1000);
          } else {
            setTimeout(() => {
              setGuidedStep((prev) => prev + 1);
            }, 1000);
          }

          return newPhotos;
        });
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = (stepIndex) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== stepIndex));
    setGuidedStep(stepIndex);
    setShowPreview(false);
    startCamera();
  };

  const resetGuidedCapture = () => {
    setCapturedPhotos([]);
    setGuidedStep(0);
    setShowPreview(false);
    startCamera();
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
        // Reduced from 10 to 5 for better quality
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

  // Create face profile using the new face-api.js service
  const handleCreateProfile = async () => {
    const photos =
      setupMethod === "guided"
        ? capturedPhotos.map((cp) => cp.file)
        : selectedFiles;

    if (photos.length < 2) {
      setError("Please capture at least 2 photos");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      setProgress({
        phase: "Uploading photos...",
        current: 0,
        total: photos.length,
      });

      // Upload files first
      const imageUrls = await uploadFiles(photos);

      // Create profile using new face-api.js service
      const profile = await createFaceProfile(
        currentUser.uid,
        imageUrls.map((url) => ({ url })), // Convert to expected format
        (progressData) => {
          setProgress(progressData);
        }
      );

      // Save to Firebase
      await saveFaceProfileToStorage(currentUser.uid, {
        images: imageUrls.map((url, index) => ({
          url,
          uploadedAt: new Date().toISOString(),
          filename: photos[index].name,
          captureMethod: setupMethod,
        })),
        createdAt: new Date().toISOString(),
        method: setupMethod,
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

  // Initialize camera when guided method is selected
  useEffect(() => {
    if (setupMethod === "guided" && !showPreview) {
      startCamera();
    }
    return () => {
      if (setupMethod !== "guided") {
        stopCamera();
      }
    };
  }, [setupMethod, showPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      capturedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  // PART 1: COMPLETE RETURN SECTION - START TO METHOD SELECTION

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-2">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl w-[98vw] max-w-[98vw] h-[95vh] flex flex-col border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          {/* Left side - Back button */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {setupMethod && (
              <button
                onClick={() => setSetupMethod(null)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs sm:text-sm p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              <span className="hidden sm:inline">
                Setup Face Profile (Enhanced)
              </span>
              <span className="sm:hidden">Face Profile</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              AI-powered face recognition using face-api.js for superior
              accuracy
            </p>
          </div>

          {/* Right side - Progress indicator and close */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            {setupMethod === "guided" && !showPreview && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full backdrop-blur-sm">
                <SparklesIcon className="w-3 h-3 text-indigo-500" />
                <span>
                  {capturedPhotos.length + 1}/{captureSteps.length}
                </span>
              </div>
            )}
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3 flex-1 overflow-y-auto">
          {/* Error/Success/Progress Display */}
          {error && (
            <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-green-800 dark:text-green-400">
                  Enhanced face profile created successfully! Now enjoy much
                  more accurate photo recognition.
                </p>
              </div>
            </div>
          )}
          {progress && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-400">
                  {progress.phase}
                </p>
              </div>
              {progress.current && progress.total && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
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
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-1 text-sm sm:text-base">
                      🚀 Enhanced Face Recognition
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                      Now powered by <strong>face-api.js</strong> for
                      significantly better accuracy. Expect 90%+ accuracy with
                      proper lighting!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Choose Setup Method
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
                  Select how you'd like to create your enhanced face profile
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Guided Capture Option */}
                <div
                  onClick={() => setSetupMethod("guided")}
                  className="relative cursor-pointer group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-all duration-300">
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                        ✨ BEST ACCURACY
                      </span>
                    </div>

                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-105 transition-transform">
                      <CameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 text-center">
                      Smart Face Scan
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 text-center px-2">
                      AI-guided capture with quality assessment - only 3
                      optimized photos needed
                    </p>

                    <div className="space-y-2 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>99%+ face-api.js accuracy</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>Real-time quality checking</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>Fewer false positives</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>128D face embeddings</span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg text-sm sm:text-base">
                      <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Start Smart Setup
                    </button>
                  </div>
                </div>

                {/* Manual Upload Option */}
                <div
                  onClick={() => setSetupMethod("upload")}
                  className="cursor-pointer group"
                >
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-105 transition-transform">
                      <PhotoIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 text-center">
                      Upload Photos
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 text-center px-2">
                      Upload 2-5 existing high-quality photos of yourself
                    </p>

                    <div className="space-y-2 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span>Use existing photos</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span>No camera required</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span>Quality auto-assessment</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <InformationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                        <span>Depends on photo quality</span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg text-sm sm:text-base">
                      <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Choose Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Ultimate Face Scan Interface */}
          {setupMethod === "guided" && !showPreview && (
            <>
              {/* Mobile Guide Modal */}
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none">
                <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 shadow-2xl transform transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 bg-gradient-to-r ${
                            captureSteps[capturedPhotos.length]?.color ||
                            "from-gray-500 to-gray-600"
                          } rounded-full animate-pulse`}
                        ></div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white">
                          {captureSteps[capturedPhotos.length]?.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowMobileGuide(!showMobileGuide)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {showMobileGuide ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        showMobileGuide
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 scale-75">
                          <DynamicGuide step={capturedPhotos.length} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {captureSteps[capturedPhotos.length]?.instruction}
                          </p>
                          <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-2">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 text-sm flex-shrink-0">
                                💡
                              </span>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {captureSteps[capturedPhotos.length]?.tip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (capturedPhotos.length / captureSteps.length) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {capturedPhotos.length}/{captureSteps.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Interface */}
              <div className="space-y-2 sm:space-y-3">
                {/* Main Grid Layout - FIXED for all screen sizes */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full min-h-0">
                  {/* Left Panel - Desktop Only */}
                  <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col space-y-3 max-h-full overflow-hidden">
                    {/* 3D Avatar Guide - Fixed height */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-3 border border-white/20 dark:border-gray-700/50 shadow-2xl flex-shrink-0 h-fit">
                      <div className="text-center">
                        <div className="scale-75 xl:scale-90">
                          <DynamicGuide step={capturedPhotos.length} />
                        </div>
                      </div>
                    </div>

                    {/* Current Step Instructions - Scrollable if needed */}
                    {captureSteps[capturedPhotos.length] && (
                      <div className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-2xl p-3 border border-white/30 dark:border-gray-700/50 shadow-2xl flex-1 min-h-0 overflow-y-auto">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 bg-gradient-to-r ${
                                captureSteps[capturedPhotos.length].color
                              } rounded-full animate-pulse`}
                            ></div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                              {captureSteps[capturedPhotos.length].title}
                            </h3>
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {captureSteps[capturedPhotos.length].instruction}
                          </p>

                          <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-2 backdrop-blur-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 text-xs flex-shrink-0">
                                💡
                              </span>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {captureSteps[capturedPhotos.length].tip}
                              </p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">💡</span>
                              </div>
                              <div className="text-xs font-semibold text-blue-800 dark:text-blue-400">
                                Quick Tips
                              </div>
                            </div>
                            <div className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                              <div className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                <span>Keep face centered</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                <span>Good lighting</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                <span>Look at camera</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center Panel - Camera - RESPONSIVE */}
                  <div className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col min-h-0 h-full">
                    {/* Mobile Instructions - Compact */}
                    <div className="lg:hidden mb-2 flex-shrink-0">
                      {captureSteps[capturedPhotos.length] && (
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-2 border border-white/20 dark:border-gray-700/50 shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 scale-50">
                              <DynamicGuide step={capturedPhotos.length} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                                {captureSteps[capturedPhotos.length].title}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {
                                  captureSteps[capturedPhotos.length]
                                    .instruction
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera Container - RESPONSIVE HEIGHT */}
                    <div className="relative flex-1 bg-black rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/10 dark:border-gray-700/30 aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[500px]">
                      {/* Video Stream */}
                      <div className="absolute inset-0">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Face Guide with Full Screen Blur Effect */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Blurred overlay with circular cutout */}
                        <div
                          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                          style={{
                            maskImage:
                              "radial-gradient(circle at center, transparent 120px, black 140px)",
                            WebkitMaskImage:
                              "radial-gradient(circle at center, transparent 120px, black 140px)",
                          }}
                        ></div>

                        {/* Clear focus area indicators */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Main face guide - head-sized */}
                          <div className="relative">
                            <div className="w-60 h-88 sm:w-72 sm:h-104 md:w-80 md:h-120 lg:w-88 lg:h-136 border-4 border-green-400/90 rounded-full border-dashed animate-face-guide-pulse shadow-xl shadow-green-400/30"></div>

                            {/* Inner guidance circle */}
                            <div className="absolute inset-4 border-2 border-white/70 rounded-full border-dotted animate-pulse"></div>

                            {/* Perfect positioning guides */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-1 h-16 bg-green-400/50 rounded-full"></div>
                              <div className="absolute w-16 h-1 bg-green-400/50 rounded-full"></div>
                              <div className="w-4 h-4 bg-green-400 rounded-full animate-ping border-2 border-white/50"></div>
                            </div>

                            {/* Corner alignment markers */}
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-6 h-6 border-3 border-green-400 animate-breathe"
                                style={{
                                  top: i < 2 ? "15%" : "85%",
                                  left: i % 2 === 0 ? "15%" : "85%",
                                  borderRadius: "50% 0",
                                  transform: `translate(-50%, -50%) rotate(${
                                    i * 90
                                  }deg)`,
                                  animationDelay: `${i * 0.2}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Status Overlay - RESPONSIVE */}
                      <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 right-2 sm:right-3 lg:right-4 flex justify-between items-start">
                        {/* Current Step Badge - Responsive */}
                        <div
                          className={`bg-gradient-to-r ${
                            captureSteps[capturedPhotos.length]?.color ||
                            "from-gray-500 to-gray-600"
                          } px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-xs font-medium shadow-lg backdrop-blur-sm bg-opacity-90 flex items-center gap-1 sm:gap-2`}
                        >
                          <span className="text-xs sm:text-sm">
                            {captureSteps[capturedPhotos.length]?.icon}
                          </span>
                          <span className="hidden sm:inline text-xs lg:text-sm">
                            {captureSteps[capturedPhotos.length]?.title}
                          </span>
                        </div>

                        {/* Quality Indicator - Responsive */}
                        <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg border border-white/20">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                          <span>FOCUS ACTIVE</span>
                          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        </div>
                      </div>

                      {/* Countdown - RESPONSIVE */}
                      {countdown > 0 && (
                        <div className="absolute top-4 right-4 z-20">
                          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <div className="text-center">
                              <div className="relative">
                                <div className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold animate-ping mb-2">
                                  {countdown}
                                </div>
                                <div className="absolute inset-0 text-white/30 text-3xl sm:text-4xl lg:text-5xl font-bold animate-pulse">
                                  {countdown}
                                </div>
                              </div>
                              <div className="text-white/90 text-xs sm:text-sm font-medium animate-pulse">
                                Get Ready...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scanning Animation */}
                      {isCapturing && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-pulse">
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scanning-line"></div>
                          </div>
                        </div>
                      )}

                      {/* Controls - RESPONSIVE */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          {/* Progress - Compact */}
                          <div className="text-white/90 text-xs">
                            <div className="font-semibold">
                              Step {capturedPhotos.length + 1}
                            </div>
                            <div className="text-white/70 text-xs flex items-center gap-1">
                              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                              <span className="hidden sm:inline">
                                {capturedPhotos.length} done
                              </span>
                              <span className="sm:hidden">
                                {capturedPhotos.length}
                              </span>
                            </div>
                          </div>

                          {/* Capture Button - RESPONSIVE */}
                          <div className="relative">
                            <button
                              onClick={capturePhotoWithCountdown}
                              disabled={isCapturing}
                              className="relative group"
                            >
                              <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

                              <div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-2 sm:border-3 border-white/60 rounded-full flex items-center justify-center group-hover:border-white/90 transition-all duration-300 group-active:scale-95 backdrop-blur-sm">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white rounded-full shadow-2xl group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                                  {isCapturing ? (
                                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-red-500 rounded-sm animate-pulse"></div>
                                  ) : (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-red-500 rounded-full group-hover:bg-white transition-all duration-300 group-hover:scale-75"></div>
                                  )}
                                </div>
                              </div>

                              {!isCapturing && (
                                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-2 border-white/20 rounded-full animate-ping"></div>
                              )}
                            </button>
                          </div>

                          {/* Actions - Compact */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={resetGuidedCapture}
                              disabled={isCapturing}
                              className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-white/20"
                            >
                              Reset
                            </button>
                            <div className="text-white/60 text-xs text-center">
                              {Math.round(
                                (capturedPhotos.length / captureSteps.length) *
                                  100
                              )}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Progress - RESPONSIVE */}
                  <div className="col-span-1 lg:col-span-3 flex flex-col space-y-2 sm:space-y-3 max-h-full overflow-hidden">
                    {/* Circular Progress - Compact */}
                    <div className="bg-gradient-to-br from-white/95 to-white/85 dark:from-gray-800/95 dark:to-gray-800/85 backdrop-blur-xl rounded-2xl p-4 border border-white/30 dark:border-gray-700/50 shadow-2xl flex-shrink-0">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse"></div>
                          Progress
                        </div>

                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
                          {/* Background circle with glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-lg"></div>

                          <svg className="transform -rotate-90 w-full h-full relative z-10">
                            {/* Background track */}
                            <circle
                              cx="50%"
                              cy="50%"
                              r="35%"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              className="text-gray-200 dark:text-gray-700 drop-shadow-sm"
                            />

                            {/* Progress circle with enhanced styling */}
                            <circle
                              cx="50%"
                              cy="50%"
                              r="35%"
                              stroke="url(#enhancedProgressGradient)"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 35}`}
                              strokeDashoffset={`${
                                2 *
                                Math.PI *
                                35 *
                                (1 -
                                  capturedPhotos.length / captureSteps.length)
                              }`}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-out drop-shadow-lg"
                              style={{
                                filter:
                                  "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
                              }}
                            />

                            {/* Enhanced gradient definition */}
                            <defs>
                              <linearGradient
                                id="enhancedProgressGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="25%" stopColor="#3b82f6" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="75%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#ef4444" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Center content with animation */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                                {capturedPhotos.length}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                /{captureSteps.length}
                              </div>
                            </div>
                          </div>

                          {/* Completion sparkles */}
                          {capturedPhotos.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                              {[...Array(capturedPhotos.length)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                                  style={{
                                    left: `${
                                      50 +
                                      30 *
                                        Math.cos(
                                          (i * 2 * Math.PI) /
                                            captureSteps.length
                                        )
                                    }%`,
                                    top: `${
                                      50 +
                                      30 *
                                        Math.sin(
                                          (i * 2 * Math.PI) /
                                            captureSteps.length
                                        )
                                    }%`,
                                    animationDelay: `${i * 0.2}s`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Enhanced progress text */}
                        <div className="space-y-1">
                          <div className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            {Math.round(
                              (capturedPhotos.length / captureSteps.length) *
                                100
                            )}
                            % Complete
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {captureSteps.length - capturedPhotos.length} photos
                            remaining
                          </div>
                        </div>

                        {/* Progress bar alternative */}
                        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
                            style={{
                              width: `${
                                (capturedPhotos.length / captureSteps.length) *
                                100
                              }%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Steps Overview - Scrollable */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-3 border border-white/20 dark:border-gray-700/50 shadow-2xl flex-1 min-h-0 overflow-y-auto">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Steps
                      </div>

                      <div className="space-y-2">
                        {captureSteps.map((step, index) => {
                          const isCompleted = capturedPhotos.some(
                            (photo) => photo.step.id === step.id
                          );
                          const isCurrent = index === capturedPhotos.length;

                          return (
                            <div
                              key={step.id}
                              className={`relative p-2 rounded-lg transition-all duration-300 border ${
                                isCompleted
                                  ? "bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                  : isCurrent
                                  ? `bg-gradient-to-r ${step.color} bg-opacity-10 border-current border-opacity-30`
                                  : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCompleted
                                      ? "bg-green-500 text-white"
                                      : isCurrent
                                      ? `bg-gradient-to-r ${step.color} text-white animate-pulse`
                                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {isCompleted ? "✓" : step.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`text-xs font-semibold ${
                                      isCompleted
                                        ? "text-green-700 dark:text-green-400"
                                        : isCurrent
                                        ? "text-gray-800 dark:text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                    }`}
                                  >
                                    {step.title}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      isCompleted
                                        ? "text-green-600 dark:text-green-300"
                                        : isCurrent
                                        ? "text-gray-600 dark:text-gray-300"
                                        : "text-gray-400 dark:text-gray-500"
                                    }`}
                                  >
                                    {isCurrent
                                      ? "Active"
                                      : isCompleted
                                      ? "Done"
                                      : "Pending"}
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {isCompleted && (
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  )}
                                  {isCurrent && (
                                    <div
                                      className={`w-1.5 h-1.5 bg-gradient-to-r ${step.color} rounded-full animate-ping`}
                                    ></div>
                                  )}
                                </div>
                              </div>

                              {index < captureSteps.length - 1 && (
                                <div
                                  className={`absolute left-5 top-8 w-0.5 h-2 ${
                                    isCompleted
                                      ? "bg-green-400"
                                      : "bg-gray-300 dark:bg-gray-600"
                                  } transition-colors duration-300`}
                                ></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* Guided Capture Preview */}
          {setupMethod === "guided" && showPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                  <span className="hidden sm:inline">Review Your Photos</span>
                  <span className="sm:hidden">Review</span>
                </h3>
                <button
                  onClick={resetGuidedCapture}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs sm:text-sm"
                >
                  Retake All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`${photo.step.title}`}
                      className="w-full h-20 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => retakePhoto(index)}
                        className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium transition-all duration-200"
                      >
                        Retake
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      <span className="hidden sm:inline">
                        {photo.step.title}
                      </span>
                      <span className="sm:hidden">{index + 1}</span>
                    </div>
                    <div className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400 text-xs sm:text-sm">
                      Perfect! All {captureSteps.length} photos captured
                      successfully
                    </p>
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-300 hidden sm:block">
                      These will be processed with face-api.js for superior
                      recognition accuracy
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Profile Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCreateProfile}
                  disabled={
                    isCreating || capturedPhotos.length < captureSteps.length
                  }
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none flex items-center gap-2 text-sm sm:text-base"
                >
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">
                    {isCreating
                      ? "Creating Enhanced Profile..."
                      : "Create Enhanced Profile"}
                  </span>
                  <span className="sm:hidden">
                    {isCreating ? "Creating..." : "Create Profile"}
                  </span>
                </button>
              </div>
            </div>
          )}
          {/* Manual Upload Flow */}
          {setupMethod === "upload" && (
            <div className="space-y-4">
              {/* Upload Area - Responsive */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 sm:p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <PhotoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 mb-3 sm:mb-4 transition-colors" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2 transition-colors text-center">
                  Upload Your Photos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-3 sm:mb-4 text-xs sm:text-sm px-2">
                  Select 2-5 clear, high-quality photos of yourself
                  <br className="hidden sm:block" />
                  <span className="text-xs">Maximum 10MB per photo</span>
                </p>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium group-hover:scale-105 transition-transform shadow-lg text-sm sm:text-base">
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
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <span className="hidden sm:inline">
                      Selected Photos ({selectedFiles.length}/5)
                    </span>
                    <span className="sm:hidden">
                      Photos ({selectedFiles.length}/5)
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          disabled={isCreating}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Create Profile Button for Upload */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleCreateProfile}
                      disabled={isCreating || selectedFiles.length < 2}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none flex items-center gap-2 text-sm sm:text-base"
                    >
                      <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">
                        {isCreating
                          ? "Creating Enhanced Profile..."
                          : "Create Enhanced Profile"}
                      </span>
                      <span className="sm:hidden">
                        {isCreating ? "Creating..." : "Create Profile"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Enhanced Tips Section */}
          {setupMethod && (
            <div className="mt-6 sm:mt-8 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  📸 Tips for Best Results with face-api.js
                </span>
                <span className="sm:hidden">📸 Tips</span>
              </h3>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1.5 sm:space-y-2">
                {setupMethod === "guided" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Look directly at camera for the front shot - most
                        important
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Gentle head turns only - both eyes should always be
                        visible
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Good lighting is crucial - avoid shadows on your face
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Natural expression - slight smile is perfect</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Upload 2-5 high-quality, well-lit photos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Include different angles but keep face clearly visible
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Avoid sunglasses, masks, or heavy shadows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Photos should be sharp and at least 300x300 pixels
                      </span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2">
                  <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>New:</strong> AI will automatically assess photo
                    quality and optimize recognition
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Camera Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default FaceProfileModal;
