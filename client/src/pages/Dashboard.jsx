import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/trips/TripCard";
import TripDetailView from "../components/trips/TripDetailView";
import CreateTripModal from "../components/trips/CreateTripModal";
import AddFriend from "../components/friends/AddFriend";
import EditProfileModal from "../components/profile/EditProfileModal";
import SettingsModal from "../components/settings/SettingsModal";
import UserProfileModal from "../components/profile/UserProfileModal";
import FaceProfileModal from "../components/faceProfile/FaceProfileModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons
import {
  MapIcon,
  UserCircleIcon,
  UserGroupIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  SparklesIcon,
  EyeIcon,
  TrashIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

// functions
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, storage } from "../services/firebase/config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { deleteUser } from "firebase/auth";
import {
  getUserTrips,
  getPendingInvites,
  acceptTripInvite,
  declineTripInvite,
} from "../services/firebase/trips";
import {
  getUserProfile,
  getFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  removeFriend,
  cancelFriendRequest,
  didISendRequest,
} from "../services/firebase/users";
import {
  deleteFaceProfileFromStorage,
  getFaceProfileFromStorage,
} from "../services/firebase/faceProfiles";
import {
  hasFaceProfile,
  getFaceProfile,
  createFaceProfile,
  deleteFaceProfile,
  addPhotosToProfile,
  removePhotosFromProfile,
  getProfilePhotos,
  optimizeProfile,
} from "../services/faceRecognition";

const Dashboard = () => {
  // Authentication context
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Refs
  const notificationRef = useRef(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Navigation state
  const [activeSection, setActiveSection] = useState("trips");

  // NEW: Trip dropdown state
  const [tripsDropdownOpen, setTripsDropdownOpen] = useState(false);
  const [visibleTripsCount, setVisibleTripsCount] = useState(5);

  // NEW: Notifications dropdown state
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] =
    useState(false);

  // Trip detail view state
  const [currentView, setCurrentView] = useState("home"); // 'home' or 'trip'
  const [selectedTripId, setSelectedTripId] = useState(null);
  const searchInputRef = useRef(null);

  // Data states
  const [trips, setTrips] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [tripInvites, setTripInvites] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);

  // Delete account modal state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Trip filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // Face profile states
  const [hasProfile, setHasProfile] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [selectedPhotosToRemove, setSelectedPhotosToRemove] = useState([]);
  const [uploadingProfilePhotos, setUploadingProfilePhotos] = useState([]);
  const [isManagingProfile, setIsManagingProfile] = useState(false);

  // Modal states
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFaceProfileModal, setShowFaceProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // NEW: Functions to handle trip viewing
  const handleViewTrip = (tripId) => {
    setCurrentView("trip");
    setSelectedTripId(tripId);
    setTripsDropdownOpen(false); // Close dropdown when navigating to trip
  };

  const handleBackToDashboard = () => {
    setCurrentView("home");
    setSelectedTripId(null);
  };

  // NEW: Handle trips dropdown
  const toggleTripsDropdown = () => {
    setTripsDropdownOpen(!tripsDropdownOpen);
    setVisibleTripsCount(5); // Reset to show first 5 trips
  };

  const showMoreTrips = () => {
    setVisibleTripsCount((prev) => prev + 5);
  };

  // NEW: Handle notifications dropdown
  const toggleNotificationsDropdown = () => {
    setNotificationsDropdownOpen(!notificationsDropdownOpen);
  };

  // NEW: Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delete account state
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      toast.info("Deleting account... This may take a moment.");

      const batch = writeBatch(db);
      const userId = currentUser.uid;

      // Delete user profile photos from storage
      try {
        const userPhotosRef = ref(storage, `profile_photos/${userId}`);
        const photosList = await listAll(userPhotosRef);

        for (const photoRef of photosList.items) {
          await deleteObject(photoRef);
        }
      } catch (storageError) {
        console.warn("Error deleting profile photos:", storageError);
      }

      // Delete face profile data
      try {
        deleteFaceProfile(userId);
        await deleteFaceProfileFromStorage(userId);
      } catch (faceError) {
        console.warn("Error deleting face profile:", faceError);
      }

      // Delete user document
      batch.delete(doc(db, "users", userId));

      // Delete friend requests
      const sentRequestsQuery = query(
        collection(db, "friendRequests"),
        where("from", "==", userId)
      );
      const receivedRequestsQuery = query(
        collection(db, "friendRequests"),
        where("to", "==", userId)
      );

      const [sentRequests, receivedRequests] = await Promise.all([
        getDocs(sentRequestsQuery),
        getDocs(receivedRequestsQuery),
      ]);

      [...sentRequests.docs, ...receivedRequests.docs].forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // Remove user from friends' friend lists
      for (const friend of friends) {
        const friendRef = doc(db, "users", friend.uid);
        const friendDoc = await getDoc(friendRef);

        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          const updatedFriends = (friendData.friends || []).filter(
            (id) => id !== userId
          );
          batch.update(friendRef, { friends: updatedFriends });
        }
      }

      // Execute batch operations
      await batch.commit();

      // Delete user from Firebase Auth (this should be last)
      await deleteUser(currentUser);

      toast.success("Account deleted successfully. Goodbye!");

      // Navigate to home page
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);

      if (error.code === "auth/requires-recent-login") {
        toast.error(
          "For security reasons, please log out and log back in, then try deleting your account again."
        );
      } else {
        toast.error(
          "Failed to delete account. Please try again or contact support."
        );
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountModal(false);
      setDeleteConfirmText("");
    }
  };

  // Navigation items
  const navigationItems = [
    {
      id: "trips",
      name: "My Trips",
      icon: MapIcon,
      badge: trips.length,
      hasDropdown: true,
    },
    { id: "faceprofile", name: "Face Profile", icon: UserCircleIcon },
    {
      id: "friends",
      name: "Friends",
      icon: UserGroupIcon,
      badge: friends.length,
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: BellIcon,
      badge: pendingRequests.length + tripInvites.length,
    },
    { id: "settings", name: "Settings", icon: Cog6ToothIcon },
  ];

  // Helper function for uploading files to Firebase Storage
  const uploadProfilePhotos = async (files, userId) => {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `profile_photos/${userId}/${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  };

  // Load profile data when profile exists
  const loadProfileData = () => {
    if (!currentUser?.uid || !hasProfile) return;

    try {
      const profileData = getFaceProfile(currentUser.uid);
      const photos = getProfilePhotos(currentUser.uid);
      setProfile(profileData);
      setProfilePhotos(photos);
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  // Auto-load face profile on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserFaceProfile();
    }
  }, [currentUser]);

  // Load profile data when hasProfile changes
  useEffect(() => {
    if (hasProfile && currentUser?.uid) {
      loadProfileData();
    }
  }, [hasProfile, currentUser]);

  // Handle sidebar toggle
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!currentUser?.uid) return;
      try {
        const requests = await getPendingFriendRequests(currentUser.uid);
        setPendingFriendRequests(requests || []);
      } catch (error) {
        console.error("Error fetching pending friend requests:", error);
      }
    };

    if (currentUser) {
      fetchPendingRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get("section");
    if (section) {
      setActiveSection(section);
      setCurrentView("home");
      // Clear the URL parameter
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, navigate]);

  // Updated loadUserFaceProfile function
  const loadUserFaceProfile = async () => {
    if (!currentUser?.uid) return;

    setIsLoadingProfile(true);
    try {
      // First, clear any existing profile to start fresh
      deleteFaceProfile(currentUser.uid);

      // Check if profile exists in memory first
      if (hasFaceProfile(currentUser.uid)) {
        setHasProfile(true);
        console.log("✅ Face profile already loaded in memory");
        return;
      }

      // Try to load from Firebase Storage automatically
      console.log("🔍 Checking for stored face profile...");
      const storedProfile = await getFaceProfileFromStorage(currentUser.uid);

      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        console.log("📥 Found stored face profile, loading automatically...");

        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await createFaceProfile(currentUser.uid, imageUrls);
          setHasProfile(true);
          console.log("✅ Face profile loaded automatically from storage");
        } catch (error) {
          console.error("❌ Failed to auto-load face profile:", error);
          console.log("🗑️ Cleaning up corrupted profile data...");

          try {
            await deleteFaceProfileFromStorage(currentUser.uid);
          } catch (cleanupError) {
            console.warn("⚠️ Could not clean up stored profile:", cleanupError);
          }

          setHasProfile(false);
        }
      } else {
        console.log("ℹ️ No face profile found");
        setHasProfile(false);
      }
    } catch (error) {
      console.error("❌ Error checking for face profile:", error);
      setHasProfile(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle profile photo file selection
  const handleProfilePhotoSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      alert("Only image files are allowed");
    }

    setUploadingProfilePhotos(validFiles);
  };

  // Add more photos to existing profile
  const addMorePhotosToProfile = async () => {
    if (uploadingProfilePhotos.length === 0) {
      alert("Please select images to add");
      return;
    }

    setIsManagingProfile(true);

    try {
      console.log("🔄 Uploading new profile photos...");
      const imageUrls = await uploadProfilePhotos(
        uploadingProfilePhotos,
        currentUser.uid
      );

      const updatedProfile = await addPhotosToProfile(
        currentUser.uid,
        imageUrls,
        (progress) => console.log("Adding photos progress:", progress)
      );

      setProfile(updatedProfile);
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      setUploadingProfilePhotos([]);

      toast.success(
        `Added ${uploadingProfilePhotos.length} photos to your profile!`
      );
    } catch (error) {
      console.error("Failed to add photos:", error);
      toast.error(error.message || "Failed to add photos to profile");
    } finally {
      setIsManagingProfile(false);
    }
  };

  // Remove selected photos from profile
  const removeSelectedPhotos = async () => {
    if (selectedPhotosToRemove.length === 0) {
      alert("Please select photos to remove");
      return;
    }

    setIsManagingProfile(true);

    try {
      const updatedProfile = removePhotosFromProfile(
        currentUser.uid,
        selectedPhotosToRemove
      );

      setProfile(updatedProfile);
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      setSelectedPhotosToRemove([]);

      toast.success(
        `Removed ${selectedPhotosToRemove.length} photos from profile`
      );
    } catch (error) {
      console.error("Failed to remove photos:", error);
      toast.error(error.message || "Failed to remove photos");
    } finally {
      setIsManagingProfile(false);
    }
  };

  // Optimize profile by removing low quality photos
  const optimizeCurrentProfile = async () => {
    if (
      !window.confirm(
        "This will remove low quality photos from your profile. Continue?"
      )
    ) {
      return;
    }

    setIsManagingProfile(true);

    try {
      const optimizedProfile = optimizeProfile(currentUser.uid, 0.5);
      setProfile(optimizedProfile);
      setProfilePhotos(getProfilePhotos(currentUser.uid));

      toast.success("Profile optimized - removed low quality photos");
    } catch (error) {
      console.error("Failed to optimize profile:", error);
      toast.error(error.message || "Failed to optimize profile");
    } finally {
      setIsManagingProfile(false);
    }
  };

  // Delete entire profile
  const deleteCurrentProfile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your face profile? This cannot be undone."
      )
    ) {
      return;
    }

    setIsManagingProfile(true);

    try {
      // Delete from memory
      deleteFaceProfile(currentUser.uid);

      // Delete from Firebase Storage
      try {
        await deleteFaceProfileFromStorage(currentUser.uid);
        console.log("✅ Face profile deleted from Firebase Storage");
      } catch (storageError) {
        console.warn(
          "⚠️ Could not delete from Firebase Storage:",
          storageError
        );
      }

      // Update local state
      setHasProfile(false);
      setProfile(null);
      setProfilePhotos([]);
      setShowProfileManagement(false);

      toast.success("Face profile deleted successfully");
    } catch (error) {
      console.error("Failed to delete profile:", error);
      toast.error("Failed to delete profile: " + error.message);
    } finally {
      setIsManagingProfile(false);
    }
  };

  // Toggle photo selection for removal
  const togglePhotoSelection = (photoUrl) => {
    setSelectedPhotosToRemove((prev) =>
      prev.includes(photoUrl)
        ? prev.filter((url) => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  // Load initial data
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [userTrips, userProfile, userFriends, friendRequests, invites] =
          await Promise.all([
            getUserTrips(currentUser.uid),
            getUserProfile(currentUser.uid),
            getFriends(currentUser.uid),
            getPendingFriendRequests(currentUser.uid),
            getPendingInvites(currentUser.uid),
          ]);

        setTrips(userTrips);
        setUserData(userProfile);
        setFriends(userFriends);
        setPendingRequests(friendRequests);
        setTripInvites(invites);

        // Load face profile
        if (hasFaceProfile(currentUser.uid)) {
          setHasProfile(true);
          setProfilePhotos(getProfilePhotos(currentUser.uid));
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    // --- Live Friends Listener ---
    let unsubscribeFriends = () => {};

    if (currentUser?.uid) {
      const userDocRef = doc(db, "users", currentUser.uid);

      getDoc(userDocRef).then((snap) => {
        if (!snap.exists()) {
          console.warn("⚠️ userDoc does not exist yet:", currentUser.uid);
          return;
        }

        unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) return;
          console.log("🔁 Friends snapshot triggered");

          const data = docSnap.data();
          const friendIds = data.friends || [];
          const friendsData = [];

          for (const fid of friendIds) {
            if (!fid || typeof fid !== "string" || fid.trim() === "") {
              console.warn("⚠️ Skipping invalid friend ID:", fid);
              continue;
            }

            try {
              const friendRef = doc(db, "users", fid);
              const friendSnap = await getDoc(friendRef);

              if (friendSnap.exists()) {
                const fData = friendSnap.data();
                friendsData.push({
                  uid: fid,
                  displayName: fData.displayName || fData.email || fid,
                  email: fData.email || "",
                  photoURL: fData.photoURL || "",
                });
              }
            } catch (err) {
              console.error(`❌ Error fetching friend ${fid}:`, err);
            }
          }

          setFriends(friendsData);
        });
      });
    }

    // --- Live Pending Friend Requests Listener ---
    const pendingRequestsQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribePendingRequests = onSnapshot(
      pendingRequestsQuery,
      async (snapshot) => {
        if (!currentUser?.uid) return;

        const requests = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          if (data.from === currentUser.uid) continue;

          try {
            const senderRef = doc(db, "users", data.from);
            const senderSnap = await getDoc(senderRef);

            requests.push({
              id: docSnap.id,
              from: data.from,
              displayName: senderSnap.exists()
                ? senderSnap.data().displayName
                : "",
              email: senderSnap.exists() ? senderSnap.data().email : "",
              createdAt: data.createdAt,
            });
          } catch (err) {
            console.warn("⚠️ Error fetching sender:", data.from, err);
          }
        }

        setPendingRequests(requests);
      }
    );

    loadDashboardData();

    // Cleanup listeners
    return () => {
      unsubscribeFriends();
      unsubscribePendingRequests();
    };
  }, [currentUser]);

  // Filter trips based on search and date
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.location?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    const now = new Date();
    const tripDate = trip.startDate ? new Date(trip.startDate) : null;

    switch (dateFilter) {
      case "upcoming":
        return tripDate && tripDate > now;
      case "past":
        return tripDate && tripDate < now;
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return tripDate && tripDate > thirtyDaysAgo;
      default:
        return true;
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleProfileLoaded = (loaded) => {
    setHasProfile(loaded);
    if (loaded) {
      setShowProfileManager(false);
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      toast.success("Face profile created successfully!");
    }
  };

  // Open User Profile Modal
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const handleOpenUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUserProfile({ uid, ...userData });
        setIsUserProfileOpen(true);
        setShowAddFriendModal(false);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleAccept = async (fromUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, fromUid);
      setPendingRequests((prev) => prev.filter((req) => req.from !== fromUid));
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
      toast.success("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleReject = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      const updatedPending = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(updatedPending);
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  // NEW: Notifications Dropdown Component
  const NotificationsDropdown = () => {
    const allNotifications = [
      ...pendingRequests.map((req) => ({
        id: `friend-request-${req.id}`,
        type: "friend_request",
        message: `${req.displayName || req.email} wants to be your friend`,
        avatar:
          req.photoURL ||
          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
        time: req.createdAt,
        actions: [
          {
            label: "Accept",
            action: () => handleAccept(req.from),
            type: "accept",
          },
          {
            label: "Decline",
            action: () => handleReject(req.from),
            type: "decline",
          },
        ],
      })),
      ...tripInvites.map((invite) => ({
        id: `trip-invite-${invite.id}`,
        type: "trip_invite",
        message: `${invite.inviterName} invited you to "${invite.tripName}"`,
        avatar:
          invite.inviterPhoto ||
          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
        time: invite.createdAt,
        actions: [
          {
            label: "Accept",
            action: async () => {
              await acceptTripInvite(invite.id, currentUser.uid);
              setTripInvites((prev) => prev.filter((i) => i.id !== invite.id));
              const refreshedTrips = await getUserTrips(currentUser.uid);
              setTrips(refreshedTrips);
              toast.success("Trip invitation accepted");
            },
            type: "accept",
          },
          {
            label: "Decline",
            action: async () => {
              await declineTripInvite(invite.id);
              setTripInvites((prev) => prev.filter((i) => i.id !== invite.id));
              toast.success("Trip invitation declined");
            },
            type: "decline",
          },
        ],
      })),
    ];

    return (
      <div className="absolute right-0 top-full mt-2 w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 z-50 max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
        </div>

        {allNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <BellIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {allNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={notification.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                      {notification.message}
                    </p>
                    {notification.time && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {new Date(
                          notification.time?.toDate?.() || notification.time
                        ).toRelativeString?.() ||
                          new Date(
                            notification.time?.toDate?.() || notification.time
                          ).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            action.type === "accept"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Section Components
  const TripsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Trips
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Organize and manage your travel memories
          </p>
        </div>
        <button
          onClick={() => setShowCreateTripModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Trip
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search trips..."
              value={searchTerm}
              onChange={useCallback(
                (e) => {
                  setSearchTerm(e.target.value);
                  // Keep focus on the input after state change
                  setTimeout(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }, 0);
                },
                [setSearchTerm]
              )}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Select dropdown with custom arrow positioning */}
          <div className="relative min-w-[150px]">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 pr-8 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">All Trips</option>
              <option value="upcoming">Upcoming</option>
              <option value="recent">Recent</option>
              <option value="past">Past</option>
            </select>
            {/* Custom arrow positioned more to the left */}
            <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {searchTerm || dateFilter !== "all"
                ? "No trips match your filters"
                : "No trips yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || dateFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first trip to get started"}
            </p>
            {!searchTerm && dateFilter === "all" && (
              <button
                onClick={() => setShowCreateTripModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Create Your First Trip
              </button>
            )}
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onViewTrip={handleViewTrip} />
          ))
        )}
      </div>
    </div>
  );

    const FaceProfileSection = () => (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Face Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            AI-powered face recognition for automatic photo organization
          </p>
        </div>

        {!hasProfile ? (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserCircleIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Create Your Face Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Upload 2-10 clear photos of yourself or use your camera to enable automatic photo
              recognition in your trips
            </p>
            <button
              onClick={() => setShowFaceProfileModal(true)}
              disabled={isLoadingProfile}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <CameraIcon className="w-5 h-5" />
              {isLoadingProfile ? "Loading..." : "Setup Face Profile"}
            </button>
          </div>
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Face Profile Active
                </h2>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Ready for automatic photo recognition
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileManagement(!showProfileManagement)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Manage
              </button>
              <button
                onClick={deleteCurrentProfile}
                disabled={isManagingProfile}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Management Options */}
          {showProfileManagement && (
            <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl p-6 mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={optimizeCurrentProfile}
                  disabled={isManagingProfile}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-colors"
                >
                  {isManagingProfile ? "Optimizing..." : "Optimize Profile"}
                </button>
              </div>

              {/* Add Photos Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Add More Photos
                </label>
                <div className="flex gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleProfilePhotoSelect}
                    className="flex-1 text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                  />
                  {uploadingProfilePhotos.length > 0 && (
                    <button
                      onClick={addMorePhotosToProfile}
                      disabled={isManagingProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-colors"
                    >
                      {isManagingProfile
                        ? "Adding..."
                        : `Add ${uploadingProfilePhotos.length}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Current Profile Photos */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Profile Photos ({profilePhotos.length})
                  </label>
                  {selectedPhotosToRemove.length > 0 && (
                    <button
                      onClick={removeSelectedPhotos}
                      disabled={isManagingProfile}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {isManagingProfile
                        ? "Removing..."
                        : `Remove ${selectedPhotosToRemove.length}`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {profilePhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div
                        className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                          selectedPhotosToRemove.includes(photo.url)
                            ? "border-red-500 bg-red-100 dark:bg-red-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-400"
                        }`}
                        onClick={() => togglePhotoSelection(photo.url)}
                      >
                        <img
                          src={photo.url}
                          alt="Profile"
                          className="w-full h-20 object-cover"
                        />
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                            selectedPhotosToRemove.includes(photo.url)
                              ? "bg-red-500 bg-opacity-60"
                              : "bg-black bg-opacity-0 group-hover:bg-opacity-20"
                          }`}
                        >
                          {selectedPhotosToRemove.includes(photo.url) && (
                            <CheckCircleIcon className="w-8 h-8 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-white text-xs font-bold ${
                            photo.qualityTier === "high"
                              ? "bg-green-500"
                              : photo.qualityTier === "medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {(photo.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Profile Photos Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            {profilePhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                />
                <div className="absolute bottom-2 right-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full text-white ${
                      photo.qualityTier === "high"
                        ? "bg-green-500"
                        : photo.qualityTier === "medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {Math.round(photo.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const FriendsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Friends
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Connect and share memories with friends
          </p>
        </div>
        <button
          onClick={() => setShowAddFriendModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Friend
        </button>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        {friends.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserGroupIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No friends yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start connecting with people to share your travel memories
            </p>
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Add Your First Friend
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => handleOpenUserProfile(friend.uid)}
              >
                <img
                  src={
                    friend.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt={friend.displayName}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {friend.displayName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {friend.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const NotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your friend requests and trip invitations
        </p>
      </div>

      {/* Friend Requests */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Friend Requests
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
            No pending friend requests
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {request.displayName || request.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    wants to be your friend
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request.from)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request.from)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trip Invitations */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Trip Invitations
          {tripInvites.length > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {tripInvites.length}
            </span>
          )}
        </h2>

        {tripInvites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
            No pending trip invitations
          </p>
        ) : (
          <div className="space-y-3">
            {tripInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {invite.tripName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invited by {invite.inviterName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await acceptTripInvite(invite.id, currentUser.uid);
                      setTripInvites((prev) =>
                        prev.filter((i) => i.id !== invite.id)
                      );
                      const refreshedTrips = await getUserTrips(
                        currentUser.uid
                      );
                      setTrips(refreshedTrips);
                      toast.success("Trip invitation accepted");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      await declineTripInvite(invite.id);
                      setTripInvites((prev) =>
                        prev.filter((i) => i.id !== invite.id)
                      );
                      toast.success("Trip invitation declined");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const SettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <UserCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Account Information
        </h2>

        <div className="flex items-center gap-6 mb-6">
          <img
            src={
              userData?.photoURL ||
              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
            }
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {userData?.displayName || currentUser?.displayName}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {userData?.email || currentUser?.email}
            </p>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium mt-1"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">
              Preferences
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  defaultChecked
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Email notifications
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  defaultChecked
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Trip invitations
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Friend requests
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">
              Privacy
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  defaultChecked
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Profile visible to friends
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Allow face recognition
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  defaultChecked
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Show in search results
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Storage */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Data & Storage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {trips.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Trips
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {friends.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Friends</p>
          </div>
          <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {hasProfile ? profilePhotos.length : 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Profile Photos
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors">
            Export My Data
          </button>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  // Modified renderSection to handle trip view
  const renderSection = () => {
    // If we're viewing a trip, show the trip detail
    if (currentView === "trip" && selectedTripId) {
      return <TripDetailView tripId={selectedTripId} />;
    }

    // Otherwise show the regular sections
    switch (activeSection) {
      case "trips":
        return <TripsSection />;
      case "faceprofile":
        return <FaceProfileSection />;
      case "friends":
        return <FriendsSection />;
      case "notifications":
        return <NotificationsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <TripsSection />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-colors duration-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveSection("trips");
                setCurrentView("home");
                setTripsDropdownOpen(false);
              }}
              className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-2 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Groupify
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dashboard
                </p>
              </div>
            </button>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <img
              src={
                userData?.photoURL ||
                "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
              }
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {userData?.displayName || currentUser?.displayName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userData?.email || currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Back button when viewing trip */}
        {currentView === "trip" && (
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={handleBackToDashboard}
              className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl font-medium transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id && currentView === "home";
              return (
                <li key={item.id}>
                  <div className="flex items-center">
                    {/* Main navigation button */}
                    <button
                      onClick={() => {
                        setActiveSection(item.id);
                        setCurrentView("home");
                      }}
                      className={`flex-1 flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge > 0 && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-white text-indigo-600"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Separate arrow button for dropdown */}
                    {item.hasDropdown && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the main button
                          toggleTripsDropdown();
                        }}
                        className={`ml-1 p-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-white hover:bg-white/20"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <div
                          className={`transition-all duration-300 ease-in-out ${
                            tripsDropdownOpen
                              ? "rotate-90 scale-110"
                              : "scale-100"
                          }`}
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Trips dropdown */}
                  {item.id === "trips" && (
                    <div
                      className={`overflow-hidden transition-all duration-700 ease-in-out ${
                        tripsDropdownOpen
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        {trips.length === 0 ? (
                          <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                            No trips yet
                          </div>
                        ) : (
                          <>
                            {trips.slice(0, visibleTripsCount).map((trip) => (
                              <button
                                key={trip.id}
                                onClick={() => {
                                  handleViewTrip(trip.id);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                                  selectedTripId === trip.id
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`}
                              >
                                <div className="truncate">{trip.name}</div>
                                {trip.location && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                    📍 {trip.location}
                                  </div>
                                )}
                              </button>
                            ))}

                            {trips.length > visibleTripsCount && (
                              <button
                                onClick={showMoreTrips}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              >
                                + Show{" "}
                                {Math.min(5, trips.length - visibleTripsCount)}{" "}
                                more
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full overflow-hidden transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {" "}
        {/* Header */}
        <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 w-full">
              {/* Left section - Mobile menu button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Welcome message - hidden on mobile */}
                <div className="hidden sm:block">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentView === "trip"
                      ? "Trip Details"
                      : `Welcome back, ${
                          userData?.displayName ||
                          currentUser?.displayName ||
                          "User"
                        }!`}
                  </h2>
                </div>
              </div>

              {/* Center - Logo for mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Groupify
                </span>
              </div>

              {/* Right section - Theme toggle, Notifications and user menu */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === "dark" ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Notifications with dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={toggleNotificationsDropdown}
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    {(pendingRequests.length > 0 || tripInvites.length > 0) && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {pendingRequests.length + tripInvites.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsDropdownOpen && <NotificationsDropdown />}
                </div>

                {/* User avatar */}
                <img
                  src={
                    userData?.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            {error && (
              <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl mb-6 flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {renderSection()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={showCreateTripModal}
        onClose={() => setShowCreateTripModal(false)}
        onTripCreated={(newTrip) => {
          setTrips((prev) => [newTrip, ...prev]);
          setShowCreateTripModal(false);
          toast.success("Trip created successfully!");
        }}
      />

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Add Friend
              </h2>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <AddFriend onUserSelect={handleOpenUserProfile} />
          </div>
        </div>
      )}

      <FaceProfileModal 
        isOpen={showFaceProfileModal}
        onClose={() => setShowFaceProfileModal(false)}
        onProfileCreated={handleProfileLoaded}
      />
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          currentUserId={currentUser.uid}
          isFriend={friends.some((f) => f.uid === selectedUserProfile.uid)}
          isPending={
            pendingRequests.some((r) => r.from === selectedUserProfile.uid) ||
            pendingFriendRequests.some((r) => r.to === selectedUserProfile.uid)
          }
          onlyTripMembers={false}
          onAddFriend={async (uid) => {
            await sendFriendRequest(currentUser.uid, uid);
            toast.success("Friend request sent");

            setPendingFriendRequests((prev) => [
              ...prev,
              { from: currentUser.uid, to: uid },
            ]);
          }}
          onCancelRequest={async (uid) => {
            await cancelFriendRequest(currentUser.uid, uid);
            setPendingFriendRequests((prev) =>
              prev.filter((r) => r.to !== uid && r.from !== uid)
            );
            toast.info("Friend request cancelled");
          }}
          onRemoveFriend={async (uid) => {
            await removeFriend(currentUser.uid, uid);
            setFriends((prev) => prev.filter((f) => f.uid !== uid));
            toast.success("Friend removed");
          }}
          onClose={() => {
            setIsUserProfileOpen(false);
            setSelectedUserProfile(null);
          }}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Account
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                  ⚠️ Warning
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  This will permanently delete your account and ALL your data
                  including:
                </p>
                <ul className="text-red-700 dark:text-red-300 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>All your trips and photos</li>
                  <li>Your face profile</li>
                  <li>Friend connections</li>
                  <li>Account settings</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                  disabled={isDeleting}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== "DELETE"}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Dashboard;
