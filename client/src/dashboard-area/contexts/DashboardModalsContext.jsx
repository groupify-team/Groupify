import React, { createContext, useContext, useState } from "react";

const DashboardModalsContext = createContext();

export const DashboardModalsProvider = ({ children }) => {
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

  // ... (rest of the functions from your hook)

  const contextValue = {
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

    // User profile actions
    userProfileActions: {
      open: openUserProfile,
      close: closeUserProfile,
      backToAddFriend,
    },

    // ... (other actions)
  };

  return (
    <DashboardModalsContext.Provider value={contextValue}>
      {children}
    </DashboardModalsContext.Provider>
  );
};

// Updated hook to use context
export const useDashboardModals = () => {
  const context = useContext(DashboardModalsContext);
  if (!context) {
    throw new Error(
      "useDashboardModals must be used within a DashboardModalsProvider"
    );
  }
  return context;
};
