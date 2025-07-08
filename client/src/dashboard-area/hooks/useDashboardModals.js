/**
 * Hook for managing dashboard modals state
 */
import { useState, useCallback } from "react";

const useDashboardModals = () => {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Profile modal
  const openProfileModal = useCallback(() => setProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setProfileModalOpen(false), []);

  // Settings modal
  const openSettingsModal = useCallback(() => setSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setSettingsModalOpen(false), []);

  // Notifications modal
  const openNotificationsModal = useCallback(
    () => setNotificationsModalOpen(true),
    []
  );
  const closeNotificationsModal = useCallback(
    () => setNotificationsModalOpen(false),
    []
  );

  // Create event modal
  const openCreateEventModal = useCallback(
    () => setCreateEventModalOpen(true),
    []
  );
  const closeCreateEventModal = useCallback(
    () => setCreateEventModalOpen(false),
    []
  );

  // Help modal
  const openHelpModal = useCallback(() => setHelpModalOpen(true), []);
  const closeHelpModal = useCallback(() => setHelpModalOpen(false), []);

  // Feedback modal
  const openFeedbackModal = useCallback(() => setFeedbackModalOpen(true), []);
  const closeFeedbackModal = useCallback(() => setFeedbackModalOpen(false), []);

  return {
    profileModalOpen,
    settingsModalOpen,
    notificationsModalOpen,
    createEventModalOpen,
    helpModalOpen,
    feedbackModalOpen,
    openProfileModal,
    closeProfileModal,
    openSettingsModal,
    closeSettingsModal,
    openNotificationsModal,
    closeNotificationsModal,
    openCreateEventModal,
    closeCreateEventModal,
    openHelpModal,
    closeHelpModal,
    openFeedbackModal,
    closeFeedbackModal,
  };
};

export default useDashboardModals;
