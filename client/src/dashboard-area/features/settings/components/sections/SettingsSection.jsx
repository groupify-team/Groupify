// src/dashboard-area/features/settings/components/sections/SettingsSection.jsx
import React, { useState } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useSettings, useExportBackup } from "../../hooks";

// Import section components
import AccountSection from "./AccountSection";
import FaceProfileSection from "./FaceProfileSection";
import SubscriptionSection from "./SubscriptionSection";
import DataSection from "./DataSection";

// Import modals from consolidated location
import {
  EditProfileModal,
  FaceProfileModal,
  FaceProfileManageModal,
  DeleteAccountModal,
  UsageModal,
  BillingHistoryModal,
  PlanManagementModal,
  ExportModal,
  BackupModal,
} from "../modals";

import { SETTINGS_MODAL_TYPES } from "../../constants/settingsConstants";

const SettingsSection = () => {
  const { currentUser } = useAuth();
  const { settings, toggleSetting, loading: settingsLoading } = useSettings();
  const {
    loading: exportLoading,
    error: exportError,
    success: exportSuccess,
    exportData,
    createBackup,
    exportCSV,
  } = useExportBackup();

  // Consolidated modal state using the constants
  const [activeModal, setActiveModal] = useState(null);

  const {
    layout: { isMobile },
  } = useDashboardLayout();

  const {
    userData,
    trips,
    friends,
    hasProfile,
    profilePhotos,
    isLoadingProfile,
    loadDashboardData: refreshData,
    loadFaceProfile,
  } = useDashboardData();

  // Check if face recognition is enabled
  const faceRecognitionEnabled = settings.privacy?.faceRecognition ?? false;

  // Generic modal handlers
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  // Specific modal handlers with additional logic
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

  // Data refresh handlers
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

  // Section props
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

  const subscriptionSectionProps = {
    onOpenUsage: () => openModal(SETTINGS_MODAL_TYPES.USAGE),
    onOpenBillingHistory: () => openModal(SETTINGS_MODAL_TYPES.BILLING_HISTORY),
    onOpenPlanManagement: () => openModal(SETTINGS_MODAL_TYPES.PLAN_MANAGEMENT),
  };

  const dataSectionProps = {
    trips,
    friends,
    profilePhotos,
    hasProfile,
    exportLoading,
    exportError,
    exportSuccess,
    onOpenExport: () => openModal(SETTINGS_MODAL_TYPES.EXPORT_DATA),
    onOpenBackup: () => openModal(SETTINGS_MODAL_TYPES.BACKUP_DATA),
    onOpenDeleteAccount: () => openModal(SETTINGS_MODAL_TYPES.DELETE_ACCOUNT),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings (includes profile, notifications, privacy) */}
      <AccountSection {...accountSectionProps} />

      {/* Face Profile Management */}
      <FaceProfileSection {...faceProfileSectionProps} />

      {/* Subscription & Billing */}
      <SubscriptionSection {...subscriptionSectionProps} />

      {/* Data & Storage */}
      <DataSection {...dataSectionProps} />

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

      {activeModal === SETTINGS_MODAL_TYPES.DELETE_ACCOUNT && (
        <DeleteAccountModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.USAGE && (
        <UsageModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.BILLING_HISTORY && (
        <BillingHistoryModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.PLAN_MANAGEMENT && (
        <PlanManagementModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.EXPORT_DATA && (
        <ExportModal
          isOpen={true}
          onClose={closeModal}
          exportLoading={exportLoading}
          onExportData={exportData}
          onExportCSV={exportCSV}
        />
      )}

      {activeModal === SETTINGS_MODAL_TYPES.BACKUP_DATA && (
        <BackupModal
          isOpen={true}
          onClose={closeModal}
          exportLoading={exportLoading}
          onCreateBackup={createBackup}
        />
      )}
    </div>
  );
};

export default SettingsSection;