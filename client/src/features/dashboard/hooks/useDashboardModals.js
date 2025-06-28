// useDashboardModals.js - Modal state management hook
import { useState } from "react";

export const useDashboardModals = () => {
  // Main feature modals
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFaceProfileModal, setShowFaceProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Face profile management modals
  const [showFaceProfileManageModal, setShowFaceProfileManageModal] =
    useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);

  // Account and billing modals
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [showCancelPlanModal, setShowCancelPlanModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // User profile modal states
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [viewingFromAddFriend, setViewingFromAddFriend] = useState(false);

  // Add friend modal preservation states
  const [preservedSearchInput, setPreservedSearchInput] = useState("");
  const [preservedFoundUser, setPreservedFoundUser] = useState(null);

  // Delete account states
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile management states
  const [selectedPhotosToRemove, setSelectedPhotosToRemove] = useState([]);
  const [uploadingProfilePhotos, setUploadingProfilePhotos] = useState([]);
  const [isManagingProfile, setIsManagingProfile] = useState(false);

  /**
   * Main feature modal actions
   */
  const openCreateTripModal = () => setShowCreateTripModal(true);
  const closeCreateTripModal = () => setShowCreateTripModal(false);

  const openAddFriendModal = () => {
    setShowAddFriendModal(true);
    // Clear any preserved state when opening fresh
    setPreservedSearchInput("");
    setPreservedFoundUser(null);
  };
  const closeAddFriendModal = () => {
    setShowAddFriendModal(false);
    // Clear preserved state when closing
    setPreservedSearchInput("");
    setPreservedFoundUser(null);
  };

  const openFaceProfileModal = () => setShowFaceProfileModal(true);
  const closeFaceProfileModal = () => setShowFaceProfileModal(false);

  const openEditProfileModal = () => setShowEditProfileModal(true);
  const closeEditProfileModal = () => setShowEditProfileModal(false);

  const openSettingsModal = () => setShowSettingsModal(true);
  const closeSettingsModal = () => setShowSettingsModal(false);

  /**
   * Face profile management modal actions
   */
  const openFaceProfileManageModal = () => setShowFaceProfileManageModal(true);
  const closeFaceProfileManageModal = () => {
    setShowFaceProfileManageModal(false);
    // Clear selection states when closing
    setSelectedPhotosToRemove([]);
    setUploadingProfilePhotos([]);
  };

  const openProfileManager = () => setShowProfileManager(true);
  const closeProfileManager = () => setShowProfileManager(false);

  /**
   * Account and billing modal actions
   */
  const openUsageModal = () => setShowUsageModal(true);
  const closeUsageModal = () => setShowUsageModal(false);

  const openBillingHistoryModal = () => setShowBillingHistoryModal(true);
  const closeBillingHistoryModal = () => setShowBillingHistoryModal(false);

  const openCancelPlanModal = () => setShowCancelPlanModal(true);
  const closeCancelPlanModal = () => setShowCancelPlanModal(false);

  const openDeleteAccountModal = () => setShowDeleteAccountModal(true);
  const closeDeleteAccountModal = () => {
    setShowDeleteAccountModal(false);
    setDeleteConfirmText("");
    setIsDeleting(false);
  };

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  /**
   * User profile modal actions
   */
  const openUserProfile = (user, fromAddFriend = false) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
    setViewingFromAddFriend(fromAddFriend);

    if (fromAddFriend) {
      setShowAddFriendModal(false);
      // Preserve search state if coming from AddFriend
      const addFriendInput =
        document.querySelector('input[type="email"]')?.value || "";
      setPreservedSearchInput(addFriendInput);

      // Find the current found user to preserve
      const foundUserElement = document.querySelector("[data-found-user]");
      if (foundUserElement) {
        try {
          const foundUserData = JSON.parse(foundUserElement.dataset.foundUser);
          setPreservedFoundUser(foundUserData);
        } catch (e) {
          // If parsing fails, we'll just preserve the input
        }
      }
    }
  };

  const closeUserProfile = () => {
    setIsUserProfileOpen(false);
    setSelectedUserProfile(null);

    if (viewingFromAddFriend) {
      setViewingFromAddFriend(false);
      setShowAddFriendModal(true);
    } else {
      // Clear preserved state when closing normally
      setPreservedSearchInput("");
      setPreservedFoundUser(null);
    }
  };

  const backToAddFriend = () => {
    setSelectedUserProfile(null);
    setViewingFromAddFriend(false);
    setShowAddFriendModal(true);
  };

  /**
   * Delete account modal actions
   */
  const updateDeleteConfirmText = (text) => setDeleteConfirmText(text);
  const setDeletingState = (deleting) => setIsDeleting(deleting);

  /**
   * Profile management actions
   */
  const togglePhotoSelection = (photoUrl) => {
    setSelectedPhotosToRemove((prev) =>
      prev.includes(photoUrl)
        ? prev.filter((url) => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  const clearPhotoSelection = () => setSelectedPhotosToRemove([]);

  const setUploadingPhotos = (photos) => setUploadingProfilePhotos(photos);
  const clearUploadingPhotos = () => setUploadingProfilePhotos([]);

  const setManagingProfileState = (managing) => setIsManagingProfile(managing);

  /**
   * Close all modals - useful for cleanup or navigation
   */
  const closeAllModals = () => {
    setShowCreateTripModal(false);
    setShowAddFriendModal(false);
    setShowFaceProfileModal(false);
    setShowEditProfileModal(false);
    setShowSettingsModal(false);
    setShowFaceProfileManageModal(false);
    setShowProfileManager(false);
    setShowUsageModal(false);
    setShowBillingHistoryModal(false);
    setShowCancelPlanModal(false);
    setShowDeleteAccountModal(false);
    setShowLogoutModal(false);
    setIsUserProfileOpen(false);

    // Clear all related states
    setSelectedUserProfile(null);
    setViewingFromAddFriend(false);
    setPreservedSearchInput("");
    setPreservedFoundUser(null);
    setDeleteConfirmText("");
    setIsDeleting(false);
    setSelectedPhotosToRemove([]);
    setUploadingProfilePhotos([]);
    setIsManagingProfile(false);
  };

  /**
   * Check if any modal is open
   */
  const isAnyModalOpen = () => {
    return (
      showCreateTripModal ||
      showAddFriendModal ||
      showFaceProfileModal ||
      showEditProfileModal ||
      showSettingsModal ||
      showFaceProfileManageModal ||
      showProfileManager ||
      showUsageModal ||
      showBillingHistoryModal ||
      showCancelPlanModal ||
      showDeleteAccountModal ||
      showLogoutModal ||
      isUserProfileOpen
    );
  };

  /**
   * Get list of currently open modals (for debugging)
   */
  const getOpenModals = () => {
    const openModals = [];

    if (showCreateTripModal) openModals.push("createTrip");
    if (showAddFriendModal) openModals.push("addFriend");
    if (showFaceProfileModal) openModals.push("faceProfile");
    if (showEditProfileModal) openModals.push("editProfile");
    if (showSettingsModal) openModals.push("settings");
    if (showFaceProfileManageModal) openModals.push("faceProfileManage");
    if (showProfileManager) openModals.push("profileManager");
    if (showUsageModal) openModals.push("usage");
    if (showBillingHistoryModal) openModals.push("billingHistory");
    if (showCancelPlanModal) openModals.push("cancelPlan");
    if (showDeleteAccountModal) openModals.push("deleteAccount");
    if (showLogoutModal) openModals.push("logout");
    if (isUserProfileOpen) openModals.push("userProfile");

    return openModals;
  };

  return {
    // Modal states
    modals: {
      showCreateTripModal,
      showAddFriendModal,
      showFaceProfileModal,
      showEditProfileModal,
      showSettingsModal,
      showFaceProfileManageModal,
      showProfileManager,
      showUsageModal,
      showBillingHistoryModal,
      showCancelPlanModal,
      showDeleteAccountModal,
      showLogoutModal,
      isUserProfileOpen,
    },

    // User profile states
    userProfile: {
      selectedUserProfile,
      viewingFromAddFriend,
      preservedSearchInput,
      preservedFoundUser,
    },

    // Delete account states
    deleteAccount: {
      deleteConfirmText,
      isDeleting,
    },

    // Profile management states
    profileManagement: {
      selectedPhotosToRemove,
      uploadingProfilePhotos,
      isManagingProfile,
    },

    // Main modal actions
    createTrip: {
      open: openCreateTripModal,
      close: closeCreateTripModal,
    },
    addFriend: {
      open: openAddFriendModal,
      close: closeAddFriendModal,
    },
    faceProfile: {
      open: openFaceProfileModal,
      close: closeFaceProfileModal,
    },
    editProfile: {
      open: openEditProfileModal,
      close: closeEditProfileModal,
    },
    settings: {
      open: openSettingsModal,
      close: closeSettingsModal,
    },

    // Face profile management actions
    faceProfileManage: {
      open: openFaceProfileManageModal,
      close: closeFaceProfileManageModal,
    },
    profileManager: {
      open: openProfileManager,
      close: closeProfileManager,
    },

    // Account modal actions
    usage: {
      open: openUsageModal,
      close: closeUsageModal,
    },
    billingHistory: {
      open: openBillingHistoryModal,
      close: closeBillingHistoryModal,
    },
    cancelPlan: {
      open: openCancelPlanModal,
      close: closeCancelPlanModal,
    },
    deleteAccount: {
      open: openDeleteAccountModal,
      close: closeDeleteAccountModal,
      updateConfirmText: updateDeleteConfirmText,
      setDeleting: setDeletingState,
    },
    logout: {
      open: openLogoutModal,
      close: closeLogoutModal,
    },

    // User profile actions
    userProfileActions: {
      open: openUserProfile,
      close: closeUserProfile,
      backToAddFriend,
    },

    // Profile management actions
    profileActions: {
      togglePhotoSelection,
      clearPhotoSelection,
      setUploadingPhotos,
      clearUploadingPhotos,
      setManagingState: setManagingProfileState,
    },

    // Utility actions
    closeAllModals,
    isAnyModalOpen,
    getOpenModals,
  };
};
