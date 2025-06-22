import React, { useState, useEffect } from "react";
import Modern3DHead from "./Modern3DHead";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const MobileStepGuide = ({
  currentStep,
  captureSteps,
  capturedPhotos,
  isCapturing,
  countdown,
  showPreview,
  showMobileGuide,
  setShowMobileGuide,
  videoRef,
  onCapture,
  onContinue,
  onRetake,
  onReset,
}) => {
  const [showInitialGuide, setShowInitialGuide] = useState(true);
  const [guideAnimation, setGuideAnimation] = useState("");

  const currentStepData = captureSteps[currentStep];
  const currentPhoto = capturedPhotos.find(
    (photo) => photo.stepIndex === currentStep
  );
  const totalSteps = captureSteps.length;
  const progressPercentage =
    ((currentStep + (currentPhoto ? 1 : 0)) / totalSteps) * 100;

  // Handle guide toggle with animation
  const toggleMobileGuide = () => {
    if (showMobileGuide) {
      setGuideAnimation("closing");
      setTimeout(() => {
        setShowMobileGuide(false);
        setGuideAnimation("");
      }, 300);
    } else {
      setShowMobileGuide(true);
      setGuideAnimation("opening");
      setTimeout(() => setGuideAnimation(""), 300);
    }
  };

  // Initial welcome guide
  const InitialGuide = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/20 dark:border-gray-700/50">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Smart Face Scan Ready!
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
            We'll guide you through <strong>5 simple steps</strong> to create
            your enhanced face profile. Look for the{" "}
            <strong className="text-blue-600">ⓘ button</strong> for tips during
            each step.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              "🎯 Step-by-step guidance",
              "⚡ Real-time quality check",
              "🔄 Retake option anytime",
              "📱 Mobile-optimized experience",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button
            onClick={() => setShowInitialGuide(false)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Let's Start!</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Guide Overlay
  const MobileGuideOverlay = () => {
    if (!showMobileGuide) return null;

    return (
      <div
        className={`absolute inset-0 z-40 pointer-events-none ${
          guideAnimation === "closing"
            ? "animate-fade-out"
            : guideAnimation === "opening"
            ? "animate-fade-in"
            : ""
        }`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <div className="absolute inset-x-4 top-4 pointer-events-auto">
          <div className="bg-blue-50/95 dark:bg-blue-900/95 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 bg-gradient-to-r ${currentStepData.color} rounded-full animate-pulse`}
                ></div>
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {currentStepData.title}
                </h3>
              </div>
              <button
                onClick={toggleMobileGuide}
                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              </button>
            </div>

            {/* 3D Avatar Guide */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 scale-75">
                <Modern3DHead step={currentStep} captureSteps={captureSteps} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-3 leading-relaxed">
                  {currentStepData.mobileGuideText}
                </p>
                <div className="bg-blue-100/80 dark:bg-blue-800/30 border border-blue-200/50 dark:border-blue-700/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 text-sm flex-shrink-0">
                      💡
                    </span>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      {currentStepData.detailedTip}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-100/60 dark:bg-blue-800/20 border border-blue-200/50 dark:border-blue-700/50 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                Quick Tips
              </div>
              <div className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                {[
                  "Keep face centered in frame",
                  "Ensure good lighting",
                  "Look directly at camera",
                  "Stay still during capture",
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={toggleMobileGuide}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Got it, Continue</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Photo Preview Modal
  const PhotoPreviewModal = () => {
    if (!showPreview || !currentPhoto) return null;

    return (
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/20 dark:border-gray-700/50">
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Photo Captured!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Step {currentStep + 1} of {totalSteps} completed
            </p>

            {/* Photo Preview */}
            <div className="relative mb-6">
              <img
                src={currentPhoto.url}
                alt={`Step ${currentStep + 1}`}
                className="w-32 h-32 object-cover rounded-2xl mx-auto border-4 border-white shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Continue to Next Step</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Complete Setup</span>
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onRetake}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-xl font-medium transition-all duration-300"
              >
                Retake Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Initial Welcome Guide */}
      {showInitialGuide && <InitialGuide />}

      {/* Dynamic Progress Bar */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {Math.round(progressPercentage)}%
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="absolute -top-1 left-0 right-0 flex justify-between">
            {captureSteps.map((step, index) => {
              const isCompleted = capturedPhotos.some(
                (photo) => photo.stepIndex === index
              );
              const isCurrent = index === currentStep;
              const isNext = index === currentStep + 1;

              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-500 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/30"
                        : isCurrent
                        ? `bg-gradient-to-r ${step.color} border-white shadow-lg animate-pulse`
                        : isNext
                        ? "bg-white border-blue-400 shadow-md"
                        : "bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600"
                    } flex items-center justify-center`}
                  >
                    {isCompleted && (
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    )}
                    {isCurrent && (
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-1 font-medium ${
                      isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : isCurrent
                        ? "text-gray-800 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Camera Section */}
      <div className="flex-1 relative bg-black">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Info Button (Top Left) */}
        <button
          onClick={toggleMobileGuide}
          className="absolute top-4 left-4 z-30 w-10 h-10 bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 transition-all duration-300"
        >
          <InformationCircleIcon className="w-5 h-5 text-white" />
        </button>

        {/* Current Step Badge (Top Right) */}
        <div className="absolute top-4 right-4 z-30">
          <div
            className={`bg-gradient-to-r ${currentStepData.color} px-3 py-1.5 rounded-full text-white text-sm font-medium shadow-lg backdrop-blur-sm bg-opacity-90 flex items-center gap-2`}
          >
            <span>{currentStepData.icon}</span>
            <span className="hidden sm:inline">{currentStepData.title}</span>
          </div>
        </div>

        {/* Face Guide Overlay */}
        {!showMobileGuide && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Focus area with blur effect */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              style={{
                maskImage:
                  "radial-gradient(circle at center, transparent 100px, black 120px)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 100px, black 120px)",
              }}
            ></div>

            {/* Face guide circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-60 border-3 border-green-400/90 rounded-full border-dashed animate-pulse shadow-xl shadow-green-400/30"></div>
                <div className="absolute inset-4 border-2 border-white/70 rounded-full border-dotted animate-pulse"></div>

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-12 bg-green-400/50 rounded-full"></div>
                  <div className="absolute w-12 h-1 bg-green-400/50 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-ping border-2 border-white/50"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <div className="text-white text-5xl font-bold animate-ping mb-2">
                  {countdown}
                </div>
                <div className="text-white/90 text-sm font-medium animate-pulse">
                  Get Ready...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Animation */}
        {isCapturing && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-pulse">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Capture Button (Bottom Center) */}
        {!showMobileGuide && !showPreview && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
            <button
              onClick={onCapture}
              disabled={isCapturing}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

              {/* Main button */}
              <div className="relative w-20 h-20 border-3 border-white/60 rounded-full flex items-center justify-center group-hover:border-white/90 transition-all duration-300 group-active:scale-95 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white rounded-full shadow-2xl group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                  {isCapturing ? (
                    <div className="w-8 h-8 bg-red-500 rounded-sm animate-pulse"></div>
                  ) : (
                    <div className="w-12 h-12 bg-red-500 rounded-full group-hover:bg-white transition-all duration-300 group-hover:scale-75"></div>
                  )}
                </div>
              </div>

              {/* Pulse ring */}
              {!isCapturing && (
                <div className="absolute inset-0 w-20 h-20 border-2 border-white/20 rounded-full animate-ping"></div>
              )}
            </button>
          </div>
        )}

        {/* Mobile Guide Overlay */}
        <MobileGuideOverlay />

        {/* Photo Preview Modal */}
        <PhotoPreviewModal />
      </div>
    </div>
  );
};

export default MobileStepGuide;
