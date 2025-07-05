import React from "react";
import Modern3DHead from "./Modern3DHead";
import {
  CheckCircleIcon,
  CameraIcon,
  SparklesIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const DesktopCameraView = ({
  currentStep,
  captureSteps,
  capturedPhotos,
  isCapturing,
  countdown,
  showPreview,
  videoRef,
  onCapture,
  onContinue,
  onRetake,
  onReset,
}) => {
  const currentStepData = captureSteps[currentStep];
  const currentPhoto = capturedPhotos.find(
    (photo) => photo.stepIndex === currentStep
  );
  const totalSteps = captureSteps.length;
  const progressPercentage = (capturedPhotos.length / totalSteps) * 100;

  // Photo Preview Modal for Desktop
  const PhotoPreviewModal = () => {
    if (!showPreview || !currentPhoto) return null;

    return (
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 dark:border-gray-700/50">
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircleIcon className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Perfect Capture!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Step {currentStep + 1} of {totalSteps} completed successfully
            </p>

            {/* Photo Preview */}
            <div className="relative mb-8">
              <img
                src={currentPhoto.url}
                alt={`Step ${currentStep + 1}`}
                className="w-40 h-40 object-cover rounded-2xl mx-auto border-4 border-white shadow-xl"
              />
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                >
                  <span>Continue to Next Step</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Complete Setup</span>
                </button>
              )}

              <button
                onClick={onRetake}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-medium transition-all duration-300"
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
    <div className="flex h-full">
      {/* Left Sidebar - Guide & Instructions */}
      <div className="w-80 xl:w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col">
        {/* 3D Avatar Guide */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center">
            <div className="scale-90 xl:scale-100">
              <Modern3DHead step={currentStep} captureSteps={captureSteps} />
            </div>
          </div>
        </div>

        {/* Current Step Instructions */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Step Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-3 h-3 bg-gradient-to-r ${currentStepData.color} rounded-full animate-pulse`}
                ></div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {currentStepData.title}
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {currentStepData.instruction}
              </p>

              {/* Detailed Tip */}
              <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-lg flex-shrink-0">
                    💡
                  </span>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {currentStepData.detailedTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-3 h-3 text-white" />
                </div>
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                  Pro Tips
                </div>
              </div>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                {[
                  "Keep face centered in frame",
                  "Ensure even lighting",
                  "Look directly at camera",
                  "Stay still during countdown",
                  "Natural expression works best",
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Indicators */}
            <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-sm font-semibold text-green-800 dark:text-green-400">
                  Quality Check
                </div>
              </div>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                {[
                  "Face detection: Active",
                  "Lighting: Optimal",
                  "Focus: Sharp",
                  "Position: Centered",
                ].map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span>{check.split(":")[0]}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {check.split(":")[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Camera */}
      <div className="flex-1 flex flex-col">
        {/* Camera Container */}
        <div className="flex-1 relative bg-black">
          {/* Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Enhanced Face Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Sophisticated blur effect with circular cutout */}
            <div
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              style={{
                maskImage:
                  "radial-gradient(circle at center, transparent 140px, black 170px)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 140px, black 170px)",
              }}
            ></div>

            {/* Advanced face guide with multiple rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Main guide circle */}
                <div className="w-80 h-96 border-4 border-green-400/90 rounded-full border-dashed animate-pulse shadow-2xl shadow-green-400/40"></div>

                {/* Inner guidance circle */}
                <div className="absolute inset-6 border-2 border-white/70 rounded-full border-dotted animate-pulse"></div>

                {/* Ultra-precise center guides */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-20 bg-green-400/60 rounded-full"></div>
                  <div className="absolute w-20 h-2 bg-green-400/60 rounded-full"></div>
                  <div className="w-6 h-6 bg-green-400 rounded-full animate-ping border-4 border-white/50 shadow-lg"></div>
                </div>

                {/* Corner alignment markers */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-8 h-8 border-3 border-green-400/70 animate-pulse"
                    style={{
                      top: i < 4 ? "10%" : "90%",
                      left: `${15 + (i % 4) * 23.33}%`,
                      borderRadius: i % 2 === 0 ? "50% 0" : "0 50%",
                      transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status Overlays */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            {/* Current Step Badge */}
            <div
              className={`bg-gradient-to-r ${currentStepData.color} px-4 py-2 rounded-full text-white font-medium shadow-lg backdrop-blur-sm bg-opacity-90 flex items-center gap-3`}
            >
              <span className="text-lg">{currentStepData.icon}</span>
              <span className="text-lg">{currentStepData.title}</span>
            </div>

            {/* Advanced Quality Indicator */}
            <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold flex items-center gap-3 shadow-lg border border-white/20">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"></div>
              <span>FOCUS ACTIVE</span>
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Enhanced Countdown */}
          {countdown > 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-40">
              <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="text-white text-8xl font-bold animate-ping">
                      {countdown}
                    </div>
                    <div className="absolute inset-0 text-white/40 text-8xl font-bold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                  <div className="text-white/90 text-xl font-medium animate-pulse">
                    Get Ready for Perfect Shot...
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping mx-1"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-ping mx-1"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-ping mx-1"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Scanning Animation */}
          {isCapturing && (
            <div className="absolute inset-0 pointer-events-none z-30">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/15 to-transparent animate-pulse">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse shadow-lg shadow-blue-400/50"></div>
              </div>

              {/* Additional scanning effects */}
              <div className="absolute inset-0 border-2 border-blue-400/30 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
              </div>
            </div>
          )}

          {/* Enhanced Capture Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8">
            <div className="flex items-center justify-between">
              {/* Progress Indicator */}
              <div className="text-white/90">
                <div className="text-lg font-semibold mb-1">
                  Step {currentStep + 1} of {totalSteps}
                </div>
                <div className="text-white/70 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <span>{capturedPhotos.length} photos captured</span>
                </div>
              </div>

              {/* Professional Capture Button */}
              <div className="relative">
                <button
                  onClick={onCapture}
                  disabled={isCapturing}
                  className="relative group"
                >
                  {/* Multi-layer glow effect */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>

                  {/* Main button structure */}
                  <div className="relative w-24 h-24 border-4 border-white/70 rounded-full flex items-center justify-center group-hover:border-white/90 transition-all duration-300 group-active:scale-95 backdrop-blur-sm shadow-2xl">
                    <div className="w-20 h-20 bg-white rounded-full shadow-2xl group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                      {isCapturing ? (
                        <div className="w-10 h-10 bg-red-500 rounded-sm animate-pulse shadow-lg"></div>
                      ) : (
                        <div className="w-16 h-16 bg-red-500 rounded-full group-hover:bg-white transition-all duration-300 group-hover:scale-75 shadow-lg"></div>
                      )}
                    </div>
                  </div>

                  {/* Animated pulse rings */}
                  {!isCapturing && (
                    <>
                      <div className="absolute inset-0 w-24 h-24 border-2 border-white/20 rounded-full animate-ping"></div>
                      <div
                        className="absolute inset-2 w-20 h-20 border border-white/10 rounded-full animate-ping"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                    </>
                  )}
                </button>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={onReset}
                  disabled={isCapturing}
                  className="text-white/80 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-white/20 font-medium"
                >
                  Reset All
                </button>
                <div className="text-center">
                  <div className="text-white/60 text-xs">
                    Progress: {Math.round(progressPercentage)}%
                  </div>
                  <div className="w-16 bg-white/20 rounded-full h-1 mt-1">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Progress & Overview */}
      <div className="w-80 xl:w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 flex flex-col">
        {/* Circular Progress */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse"></div>
              Progress Overview
            </div>

            {/* Enhanced Circular Progress */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Multiple glow layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-xl"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full blur-lg"></div>

              <svg className="transform -rotate-90 w-full h-full relative z-10">
                {/* Background track */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="35%"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700 drop-shadow-sm"
                />

                {/* Progress circle with enhanced styling */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="35%"
                  stroke="url(#enhancedProgressGradient)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 35 * (1 - progressPercentage / 100)
                  }`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-lg"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))",
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

              {/* Center content with enhanced animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                    {capturedPhotos.length}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                    /{totalSteps}
                  </div>
                </div>
              </div>

              {/* Completion sparkles */}
              {capturedPhotos.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(capturedPhotos.length)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        left: `${
                          50 + 35 * Math.cos((i * 2 * Math.PI) / totalSteps)
                        }%`,
                        top: `${
                          50 + 35 * Math.sin((i * 2 * Math.PI) / totalSteps)
                        }%`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced progress text */}
            <div className="space-y-2">
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round(progressPercentage)}% Complete
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalSteps - capturedPhotos.length} steps remaining
              </div>
            </div>

            {/* Enhanced progress bar */}
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Overview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <CameraIcon className="w-4 h-4" />
            Capture Steps
          </div>

          <div className="space-y-4">
            {captureSteps.map((step, index) => {
              const isCompleted = capturedPhotos.some(
                (photo) => photo.stepIndex === index
              );
              const isCurrent = index === currentStep;
              const isNext = index === currentStep + 1;

              return (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-xl transition-all duration-500 border-2 ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg shadow-green-500/10"
                      : isCurrent
                      ? `bg-gradient-to-r ${step.color} bg-opacity-10 border-current border-opacity-50 shadow-lg animate-pulse`
                      : isNext
                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-lg ${
                        isCompleted
                          ? "bg-green-500 text-white shadow-green-500/30"
                          : isCurrent
                          ? `bg-gradient-to-r ${step.color} text-white animate-pulse shadow-lg`
                          : isNext
                          ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : (
                        <span className="text-lg">{step.icon}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold transition-colors duration-300 ${
                          isCompleted
                            ? "text-green-700 dark:text-green-400"
                            : isCurrent
                            ? "text-gray-800 dark:text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div
                        className={`text-sm transition-colors duration-300 ${
                          isCompleted
                            ? "text-green-600 dark:text-green-300"
                            : isCurrent
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        {isCompleted
                          ? "✓ Completed"
                          : isCurrent
                          ? "In Progress..."
                          : isNext
                          ? "Up Next"
                          : "Pending"}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isCompleted && (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      )}
                      {isCurrent && (
                        <div
                          className={`w-3 h-3 bg-gradient-to-r ${step.color} rounded-full animate-ping shadow-lg`}
                        ></div>
                      )}
                      {isNext && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Connection line to next step */}
                  {index < captureSteps.length - 1 && (
                    <div
                      className={`absolute left-9 top-16 w-0.5 h-4 transition-colors duration-500 ${
                        isCompleted
                          ? "bg-green-400"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    ></div>
                  )}

                  {/* Captured photo thumbnail */}
                  {isCompleted &&
                    capturedPhotos.find(
                      (photo) => photo.stepIndex === index
                    ) && (
                      <div className="mt-3 flex items-center justify-between">
                        <img
                          src={
                            capturedPhotos.find(
                              (photo) => photo.stepIndex === index
                            ).url
                          }
                          alt={`Step ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-green-200 dark:border-green-700 shadow-lg"
                        />
                        <button
                          onClick={() => onRetake()}
                          className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <TrashIcon className="w-3 h-3" />
                          Retake
                        </button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {/* Completion Summary */}
          {capturedPhotos.length === totalSteps && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div className="text-lg font-bold text-green-800 dark:text-green-400">
                  All Steps Complete!
                </div>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Perfect! All {totalSteps} photos captured successfully. Ready to
                create your enhanced face profile.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {capturedPhotos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Captured ${index + 1}`}
                    className="w-full h-12 object-cover rounded-lg border border-green-200 dark:border-green-700 shadow-sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal />
    </div>
  );
};

export default DesktopCameraView;