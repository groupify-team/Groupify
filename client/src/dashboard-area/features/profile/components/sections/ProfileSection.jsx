import React, { useState } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useSettings } from "@dashboard/features/settings/hooks/useSettings";

import AccountSection from "@dashboard/features/settings/components/sections/AccountSection";
import FaceProfileSection from "@dashboard/features/settings/components/sections/FaceProfileSection";
import Modal from "@shared/components/ui/Modal";

// Import modals
import {
  EditProfileModal,
  FaceProfileModal,
  FaceProfileManageModal,
} from "@dashboard/features/settings/components/modals";

import { SETTINGS_MODAL_TYPES } from "@dashboard/features/settings/constants/settingsConstants";
import { UserCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";

const ProfileSection = () => {
  const { currentUser } = useAuth();
  const { settings, toggleSetting, loading: settingsLoading } = useSettings();
  const [activeModal, setActiveModal] = useState(null);

  const {
    userData,
    hasProfile,
    profilePhotos,
    isLoadingProfile,
    loadFaceProfile,
    loadDashboardData: refreshData,
  } = useDashboardData();

  const faceRecognitionEnabled = settings.privacy?.faceRecognition ?? false;
  const closeModal = () => setActiveModal(null);

  const openModal = (modalType) => setActiveModal(modalType);

  const handleOpenFaceProfileModal = () => {
    if (!faceRecognitionEnabled) {
      alert("Please enable Face Recognition in Privacy Settings first.");
      return;
    }
    openModal(SETTINGS_MODAL_TYPES.FACE_PROFILE);
  };

  const handleOpenFaceProfileManageModal = () => {
    if (!faceRecognitionEnabled) {
      alert("Please enable Face Recognition in Privacy Settings first.");
      return;
    }
    openModal(SETTINGS_MODAL_TYPES.FACE_PROFILE_MANAGE);
  };

  const handleFaceProfileCreated = async (success) => {
    if (success) {
      closeModal();
      try {
        if (loadFaceProfile) loadFaceProfile();
        if (refreshData) await refreshData();
      } catch (error) {
        console.error("❌ Error refreshing data:", error);
      }
    }
  };

  const handleFaceProfileUpdated = async () => {
    try {
      if (loadFaceProfile) loadFaceProfile();
      if (refreshData) await refreshData();
    } catch (error) {
      console.error("❌ Error refreshing data after profile update:", error);
    }
  };

  const handleProfileEditComplete = async () => {
    try {
      if (refreshData) await refreshData();
    } catch (error) {
      console.error("❌ Error refreshing data after profile edit:", error);
    }
  };

  const accountSectionProps = {
    userData,
    currentUser,
    settings,
    toggleSetting,
    settingsLoading,
    onOpenEditProfile: () => openModal(SETTINGS_MODAL_TYPES.EDIT_PROFILE),
  };

  const faceProfileSectionProps = {
    hasProfile,
    profilePhotos,
    isLoadingProfile,
    faceRecognitionEnabled,
    onOpenSetup: handleOpenFaceProfileModal,
    onOpenManage: handleOpenFaceProfileManageModal,
    toggleSetting,
    settingsLoading,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute top-0 right-0">
              <button
                onClick={() => openModal(SETTINGS_MODAL_TYPES.EDIT_PROFILE)}
                className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl"
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>

            {/* Title Section */}
            <div className="flex items-center gap-3 sm:gap-4 pr-20 sm:pr-32">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <UserCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                  <span className="inline sm:hidden">
                    Manage your account & face profile
                  </span>
                  <span className="hidden sm:inline">
                    Manage your account information and face recognition profile
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content - Using Events-like spacing */}
        <div className="space-y-6 sm:space-y-8">
          <AccountSection {...accountSectionProps} />
          <FaceProfileSection {...faceProfileSectionProps} />
        </div>
      </div>

      {/* Modals */}
      {activeModal === SETTINGS_MODAL_TYPES.EDIT_PROFILE && (
        <EditProfileModal
          isOpen={true}
          onClose={() => {
            closeModal();
            handleProfileEditComplete();
          }}
        />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.FACE_PROFILE && (
        <FaceProfileModal
          isOpen={true}
          onClose={closeModal}
          onProfileCreated={handleFaceProfileCreated}
        />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.FACE_PROFILE_MANAGE && (
        <FaceProfileManageModal
          isOpen={true}
          onClose={closeModal}
          onProfileUpdated={handleFaceProfileUpdated}
        />
      )}
    </div>
  );
};

export default ProfileSection;
