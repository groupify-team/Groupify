import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { createFaceProfile } from "@face-recognition/service/faceRecognitionService";
import { saveFaceProfileToStorage } from "@firebase-services/faceProfiles";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { storage } from "@shared/services/firebase/config";
import MobileStepGuide from "./ui/MobileStepGuide";
import DesktopCameraView from "./ui/DesktopCameraView";
import {
  XMarkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const SmartFaceScan = forwardRef(
  ({ isOpen, onClose, onProfileCreated, onBack, onCameraStream }, ref) => {
    const { currentUser } = useAuth();

    // Core states
    const [currentStep, setCurrentStep] = useState(0);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [stream, setStream] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Mobile-specific states
    const [showMobileGuide, setShowMobileGuide] = useState(false);
    const [mobileGuideAutoOpened, setMobileGuideAutoOpened] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const isCapturingRef = useRef(false);

    // Responsive breakpoint detection
    const [isMobile, setIsMobile] = useState(
      typeof window !== "undefined" ? window.innerWidth < 768 : false
    );

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768); // md breakpoint
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Enhanced capture steps - optimized for better recognition
    const captureSteps = [
      {
        id: "front",
        title: "Face Forward",
        instruction: "Look directly at the camera with a neutral expression",
        detailedTip:
          "Keep your face centered and well-lit. This is the most important photo for accurate recognition.",
        icon: "👤",
        color: "from-emerald-500 to-green-500",
        mobileGuideText:
          "Position your face in the center of the frame and look directly at the camera.",
      },
      {
        id: "slight_right",
        title: "Slight Right Turn",
        instruction: "Turn your head just 15-20° to the right",
        detailedTip:
          "Gentle turn - both eyes should still be clearly visible to the camera.",
        icon: "👤↗️",
        color: "from-blue-500 to-cyan-500",
        mobileGuideText:
          "Turn your head slightly to the right while keeping both eyes visible.",
      },
      {
        id: "slight_left",
        title: "Slight Left Turn",
        instruction: "Turn your head just 15-20° to the left",
        detailedTip:
          "Gentle turn - both eyes should still be clearly visible to the camera.",
        icon: "👤↖️",
        color: "from-purple-500 to-violet-500",
        mobileGuideText:
          "Turn your head slightly to the left while keeping both eyes visible.",
      },
      {
        id: "up_face",
        title: "Face Up",
        instruction: "Tilt your head slightly up (10-15°)",
        detailedTip:
          "Gentle upward tilt - keep eyes looking at camera for best results.",
        icon: "👤⬆️",
        color: "from-orange-500 to-red-500",
        mobileGuideText:
          "Tilt your head slightly upward while maintaining eye contact with camera.",
      },
      {
        id: "down_face",
        title: "Face Down",
        instruction: "Tilt your head slightly down (10-15°)",
        detailedTip:
          "Gentle downward tilt - keep eyes looking at camera for optimal capture.",
        icon: "👤⬇️",
        color: "from-pink-500 to-rose-500",
        mobileGuideText:
          "Tilt your head slightly downward while keeping your eyes on the camera.",
      },
    ];

    // Enhanced camera management with proper cleanup
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

        // Pass stream to parent for tracking
        if (onCameraStream) {
          onCameraStream(mediaStream);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        setError("Could not access camera. Please check permissions.");
        console.error("❌ Camera error:", error);
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }

      // Also clear video ref
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    // Expose cleanup method to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        cleanup: () => {
          stopCamera();
          capturedPhotos.forEach((photo) => {
            if (photo.url) {
              URL.revokeObjectURL(photo.url);
            }
          });
          setCapturedPhotos([]);
          setCurrentStep(0);
          setError("");
          setSuccess(false);
          setProgress(null);
          setShowPreview(false);
          setShowMobileGuide(false);
          setMobileGuideAutoOpened(false);
        },
        stopCamera: stopCamera,
      }),
      [stream, capturedPhotos]
    );

    // Photo capture logic
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

      const stepData = captureSteps[currentStep];

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn("❗️ No image blob captured.");
            return;
          }

          const file = new File(
            [blob],
            `face-${stepData.id}-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            }
          );

          setCapturedPhotos((prev) => {
            const newPhotos = [
              ...prev,
              {
                file,
                step: stepData,
                url: URL.createObjectURL(file),
                stepIndex: currentStep,
              },
            ];

            return newPhotos;
          });

          // Show preview for current photo
          setShowPreview(true);
        },
        "image/jpeg",
        0.9
      );
    };

    // Step navigation
    const handleContinueToNext = () => {
      setShowPreview(false);

      if (currentStep < captureSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);

        // Auto-open mobile guide for next step
        if (isMobile) {
          setShowMobileGuide(true);
          setMobileGuideAutoOpened(true);
        }
      } else {
        // All steps completed
        handleCreateProfile();
      }
    };

    const handleRetakePhoto = () => {
      // Remove current step photo
      setCapturedPhotos((prev) =>
        prev.filter((photo) => photo.stepIndex !== currentStep)
      );
      setShowPreview(false);

      // Stay on current step for retake
    };

    const resetCapture = () => {
      setCapturedPhotos([]);
      setCurrentStep(0);
      setShowPreview(false);
      setShowMobileGuide(true);
      setMobileGuideAutoOpened(false);
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

    // Create face profile
    const handleCreateProfile = async () => {
      const photos = capturedPhotos.map((cp) => cp.file);

      if (photos.length < captureSteps.length) {
        setError("Please complete all capture steps");
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
            filename: photos[index].name,
            captureMethod: "guided",
          })),
          createdAt: new Date().toISOString(),
          method: "guided",
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

    // Enhanced cleanup function
    const handleClose = () => {
      // Clean up blob URLs
      capturedPhotos.forEach((photo) => {
        if (photo.url) {
          URL.revokeObjectURL(photo.url);
        }
      });
      setCapturedPhotos([]);
      setCurrentStep(0);
      setError("");
      setSuccess(false);
      setProgress(null);
      setShowPreview(false);
      setShowMobileGuide(false);
      setMobileGuideAutoOpened(false);

      // Let parent handle camera cleanup
      onClose();
    };

    // Enhanced back handler
    const handleBack = () => {
      stopCamera();
      capturedPhotos.forEach((photo) => {
        if (photo.url) {
          URL.revokeObjectURL(photo.url);
        }
      });
      setCapturedPhotos([]);
      setCurrentStep(0);
      setError("");
      setSuccess(false);
      setProgress(null);
      setShowPreview(false);
      setShowMobileGuide(false);
      setMobileGuideAutoOpened(false);
      onBack();
    };

    // Initialize camera
    useEffect(() => {
      if (isOpen) {
        startCamera();
      }
      return () => {
        stopCamera();
      };
    }, [isOpen]);

    // Auto-open mobile guide on step change
    useEffect(() => {
      if (isMobile && currentStep > 0 && !mobileGuideAutoOpened) {
        setShowMobileGuide(true);
        setMobileGuideAutoOpened(true);
      }
    }, [currentStep, isMobile]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopCamera();
        capturedPhotos.forEach((photo) => {
          if (photo.url) {
            URL.revokeObjectURL(photo.url);
          }
        });
      };
    }, []);

    // Stop camera when component unmounts or modal closes
    useEffect(() => {
      if (!isOpen) {
        stopCamera();
      }
    }, [isOpen]);

    if (!isOpen) return null;

    // Mobile Navigation Bar (only for mobile)
    const MobileNavBar = () => (
      <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-600" />
            Smart Face Scan
          </h2>
        </div>

        <button
          onClick={handleClose}
          disabled={isCreating}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
        <div className="h-full bg-white dark:bg-gray-900 md:bg-white/90 md:dark:bg-gray-800/90 md:backdrop-blur-lg md:m-2 md:rounded-2xl md:shadow-2xl md:border md:border-white/20 md:dark:border-gray-700/50 flex flex-col overflow-hidden">
          {/* Mobile Navigation */}
          <MobileNavBar />

          {/* Desktop Header (hidden on mobile) */}
          <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-indigo-600" />
                Smart Face Scan Setup
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI-powered face recognition using face-api.js
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
                <SparklesIcon className="w-3 h-3 text-indigo-500" />
                <span>
                  {currentStep + 1}/{captureSteps.length}
                </span>
              </div>
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Error/Success/Progress Display */}
          {(error || success || progress) && (
            <div className="p-4 flex-shrink-0">
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-50/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-400">
                      Enhanced face profile created successfully!
                    </p>
                  </div>
                </div>
              )}
              {progress && (
                <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {progress.phase}
                    </p>
                  </div>
                  {progress.current && progress.total && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (progress.current / progress.total) * 100
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {isMobile ? (
              <MobileStepGuide
                currentStep={currentStep}
                captureSteps={captureSteps}
                capturedPhotos={capturedPhotos}
                isCapturing={isCapturing}
                countdown={countdown}
                showPreview={showPreview}
                showMobileGuide={showMobileGuide}
                setShowMobileGuide={setShowMobileGuide}
                videoRef={videoRef}
                onCapture={capturePhotoWithCountdown}
                onContinue={handleContinueToNext}
                onRetake={handleRetakePhoto}
                onReset={resetCapture}
                isCreating={isCreating}
                progress={progress}
              />
            ) : (
              <DesktopCameraView
                currentStep={currentStep}
                captureSteps={captureSteps}
                capturedPhotos={capturedPhotos}
                isCapturing={isCapturing}
                countdown={countdown}
                showPreview={showPreview}
                videoRef={videoRef}
                onCapture={capturePhotoWithCountdown}
                onContinue={handleContinueToNext}
                onRetake={handleRetakePhoto}
                onReset={resetCapture}
              />
            )}
          </div>

          {/* Hidden Canvas for Photo Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }
);

SmartFaceScan.displayName = "SmartFaceScan";

export default SmartFaceScan;
