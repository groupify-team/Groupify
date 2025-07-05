// src/dashboard-area/features/settings/components/sections/FaceProfileSection.jsx
import React from "react";
import FaceProfileCard from "../widgets/FaceProfileCard";

const FaceProfileSection = ({
  hasProfile,
  profilePhotos,
  isLoadingProfile,
  faceRecognitionEnabled,
  onOpenSetup,
  onOpenManage,
  toggleSetting,
  settingsLoading,
}) => {
  if (faceRecognitionEnabled) {
    return (
      <FaceProfileCard
        hasProfile={hasProfile}
        profilePhotos={profilePhotos}
        isLoading={isLoadingProfile}
        onOpenSetup={onOpenSetup}
        onOpenManage={onOpenManage}
      />
    );
  }

  // Face Recognition Disabled State
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Face Recognition Disabled
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Enable face recognition in Privacy Settings to set up your face
          profile and get tagged in photos.
        </p>
        <button
          onClick={() => {
            // Toggle the face recognition setting to enabled
            toggleSetting("privacy", "faceRecognition");

            // Optional: Still scroll to privacy settings to show the change
            setTimeout(() => {
              const privacySection = document.querySelector(
                '[data-section="privacy"]'
              );
              if (privacySection) {
                privacySection.scrollIntoView({ behavior: "smooth" });
              }
            }, 100); // Small delay to allow state update
          }}
          disabled={settingsLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
        >
          {settingsLoading ? "Enabling..." : "Enable Face Recognition"}
        </button>
      </div>
    </div>
  );
};

export default FaceProfileSection;