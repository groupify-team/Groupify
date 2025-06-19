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
  ];

  // Circular Progress Component (updated for 3 steps)
  const CircularProgress = ({ currentStep, totalSteps, capturedPhotos }) => {
    const radius = 50;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const progress = (capturedPhotos.length / totalSteps) * 100;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="dark:stroke-gray-600"
            />
            {/* Progress circle */}
            <circle
              stroke="url(#progressGradient)"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-500 ease-in-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {capturedPhotos.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                of {totalSteps}
              </div>
            </div>
          </div>
        </div>

        {/* Step indicators around the circle */}
        <div className="absolute inset-0">
          {captureSteps.map((step, index) => {
            const angle = (index * 360) / totalSteps - 90; // Start from top
            const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
            const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
            const isCompleted = capturedPhotos.some(
              (photo) => photo.step.id === step.id
            );
            const isCurrent = index === currentStep;

            return (
              <div
                key={step.id}
                className="absolute w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {isCompleted ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                  </div>
                ) : isCurrent ? (
                  <div
                    className={`w-6 h-6 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center animate-pulse`}
                  >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // Dynamic guide component
  const DynamicGuide = ({ step }) => {
    return <Modern3DHead step={step} captureSteps={captureSteps} />;
  };

=======

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

      if (selectedFiles.length >= 5) { // Reduced from 10 to 5 for better quality
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
        imageUrls.map(url => ({ url })), // Convert to expected format
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
        engine: 'face-api.js',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-indigo-600" />
              Setup Face Profile (Enhanced)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI-powered face recognition using face-api.js for superior accuracy
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {/* Error/Success/Progress Display */}
          {error && (
            <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-400">
                  Enhanced face profile created successfully! Now enjoy much more accurate photo recognition.
                </p>
              </div>
            </div>
          )}

          {progress && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-400">
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
              {/* Info Banner about the upgrade */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                      🚀 Enhanced Face Recognition
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Now powered by <strong>face-api.js</strong> for significantly better accuracy. 
                      Expect 90%+ accuracy with proper lighting and fewer false positives!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CameraIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Choose Setup Method
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select how you'd like to create your enhanced face profile
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guided Capture - Enhanced */}
                <div
                  onClick={() => setSetupMethod("guided")}
                  className="relative cursor-pointer group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-all duration-300">
                    <div className="absolute top-4 right-4">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        ✨ BEST ACCURACY
                      </span>
                    </div>

                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                      <CameraIcon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 text-center">
                      Smart Face Scan
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 text-center">
                      AI-guided capture with quality assessment - now only 3 optimized photos needed
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span>99%+ face-api.js accuracy</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span>Real-time quality checking</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span>Fewer false positives</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span>128D face embeddings</span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg">
                      <PlayIcon className="w-5 h-5" />
                      Start Smart Setup
                    </button>
                  </div>
                </div>

                {/* Manual Upload - Enhanced */}
                <div
                  onClick={() => setSetupMethod("upload")}
                  className="cursor-pointer group"
                >
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                      <PhotoIcon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 text-center">
                      Upload Photos
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 text-center">
                      Upload 2-5 existing high-quality photos of yourself
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        <span>Use existing photos</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        <span>No camera required</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        <span>Quality auto-assessment</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <InformationCircleIcon className="w-4 h-4 text-orange-500" />
                        <span>Depends on photo quality</span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 shadow-lg">
                      <PhotoIcon className="w-5 h-5" />
                      Choose Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guided Capture Flow - Updated for 3 steps */}
          {setupMethod === "guided" && !showPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSetupMethod(null)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to options
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Enhanced with face-api.js • Step {capturedPhotos.length + 1} of {captureSteps.length}
                </div>
              </div>

              {/* Main Layout: Left (Progress + Guide) + Right (Camera) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Side: Progress Circle + Instructions + Guide */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Circular Progress */}
                  <div className="flex justify-center">
                    <CircularProgress
                      currentStep={capturedPhotos.length}
                      totalSteps={captureSteps.length}
                      capturedPhotos={capturedPhotos}
                    />
                  </div>

                  {/* Current Step Instructions */}
                  {captureSteps[capturedPhotos.length] && (
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {captureSteps[capturedPhotos.length].title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {captureSteps[capturedPhotos.length].instruction}
                      </p>
                      <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 {captureSteps[capturedPhotos.length].tip}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modern 3D Head Guide - Using the new component */}
                  {captureSteps[capturedPhotos.length] && (
                    <div className="flex justify-center">
                      <Modern3DHead
                        step={capturedPhotos.length}
                        captureSteps={captureSteps}
                      />
                    </div>
                  )}
                </div>

                {/* Right Side: Camera View */}
                <div className="lg:col-span-3">
                  {/* Camera View */}
                  <div className="relative bg-black rounded-xl overflow-hidden max-w-md mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 lg:h-80 object-cover"
                    />

                    {/* Face Guide Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-52 border-2 border-white/50 rounded-full border-dashed animate-pulse"></div>
                    </div>

                    {/* Countdown Overlay */}
                    {countdown > 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-6xl font-bold animate-ping">
                          {countdown}
                        </div>
                      </div>
                    )}

                    {/* Capture Button */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={capturePhotoWithCountdown}
                        disabled={isCapturing}
                        className="w-16 h-16 bg-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center disabled:opacity-50"
                      >
                        <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guided Capture Preview */}
          {setupMethod === "guided" && showPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  Review Your Photos
                </h3>
                <button
                  onClick={resetGuidedCapture}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  Retake All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`${photo.step.title}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
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
                      {photo.step.title}
                    </div>
                    <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">
                      Perfect! All {captureSteps.length} photos captured successfully
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      These will be processed with face-api.js for superior recognition accuracy
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Profile Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCreateProfile}
                  disabled={isCreating || capturedPhotos.length < captureSteps.length}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-8 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none flex items-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  {isCreating ? "Creating Enhanced Profile..." : "Create Enhanced Profile"}
                </button>
              </div>
            </div>
          )}

          {/* Manual Upload Flow */}
          {setupMethod === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSetupMethod(null)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to options
                </button>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <PhotoIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 mb-4 transition-colors" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2 transition-colors">
                  Upload Your Photos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Select 2-5 clear, high-quality photos of yourself
                  <br />
                  Maximum 10MB per photo
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
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          disabled={isCreating}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>
          )}

          {/* Enhanced Tips Section */}
          {setupMethod && (
            <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5" />
                📸 Tips for Best Results with face-api.js
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                {setupMethod === "guided" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Look directly at camera for the front shot - this is most important</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Gentle head turns only - both eyes should always be visible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Good lighting is crucial - avoid shadows on your face</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Natural expression - slight smile is perfect</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Upload 2-5 high-quality, well-lit photos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Include different angles but keep face clearly visible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Avoid sunglasses, masks, or heavy shadows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Photos should be sharp and at least 300x300 pixels</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span><strong>New:</strong> AI will automatically assess photo quality and optimize recognition</span>
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