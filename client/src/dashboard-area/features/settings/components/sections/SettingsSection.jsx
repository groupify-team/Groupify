// src/dashboard-area/features/settings/components/sections/SettingsSection.jsx - UPDATED
import React, { useState } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useSettings, useExportBackup } from "../../hooks";

// Import remaining section components
import SubscriptionSection from "./SubscriptionSection";
import DataSection from "./DataSection";

// Import modals from consolidated location
import {
  DeleteAccountModal,
  UsageModal,
  BillingHistoryModal,
  PlanManagementModal,
  ExportModal,
  BackupModal,
} from "../modals";

import { SETTINGS_MODAL_TYPES } from "../../constants/settingsConstants.jsx";
import { Cog6ToothIcon, SparklesIcon } from "@heroicons/react/24/outline";

const SettingsSection = () => {
  const { currentUser } = useAuth();
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

  const { events, friends, hasProfile, profilePhotos } = useDashboardData();

  // Generic modal handlers
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  // Section props
  const subscriptionSectionProps = {
    onOpenUsage: () => openModal(SETTINGS_MODAL_TYPES.USAGE),
    onOpenBillingHistory: () => openModal(SETTINGS_MODAL_TYPES.BILLING_HISTORY),
    onOpenPlanManagement: () => openModal(SETTINGS_MODAL_TYPES.PLAN_MANAGEMENT),
  };

  const dataSectionProps = {
    events,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Enhanced Header Section - Similar to Events */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="relative">
            {/* Action Button - Positioned absolutely in top-right */}
            <div className="absolute top-0 right-0">
              <button
                onClick={() => openModal(SETTINGS_MODAL_TYPES.USAGE)}
                className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 text-sm sm:text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105 hover:shadow-xl"
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">View Usage</span>
                <span className="sm:hidden">Usage</span>
              </button>
            </div>

            {/* Title Section */}
            <div className="flex items-center gap-3 sm:gap-4 pr-20 sm:pr-32">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl shadow-lg">
                <Cog6ToothIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                  <span className="inline sm:hidden">
                    Billing & data management
                  </span>
                  <span className="hidden sm:inline">
                    Manage your subscription, billing, and data preferences
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content - Using Events-like spacing */}
        <div className="space-y-6 sm:space-y-8">
          {/* Subscription & Billing Block */}
          <SubscriptionSection {...subscriptionSectionProps} />

          {/* Data & Account Management Block */}
          <DataSection {...dataSectionProps} />
        </div>
      </div>

      {/* Modals */}
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
