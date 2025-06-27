import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../auth/contexts/AuthContext";
import { useTheme } from "../../../../shared/contexts/ThemeContext";
import { toast } from "react-hot-toast";

import FaceProfileModal from "../../../face-recognition/components/FaceProfileModal";
import AddFriend from "../../../friends/components/AddFriend";
import EditProfileModal from "../../../../shared/ui/EditProfileModal";
import UserProfileModal from "../../../../shared/ui/UserProfileModal";
import SettingsModal from "../../../settings/components/SettingsModal";
import CreateTripModal from "../../../trips/components/CreateTripModal";
import TripCard from "../../../trips/components/TripCard";
import TripDetailView from "../../../trips/pages/TripDetailPage/TripDetailPage";

// Icons
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CameraIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MoonIcon,
  PlusIcon,
  SparklesIcon,
  SunIcon,
  CogIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// functions
import { deleteUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  addPhotosToProfile,
  createFaceProfile,
  deleteFaceProfile,
  getFaceProfile,
  getProfilePhotos,
  hasFaceProfile,
  optimizeProfile,
  removePhotosFromProfile,
} from "../services/faceRecognitionService";
import { db, storage } from "../services/firebase/config";
import {
  deleteFaceProfileFromStorage,
  getFaceProfileFromStorage,
} from "../services/firebase/faceProfiles";
import {
  createTrip,
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
  acceptTripInvite,
  declineTripInvite,
  getPendingInvites,
  getUserTrips,
} from "../services/firebase/trips";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingFriendRequests,
  getUserProfile,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../services/firebase/users";

const Dashboard = () => {
  // Authentication context
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Refs
  const notificationRef = useRef(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  // Navigation state
  const [activeSection, setActiveSection] = useState("trips");
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
  const mobileUserMenuRef = useRef(null);

  // Trip dropdown state
  const [tripsDropdownOpen, setTripsDropdownOpen] = useState(false);
  const [visibleTripsCount, setVisibleTripsCount] = useState(5);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Notifications dropdown state
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
  const [friendsActiveTab, setFriendsActiveTab] = useState("friends"); // "friends" or "requests"
  const [showDesktopRequests, setShowDesktopRequests] = useState(true);
  const [desktopRequestsExpanded, setDesktopRequestsExpanded] = useState(true);
  const [tripInvitesExpanded, setTripInvitesExpanded] = useState(false);
  const [tripsActiveTab, setTripsActiveTab] = useState("trips"); // "trips" or "invitations"
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [showCancelPlanModal, setShowCancelPlanModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
  const [showProfileManager, setShowProfileManager] = useState(false);

  // Modal states
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFaceProfileModal, setShowFaceProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFaceProfileManageModal, setShowFaceProfileManageModal] =
    useState(false);

  // NEW: Functions to handle trip viewing
  const handleViewTrip = (tripId) => {
    setCurrentView("trip");
    setSelectedTripId(tripId);
    setTripsDropdownOpen(false);
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleBackToDashboard = async () => {
    setCurrentView("home");
    setSelectedTripId(null);

    // Refresh trips when going back to dashboard
    try {
      const updatedTrips = await getUserTrips(currentUser.uid); // Use regular getUserTrips
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error refreshing trips:", error);
    }

    // Close sidebar on mobile when going back
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // NEW: Handle trips dropdown
  const toggleTripsDropdown = () => {
    setTripsDropdownOpen(!tripsDropdownOpen);
    setVisibleTripsCount(5); // Reset to show first 5 trips
  };

  // NEW: Handle filter dropdown
  const getFilterLabel = (value) => {
    switch (value) {
      case "all":
        return "📁 All Trips";
      case "upcoming":
        return "📅 Upcoming";
      case "recent":
        return "🕒 Recent";
      case "past":
        return "✅ Past";
      default:
        return "📁 All Trips";
    }
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
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(event.target)
      ) {
        setShowMobileUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownOpen && !event.target.closest(".filter-dropdown")) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterDropdownOpen]);

  // Delete account state
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setShowError("Please type 'DELETE' to confirm");
      setTimeout(() => setShowError(null), 3000);
      return;
    }

    setIsDeleting(true);

    try {
      setShowSuccess("Deleting account... This may take a moment.");
      setTimeout(() => setShowSuccess(null), 5000);
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
    {
      id: "friends",
      name: "Friends",
      icon: UserGroupIcon,
      badge: pendingRequests.length,
      hasNotification: pendingRequests.length > 0,
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

  // Close mobile user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(event.target)
      ) {
        setShowMobileUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Delete current face profile
  const deleteCurrentProfile = async () => {
    toast(
      (t) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Delete Face Profile?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              This will permanently remove your face profile and all recognition
              data. You can always create a new one later.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  setIsManagingProfile(true);

                  try {
                    // Delete operations (same as before)
                    deleteFaceProfile(currentUser.uid);

                    try {
                      await deleteFaceProfileFromStorage(currentUser.uid);
                      console.log(
                        "✅ Face profile deleted from Firebase Storage"
                      );
                    } catch (storageError) {
                      console.warn(
                        "⚠️ Could not delete from Firebase Storage:",
                        storageError
                      );
                    }

                    setHasProfile(false);
                    setProfile(null);
                    setProfilePhotos([]);
                    setShowProfileManagement(false);

                    toast.success("🗑️ Face profile deleted successfully");
                  } catch (error) {
                    console.error("Failed to delete profile:", error);
                    toast.error("Failed to delete profile: " + error.message);
                  } finally {
                    setIsManagingProfile(false);
                  }
                }}
                className="px-6 py-3 bg-red-500 text-white text-sm rounded-xl shadow hover:bg-red-600 font-semibold transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl shadow hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition-colors"
              >
                Keep Profile
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 15000,
        id: "delete-profile-confirmation",
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      }
    );
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
        console.log("🔄 Loading dashboard data for user:", currentUser.uid);

        // Load data in parallel but use different approach for trips
        const [userProfile, userFriends, friendRequests, invites] =
          await Promise.all([
            getUserProfile(currentUser.uid),
            getFriends(currentUser.uid),
            getPendingFriendRequests(currentUser.uid),
            getPendingInvites(currentUser.uid),
          ]);

        console.log("👤 User profile:", userProfile);
        console.log("👥 Friends:", userFriends);
        console.log("📬 Friend requests:", friendRequests);
        console.log("🎫 Trip invites:", invites);

        // Load trips with fallback approach
        console.log("📋 Loading trips...");
        let userTrips = [];

        try {
          // First try the regular getUserTrips function
          userTrips = await getUserTrips(currentUser.uid);
          console.log("📋 getUserTrips result:", userTrips);

          // If no trips found, try alternative approach
          if (userTrips.length === 0) {
            console.log(
              "🔍 No trips from getUserTrips, trying direct queries..."
            );

            // Import Firebase functions directly
            const { collection, query, where, getDocs } = await import(
              "firebase/firestore"
            );
            const { db } = await import("../services/firebase/config");

            console.log("🔍 Querying trips where user is creator...");
            const createdTripsQuery = query(
              collection(db, "trips"),
              where("createdBy", "==", currentUser.uid)
            );

            console.log("🔍 Querying trips where user is member...");
            const memberTripsQuery = query(
              collection(db, "trips"),
              where("members", "array-contains", currentUser.uid)
            );

            const [createdSnapshot, memberSnapshot] = await Promise.all([
              getDocs(createdTripsQuery),
              getDocs(memberTripsQuery),
            ]);

            console.log("📋 Created trips found:", createdSnapshot.size);
            console.log("📋 Member trips found:", memberSnapshot.size);

            const foundTripIds = new Set();
            const foundTrips = [];

            createdSnapshot.forEach((doc) => {
              const trip = { id: doc.id, ...doc.data() };
              foundTrips.push(trip);
              foundTripIds.add(doc.id);
              console.log("📋 Found created trip:", doc.id, trip.name);
            });

            memberSnapshot.forEach((doc) => {
              if (!foundTripIds.has(doc.id)) {
                const trip = { id: doc.id, ...doc.data() };
                foundTrips.push(trip);
                foundTripIds.add(doc.id);
                console.log("📋 Found member trip:", doc.id, trip.name);
              }
            });

            userTrips = foundTrips;

            // Update user's trips array if we found trips
            if (foundTripIds.size > 0) {
              console.log("🔄 Updating user's trips array...");
              const { doc, updateDoc } = await import("firebase/firestore");

              try {
                const userRef = doc(db, "users", currentUser.uid);
                await updateDoc(userRef, {
                  trips: Array.from(foundTripIds),
                  updatedAt: new Date().toISOString(),
                });
                console.log("✅ User trips array updated successfully!");
              } catch (updateError) {
                console.warn(
                  "⚠️ Could not update user trips array:",
                  updateError
                );
              }
            }
          }
        } catch (tripsError) {
          console.error("❌ Error loading trips:", tripsError);
          userTrips = []; // Fallback to empty array
        }

        console.log("📋 Final trips result:", userTrips);

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
        console.error("❌ Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
        setShowError("Failed to load dashboard data");
        setTimeout(() => setShowError(null), 4000);
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
              photoURL: senderSnap.exists() ? senderSnap.data().photoURL : null,
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
      setShowLogoutModal(false);

      // Nice transition effect
      document.body.style.transition =
        "opacity 0.6s ease-out, transform 0.6s ease-out";
      document.body.style.opacity = "0";
      document.body.style.transform = "scale(0.95)";

      // Wait for animation, then logout and navigate
      setTimeout(async () => {
        try {
          // Clear all state first
          setTrips([]);
          setFriends([]);
          setPendingRequests([]);
          setTripInvites([]);
          setUserData(null);

          // Then logout
          await logout();

          // Navigate immediately after logout
          navigate("/");

          // Reset body styles after navigation
          setTimeout(() => {
            document.body.style.opacity = "1";
            document.body.style.transform = "scale(1)";
          }, 100);
        } catch (logoutError) {
          // Even if logout has errors, still navigate away
          console.log("Logout completed with expected Firebase cleanup errors");
          navigate("/");
          setTimeout(() => {
            document.body.style.opacity = "1";
            document.body.style.transform = "scale(1)";
          }, 100);
        }
      }, 600);
    } catch (error) {
      console.error("Failed to log out:", error);
      // Reset styles on error
      document.body.style.opacity = "1";
      document.body.style.transform = "scale(1)";
      // Still try to navigate
      navigate("/");
    }
  };

  const handleProfileLoaded = (loaded) => {
    setHasProfile(loaded);
    if (loaded) {
      setShowProfileManager(false);
      setProfilePhotos(getProfilePhotos(currentUser.uid));
      setShowSuccess("Face profile created successfully!");
      setTimeout(() => setShowSuccess(null), 4000);
    }
  };

  // Open User Profile Modal
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [viewingFromAddFriend, setViewingFromAddFriend] = useState(false);
  const [preservedSearchInput, setPreservedSearchInput] = useState("");
  const [preservedFoundUser, setPreservedFoundUser] = useState(null);

  const handleOpenUserProfile = async (uid, fromAddFriend = false) => {
    // Preserve search state if coming from AddFriend
    if (fromAddFriend) {
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

    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUserProfile({ uid, ...userData });
        setViewingFromAddFriend(fromAddFriend);
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
      setShowSuccess("Friend request accepted");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setShowError("Failed to accept friend request");
      setTimeout(() => setShowError(null), 4000);
    }
  };

  const handleReject = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      const updatedPending = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(updatedPending);
      setShowSuccess("Friend request declined");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setShowError("Failed to decline friend request");
      setTimeout(() => setShowError(null), 4000);
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
              setShowSuccess("Trip invitation accepted");
              setTimeout(() => setShowSuccess(null), 3000);
            },
            type: "accept",
          },
          {
            label: "Decline",
            action: async () => {
              await declineTripInvite(invite.id);
              setTripInvites((prev) => prev.filter((i) => i.id !== invite.id));
              setShowSuccess("Trip invitation declined");
              setTimeout(() => setShowSuccess(null), 3000);
            },
            type: "decline",
          },
        ],
      })),
    ];

    return (
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto max-w-[calc(100vw-1rem)] mr-2 sm:mr-0">
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

  const TripsSection = () => (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
            style={{ fontSize: window.innerWidth <= 320 ? "0.99rem" : "" }}
          >
            My Trips
          </h1>
          <p
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1"
            style={{ fontSize: window.innerWidth <= 320 ? "0.6rem" : "" }}
          >
            Organize and manage your travel memories
          </p>
        </div>
        {/* Create Trip button - only show when on trips tab */}
        {tripsActiveTab === "trips" && (
          <button
            onClick={async () => {
              // Check trip limit before opening modal
              const canCreate = await canUserCreateTrip(currentUser.uid);
              if (!canCreate) {
                const currentCount = await getUserTripCount(currentUser.uid);
                setShowError(
                  `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
                );
                setTimeout(() => setShowError(null), 6000);
                return;
              }
              setShowCreateTripModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 py-2 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0"
            style={{ fontSize: window.innerWidth <= 320 ? "0.55rem" : "" }}
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              Create Trip ({trips.length}/{MAX_TRIPS_PER_USER})
            </span>
            <span className="sm:hidden">
              Create ({trips.length}/{MAX_TRIPS_PER_USER})
            </span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div
        className="lg:hidden mb-6"
        style={{ fontSize: window.innerWidth <= 320 ? "0.65rem" : "" }}
      >
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
          <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-hidden">
            {/* Background slider */}
            <div
              className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-500 ease-out"
              style={{
                transform:
                  tripsActiveTab === "trips"
                    ? "translateX(0%)"
                    : "translateX(100%)",
              }}
            />

            {/* Tab buttons */}
            <button
              onClick={() => setTripsActiveTab("trips")}
              className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                tripsActiveTab === "trips"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MapIcon className="w-4 h-4" />
                <span>Trips</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tripsActiveTab === "trips"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {trips.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setTripsActiveTab("invitations")}
              className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                tripsActiveTab === "invitations"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BellIcon className="w-4 h-4" />
                <span>Invites</span>
                {tripInvites.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tripsActiveTab === "invitations"
                        ? "bg-white/20 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {tripInvites.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters - only show on desktop or when on trips tab on mobile */}
      {(tripsActiveTab === "trips" || window.innerWidth >= 1024) && (
        <div
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-4 lg:p-6 border border-white/20 dark:border-gray-700/50"
          style={{ fontSize: window.innerWidth <= 320 ? "0.7rem" : "" }}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={useCallback(
                  (e) => {
                    setSearchTerm(e.target.value);
                    setTimeout(() => {
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }, 0);
                  },
                  [setSearchTerm]
                )}
                className="w-full pl-8 pr-3 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
            </div>

            <div className="relative w-full sm:min-w-[140px] sm:w-auto filter-dropdown">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="w-full px-3 py-2 sm:py-3 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white cursor-pointer text-sm font-medium shadow-sm hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-200 flex items-center justify-between"
              >
                <span>{getFilterLabel(dateFilter)}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    filterDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Mobile dropdown - pushes content down */}
              <div
                className={`sm:hidden overflow-hidden transition-all duration-1000 ease-in-out ${
                  filterDropdownOpen
                    ? "max-h-48 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                  {[
                    { value: "all", label: "📁 All Trips" },
                    { value: "upcoming", label: "📅 Upcoming" },
                    { value: "recent", label: "🕒 Recent" },
                    { value: "past", label: "✅ Past" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateFilter(option.value);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                        dateFilter === option.value
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop dropdown - overlays */}
              {filterDropdownOpen && (
                <div className="hidden sm:block absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
                  {[
                    { value: "all", label: "📁 All Trips" },
                    { value: "upcoming", label: "📅 Upcoming" },
                    { value: "recent", label: "🕒 Recent" },
                    { value: "past", label: "✅ Past" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateFilter(option.value);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                        dateFilter === option.value
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Trip Invitations Section */}
      <div className="hidden lg:block">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Trip Invitations
              {tripInvites.length > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {tripInvites.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setTripInvitesExpanded(!tripInvitesExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {tripInvitesExpanded ? (
                <ChevronDownIcon className="w-5 h-5 transition-transform duration-300" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              tripInvitesExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6">
              {tripInvites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No pending trip invitations
                  </p>
                </div>
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
                            setShowSuccess("Trip invitation accepted");
                            setTimeout(() => setShowSuccess(null), 3000);
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
                            setShowSuccess("Trip invitation declined");
                            setTimeout(() => setShowSuccess(null), 3000);
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
        </div>
      </div>

      {/* Mobile: Show content based on active tab */}
      <div className="lg:hidden">
        {tripsActiveTab === "trips" ? (
          /* Trips Grid for Mobile */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    onClick={async () => {
                      const canCreate = await canUserCreateTrip(
                        currentUser.uid
                      );
                      if (!canCreate) {
                        const currentCount = await getUserTripCount(
                          currentUser.uid
                        );
                        setShowError(
                          `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
                        );
                        setTimeout(() => setShowError(null), 6000);
                        return;
                      }
                      setShowCreateTripModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Create Your First Trip
                  </button>
                )}
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onViewTrip={handleViewTrip}
                />
              ))
            )}
          </div>
        ) : (
          /* Trip Invitations for Mobile */
          <div className="space-y-4">
            {tripInvites.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BellIcon className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  No trip invitations
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  When someone invites you to a trip, it will appear here
                </p>
              </div>
            ) : (
              tripInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                      {invite.tripName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Invited by {invite.inviterName}
                    </p>
                  </div>
                  <div className="flex gap-3">
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
                        setShowSuccess("Trip invitation accepted");
                        setTimeout(() => setShowSuccess(null), 3000);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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
                        setShowSuccess("Trip invitation declined");
                        setTimeout(() => setShowSuccess(null), 3000);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Desktop: Show trips grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
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
    </div>
  );

  const FriendsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
            style={{ fontSize: window.innerWidth <= 320 ? "0.85rem" : "" }}
          >
            My Friends
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">
            Connect and share memories with friends
          </p>
        </div>
        {/* Add Friend button - only show when on friends tab */}
        {friendsActiveTab === "friends" && (
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-1 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Friend</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden mb-6">
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
          <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {/* Background slider */}
            <div
              className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-500 ease-out"
              style={{
                transform:
                  friendsActiveTab === "friends"
                    ? "translateX(0%)"
                    : "translateX(100%)",
              }}
            />

            {/* Tab buttons */}
            <button
              onClick={() => setFriendsActiveTab("friends")}
              className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                friendsActiveTab === "friends"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserGroupIcon className="w-4 h-4" />
                <span>Friends</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    friendsActiveTab === "friends"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {friends.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setFriendsActiveTab("requests")}
              className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                friendsActiveTab === "requests"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BellIcon className="w-4 h-4" />
                <span>Requests</span>
                {pendingRequests.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      friendsActiveTab === "requests"
                        ? "bg-white/20 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {pendingRequests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Friend Requests Section */}
      {showDesktopRequests && (
        <div className="hidden lg:block mb-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Friend Requests
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setDesktopRequestsExpanded(!desktopRequestsExpanded)
                }
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {desktopRequestsExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 transition-transform duration-300" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              desktopRequestsExpanded
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No pending friend requests
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            request.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {request.displayName || request.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            wants to be your friend
                          </p>
                        </div>
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
          </div>
        </div>
      )}

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Mobile: Show content based on active tab */}
        <div className="lg:hidden">
          {friendsActiveTab === "friends" ? (
            // Your existing friends content
            friends.length === 0 ? (
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
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
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
            )
          ) : // Friend Requests for mobile
          pendingRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BellIcon className="w-12 h-12 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No friend requests
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                When someone sends you a friend request, it will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {request.displayName || request.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        wants to be your friend
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => handleAccept(request.from)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request.from)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: Show only friends (requests are above) */}
        <div className="hidden lg:block">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  );

  const SettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Account Information
          </h2>
        </div>

        {/* Profile Section - Updated for better responsiveness */}
        <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4 sm:gap-6">
            {/* Profile Image - Larger photo, same container */}
            <div className="relative flex-shrink-0 group">
              <div className="relative">
                <img
                  src={
                    userData?.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 cursor-pointer"
                />

                {/* Interactive overlay on hover */}
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>

                {/* Online status indicator - positioned half on background, half on photo */}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-green-500 border-3 sm:border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Profile Info - Better spacing and responsive text */}
            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
                  {userData?.displayName || currentUser?.displayName || "User"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg mt-1 break-all sm:break-normal">
                  {userData?.email || currentUser?.email}
                </p>
              </div>

              {/* Edit Profile Button - Full width on mobile */}
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Settings Grid - Modern responsive design */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Notifications */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                  Notifications
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Choose which notifications you'd like to receive
              </p>

              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                    ),
                    label: "Email Notifications",
                    defaultChecked: true,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                        <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    ),
                    label: "Trip Updates",
                    defaultChecked: true,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
                        <UserGroupIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    ),
                    label: "Friend Requests",
                    defaultChecked: false,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                        <CameraIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    ),
                    label: "Photo Recognition",
                    defaultChecked: true,
                  },
                ].map((item, index) => (
                  <div key={index} className="group">
                    <label className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-600/30">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        {item.icon}
                        <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={item.defaultChecked}
                        />
                        <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 transition-all duration-300 shadow-inner"></div>
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                  Privacy Settings
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Control your privacy and data sharing preferences
              </p>

              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                        <UserCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    ),
                    label: "Public Profile",
                    defaultChecked: true,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      </div>
                    ),
                    label: "Face Recognition",
                    defaultChecked: false,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <MagnifyingGlassIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    ),
                    label: "Search Visibility",
                    defaultChecked: true,
                  },
                  {
                    icon: (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ),
                    label: "Data Sharing",
                    defaultChecked: false,
                  },
                ].map((item, index) => (
                  <div key={index} className="group">
                    <label className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-600/30">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        {item.icon}
                        <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={item.defaultChecked}
                        />
                        <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 transition-all duration-300 shadow-inner"></div>
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Profile Management - Better responsive spacing */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-1 mb-3">
          <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Face Profile
          </h2>
        </div>
        {!hasProfile ? (
          <div className="text-center py-6 sm:py-8 lg:py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8 shadow-lg">
              <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">
              Create Your Face Profile
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-5 lg:mb-6 max-w-md mx-auto px-4">
              Upload 2-10 clear photos of yourself to enable automatic photo
              recognition in your trips
            </p>
            <button
              onClick={() => setShowFaceProfileModal(true)}
              disabled={isLoadingProfile}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base lg:text-lg min-h-[48px] sm:min-h-[56px]"
            >
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {isLoadingProfile ? "Loading..." : "Setup Face Profile"}
            </button>
          </div>
        ) : (
          <div>
            {/* Profile Status Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-300 mb-1">
                    {profile?.metadata?.method === "guided"
                      ? "🎯 Smart Face Scan Active"
                      : "Photo Upload Profile Active"}
                  </h3>
                  <p className="text-green-600 dark:text-green-400 text-sm sm:text-base">
                    {profilePhotos.length} photos • Enhanced recognition ready
                  </p>
                </div>
              </div>

              {/* Method Description */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 sm:p-4 mb-4">
                {profile?.metadata?.method === "guided" ? (
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✨</span>
                    <div>
                      <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium mb-1">
                        AI-Guided Face Scan
                      </p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                        Your profile was created using our smart face scanning
                        technology for maximum accuracy in photo recognition.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📤</span>
                      <div>
                        <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium mb-1">
                          Photo Upload Profile
                        </p>
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                          Your profile was created from uploaded photos. Works
                          great for photo recognition!
                        </p>
                      </div>
                    </div>

                    {/* Recommendation for upload method */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <div>
                          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                            Pro Tip: Consider using Smart Face Scan for even
                            better accuracy!
                          </p>
                          <button
                            onClick={() => setShowFaceProfileModal(true)}
                            className="mt-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium underline"
                          >
                            Switch to Smart Face Scan →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFaceProfileManageModal(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Manage & Set Up Face Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Subscription & Billing Section */}
      <div
        data-section="settings"
        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50"
      >
        {" "}
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Subscription & Billing
          </h2>
        </div>
        {(() => {
          // Get user's current plan (check localStorage first, then fallback to default)
          const storedPlan = localStorage.getItem("userPlan");
          const userPlan = storedPlan
            ? JSON.parse(storedPlan)
            : { plan: "free", billing: "monthly" };
          const currentUserPlan = userPlan.plan;
          const currentBilling = userPlan.billing;
          const purchaseDate = userPlan.purchaseDate;

          // Plan configurations
          const planConfigs = {
            free: {
              name: "Free Plan",
              icon: "F",
              gradient: "from-indigo-500 to-purple-600",
              storage: "2GB",
              photos: "500",
              price: "$0",
              billing: "Forever",
              features: [
                "Basic AI recognition",
                "2 trip albums",
                "Share with 3 friends",
              ],
            },
            pro: {
              name: "Pro Plan",
              icon: "P",
              gradient: "from-blue-500 to-indigo-600",
              storage: "50GB",
              photos: "10,000",
              price: currentBilling === "yearly" ? "$99.99" : "$9.99",
              billing: currentBilling === "yearly" ? "Yearly" : "Monthly",
              features: [
                "Advanced AI recognition",
                "Unlimited albums",
                "Share with 20 friends",
                "Priority support",
              ],
            },
            family: {
              name: "Family Plan",
              icon: "F",
              gradient: "from-purple-500 to-pink-600",
              storage: "250GB",
              photos: "50,000",
              price: currentBilling === "yearly" ? "$199.99" : "$19.99",
              billing: currentBilling === "yearly" ? "Yearly" : "Monthly",
              features: [
                "Premium AI recognition",
                "Unlimited albums",
                "Unlimited sharing",
                "24/7 support",
                "Family management",
              ],
            },
          };

          const currentPlanConfig = planConfigs[currentUserPlan];
          const isPaidPlan = currentUserPlan !== "free";

          // Calculate expiry date
          const getExpiryDate = () => {
            if (!isPaidPlan || !purchaseDate) return null;
            const purchase = new Date(purchaseDate);
            const expiry = new Date(purchase);

            if (currentBilling === "yearly") {
              expiry.setFullYear(expiry.getFullYear() + 1);
            } else {
              expiry.setMonth(expiry.getMonth() + 1);
            }

            return expiry.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          };

          const expiryDate = getExpiryDate();

          return (
            <>
              {/* Current Plan Card - Unified Design */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200/50 dark:border-gray-700/50">
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${currentPlanConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {currentPlanConfig.icon}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                          {currentPlanConfig.name}
                        </h3>
                        {isPaidPlan && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            ⭐ PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {isPaidPlan
                          ? "Premium features unlocked"
                          : "Perfect for getting started"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Active
                    </span>
                  </div>
                </div>

                {/* Plan Details Grid + Plan Dates */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {/* Original 4 blocks */}
                  <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                      {currentPlanConfig.storage}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Storage
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                      {currentPlanConfig.photos}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Photos
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                      {currentPlanConfig.price}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {currentPlanConfig.billing}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                      {isPaidPlan ? "14 days" : "∞"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {isPaidPlan ? "Trial" : "Free"}
                    </p>
                  </div>

                  {/* Plan Dates - Text lines with same height as blocks */}
                  <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-4 sm:p-6 flex flex-col justify-center space-y-2">
                    <div className="text-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Plan started:{" "}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">
                        {purchaseDate
                          ? new Date(purchaseDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : userData?.createdAt
                          ? new Date(userData.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Recently"}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Plan expires:{" "}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">
                        {isPaidPlan && expiryDate
                          ? new Date(expiryDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Storage Usage
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {hasProfile
                        ? `${profilePhotos.length} photos`
                        : "0 photos"}{" "}
                      used
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{
                        width: `${Math.min(
                          ((hasProfile ? profilePhotos.length : 0) /
                            parseInt(
                              currentPlanConfig.photos.replace(",", "")
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {parseInt(currentPlanConfig.photos.replace(",", "")) -
                      (hasProfile ? profilePhotos.length : 0)}{" "}
                    photos remaining
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!isPaidPlan ? (
                    <button
                      onClick={() => {
                        document.body.style.transition =
                          "opacity 0.4s ease-out";
                        document.body.style.opacity = "0";
                        setTimeout(() => {
                          document.body.style.opacity = "1";
                          navigate("/pricing");
                        }, 400);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Upgrade to Pro - Get 20x More Storage 🚀
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        document.body.style.transition =
                          "opacity 0.4s ease-out";
                        document.body.style.opacity = "0";
                        setTimeout(() => {
                          document.body.style.opacity = "1";
                          navigate("/pricing");
                        }, 400);
                      }}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Compare All Plans
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowUsageModal(true)}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
                    >
                      <span>📊</span>
                      <span>Usage Details</span>
                    </button>
                    <button
                      onClick={() => setShowBillingHistoryModal(true)}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
                    >
                      <span>💳</span>
                      <span>Billing History</span>
                    </button>
                  </div>

                  {/* Cancel Plan Button for Paid Plans */}
                  {isPaidPlan && (
                    <button
                      onClick={() => setShowCancelPlanModal(true)}
                      className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-2 font-medium transition-colors"
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Plan Comparison - Only show for free users */}
              {!isPaidPlan && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
                    See What You're Missing 👀
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Pro Plan Preview */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              P
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                              Pro Plan
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Perfect for individuals
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            50GB
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Storage
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            10K
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Photos
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            $9.99
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Monthly
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2 text-sm mb-4">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Advanced AI recognition
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Unlimited albums
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Priority support
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Family Plan Preview */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              F
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                              Family Plan
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Perfect for families
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            250GB
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Storage
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            50K
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Photos
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            $19.99
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Monthly
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2 text-sm mb-4">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Premium AI recognition
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Unlimited sharing
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Family management
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        document.body.style.transition =
                          "opacity 0.4s ease-out";
                        document.body.style.opacity = "0";
                        setTimeout(() => {
                          document.body.style.opacity = "1";
                          navigate("/pricing");
                        }, 400);
                      }}
                      className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-105"
                    >
                      <span>Compare All Plans</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
        {/* Billing History Modal */}
        {showBillingHistoryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative transform transition-all duration-500 ease-out scale-100 animate-slideIn">
              <button
                onClick={() => setShowBillingHistoryModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Billing History
                </h3>
              </div>

              <div className="space-y-4">
                {(() => {
                  const storedPlan = localStorage.getItem("userPlan");
                  const userPlan = storedPlan ? JSON.parse(storedPlan) : null;

                  if (!userPlan || userPlan.plan === "free") {
                    return (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">
                          No billing history available
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                          You're currently on the free plan
                        </p>
                        <button
                          onClick={() => {
                            setShowBillingHistoryModal(false);
                            document.body.style.transition =
                              "opacity 0.4s ease-out";
                            document.body.style.opacity = "0";
                            setTimeout(() => {
                              document.body.style.opacity = "1";
                              navigate("/pricing");
                            }, 400);
                          }}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {/* Current Active Plan */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              {userPlan.plan.charAt(0).toUpperCase() +
                                userPlan.plan.slice(1)}{" "}
                              Plan
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {userPlan.billing === "yearly"
                                ? "Annual"
                                : "Monthly"}{" "}
                              Subscription
                            </p>
                          </div>
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                            Active
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 dark:text-green-300">
                            Started:{" "}
                            {new Date(
                              userPlan.purchaseDate
                            ).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-green-800 dark:text-green-200">
                            ${userPlan.price}
                            {userPlan.billing === "yearly" ? "/year" : "/month"}
                          </span>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Transaction History
                        </h4>

                        <div className="space-y-2">
                          {/* Trial Period */}
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                14-Day Free Trial
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  userPlan.purchaseDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                              $0.00
                            </span>
                          </div>

                          {/* Upcoming Payment */}
                          <div className="flex justify-between items-center py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Next Payment Due
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(() => {
                                  const nextPayment = new Date(
                                    userPlan.purchaseDate
                                  );
                                  nextPayment.setDate(
                                    nextPayment.getDate() + 14
                                  ); // Add 14 days for trial
                                  if (userPlan.billing === "yearly") {
                                    nextPayment.setFullYear(
                                      nextPayment.getFullYear() + 1
                                    );
                                  } else {
                                    nextPayment.setMonth(
                                      nextPayment.getMonth() + 1
                                    );
                                  }
                                  return nextPayment.toLocaleDateString();
                                })()}
                              </p>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              ${userPlan.price}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Payment Method
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              💳
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              •••• •••• •••• 1234
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Expires 12/28
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-4">
                        <button
                          onClick={() => {
                            // In a real app, this would generate and download a PDF
                            toast.success("Billing history downloaded!");
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download Full History
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        {/* Usage Details Modal */}
        {showUsageModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative transform transition-all duration-300 scale-100">
              <button
                onClick={() => setShowUsageModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Usage Details
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Photos Used
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {hasProfile ? profilePhotos.length : 0} /{" "}
                      {(() => {
                        const storedPlan = localStorage.getItem("userPlan");
                        const userPlan = storedPlan
                          ? JSON.parse(storedPlan)
                          : { plan: "free" };
                        const planConfigs = {
                          free: "500",
                          pro: "10,000",
                          family: "50,000",
                          custom: "Unlimited",
                        };
                        return planConfigs[userPlan.plan];
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(() => {
                          const storedPlan = localStorage.getItem("userPlan");
                          const userPlan = storedPlan
                            ? JSON.parse(storedPlan)
                            : { plan: "free" };
                          const limits = {
                            free: 500,
                            pro: 10000,
                            family: 50000,
                            custom: 999999,
                          };
                          return Math.min(
                            ((hasProfile ? profilePhotos.length : 0) /
                              limits[userPlan.plan]) *
                              100,
                            100
                          );
                        })()}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Storage Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Face Profile Photos
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {hasProfile ? profilePhotos.length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Trip Albums
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {trips.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Friends Connected
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {friends.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Cancel Plan Modal */}
        {showCancelPlanModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative transform transition-all duration-500 ease-out scale-100 animate-slideIn">
              <button
                onClick={() => setShowCancelPlanModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Cancel{" "}
                  {(() => {
                    const storedPlan = localStorage.getItem("userPlan");
                    const userPlan = storedPlan
                      ? JSON.parse(storedPlan)
                      : { plan: "free" };
                    return (
                      userPlan.plan.charAt(0).toUpperCase() +
                      userPlan.plan.slice(1)
                    );
                  })()}{" "}
                  Plan?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This action will immediately downgrade your account
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  You will immediately lose access to:
                </h4>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  {(() => {
                    const storedPlan = localStorage.getItem("userPlan");
                    const userPlan = storedPlan
                      ? JSON.parse(storedPlan)
                      : { plan: "free" };
                    const planConfigs = {
                      pro: { storage: "50GB", photos: "10,000" },
                      family: { storage: "250GB", photos: "50,000" },
                    };
                    const config = planConfigs[userPlan.plan];
                    return config
                      ? [
                          `• ${config.storage} storage (downgrade to 2GB)`,
                          `• ${config.photos} photo limit (downgrade to 500)`,
                          "• Premium AI recognition",
                          "• Priority support",
                        ]
                      : [];
                  })().map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <span>💡</span>
                  <span>
                    Your data will be preserved, but you'll be limited to free
                    plan features. You can upgrade again anytime.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelPlanModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Keep Plan
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("userPlan");
                    setShowCancelPlanModal(false);
                    toast.error(
                      "Plan canceled successfully! You've been downgraded to the free plan.",
                      {
                        style: {
                          background: "#ef4444",
                          color: "white",
                          textAlign: "center",
                          fontWeight: "600",
                          padding: "12px 20px",
                          borderRadius: "12px",
                        },
                      }
                    );
                    // Smooth scroll to top of settings section
                    setTimeout(() => {
                      const settingsElement = document.querySelector(
                        '[data-section="settings"]'
                      );
                      if (settingsElement) {
                        settingsElement.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 100);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Yes, Cancel Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data & Storage - Mobile Responsive */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Account Data
          </h2>
        </div>

        {/* Mobile-Responsive Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {trips.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Trips</p>
          </div>
          <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {friends.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Friends</p>
          </div>
          <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {hasProfile ? profilePhotos.length : 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Photos</p>
          </div>
        </div>

        {/* Mobile-Responsive Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
              Quick Actions
            </h3>
          </div>

          {/* Mobile: 2x2 Grid Layout for Actions */}
          <div className="grid grid-cols-2 gap-2 mb-2 md:grid-cols-2">
            <button className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm">
              <span>📤</span>
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-medium text-blue-800 dark:text-blue-400 transition-colors text-sm">
              <span>🔄</span>
              <span className="hidden sm:inline">Backup</span>
              <span className="sm:hidden">Backup</span>
            </button>
          </div>

          {/* Delete Account Button - Full Width */}
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 rounded-lg font-medium transition-colors text-sm"
          >
            <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">🗑</span>
            </div>
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Mobile-Specific Styling for Phone Users */}
      <style jsx>{`
        @media (max-width: 768px) {
          /* Enhanced mobile responsiveness for phone users */
          .subscription-section {
            padding: 1rem;
          }

          .plan-details-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .plan-started-expiry {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .usage-billing-buttons {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            justify-content: space-between;
            height: auto;
          }

          .usage-billing-buttons button {
            flex: 1;
            padding: 0.75rem;
            font-size: 0.875rem;
          }

          .plan-comparison-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          /* Pro and Family plan buttons side by side on mobile */
          .pro-family-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .pro-family-buttons button {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
            text-align: center;
          }
        }

        @media (min-width: 769px) {
          /* Desktop-specific overrides */
          .plan-details-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .plan-started-expiry {
            grid-template-columns: 1fr 1fr;
          }

          .usage-billing-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .plan-comparison-grid {
            grid-template-columns: 1fr 1fr;
          }

          .pro-family-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
          }
        }
      `}</style>

      {/* Enhanced Mobile Layout for Storage Blocks */}
      {(() => {
        const isMobileView = window.innerWidth < 768;
        const storedPlan = localStorage.getItem("userPlan");
        const userPlan = storedPlan ? JSON.parse(storedPlan) : { plan: "free" };
        const isPaidPlan = userPlan.plan !== "free";

        if (isMobileView) {
          return (
            <div className="mt-6 md:hidden">
              {/* Mobile: Enhanced Layout for Storage Info */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50">
                {/* Mobile: 2x2 Grid for Storage Blocks */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 text-center border border-blue-200/30 dark:border-blue-700/30">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      2GB
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Storage
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 text-center border border-green-200/30 dark:border-green-700/30">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                      500
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Photos
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 text-center border border-purple-200/30 dark:border-purple-700/30">
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                      3
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Friends
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 text-center border border-orange-200/30 dark:border-orange-700/30">
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                      ∞
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {isPaidPlan ? "Premium" : "Basic"}
                    </p>
                  </div>
                </div>

                {/* Mobile: Plan Details on Right Side */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Plan Started
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userPlan.purchaseDate
                        ? new Date(userPlan.purchaseDate).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                  {isPaidPlan && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plan Expires
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                          if (!userPlan.purchaseDate) return "N/A";
                          const expiry = new Date(userPlan.purchaseDate);
                          if (userPlan.billing === "yearly") {
                            expiry.setFullYear(expiry.getFullYear() + 1);
                          } else {
                            expiry.setMonth(expiry.getMonth() + 1);
                          }
                          return expiry.toLocaleDateString();
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile: Usage and Billing Buttons at Same Height */}
                <div className="grid grid-cols-2 gap-2 mb-3 usage-billing-buttons">
                  <button
                    onClick={() => setShowUsageModal(true)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-medium text-blue-800 dark:text-blue-400 transition-colors text-xs"
                  >
                    <span>📊</span>
                    <span>Usage</span>
                  </button>
                  <button
                    onClick={() => setShowBillingHistoryModal(true)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg font-medium text-green-800 dark:text-green-400 transition-colors text-xs"
                  >
                    <span>💳</span>
                    <span>Billing</span>
                  </button>
                </div>

                {/* Mobile: Pro and Family Plans at Same Height */}
                <div className="grid grid-cols-2 gap-2 pro-family-buttons">
                  <button
                    onClick={() => {
                      document.body.style.transition = "opacity 0.4s ease-out";
                      document.body.style.opacity = "0";
                      setTimeout(() => {
                        document.body.style.opacity = "1";
                        navigate("/billing?plan=pro");
                      }, 400);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Pro Plan
                  </button>
                  <button
                    onClick={() => {
                      document.body.style.transition = "opacity 0.4s ease-out";
                      document.body.style.opacity = "0";
                      setTimeout(() => {
                        document.body.style.opacity = "1";
                        navigate("/billing?plan=family");
                      }, 400);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Family Plan
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Enhanced Touch-Friendly Mobile Modals */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Make modals more touch-friendly on mobile */
          .modal-content {
            max-height: 90vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modal-button {
            min-height: 44px;
            padding: 12px 16px;
            font-size: 16px;
          }

          .modal-close-button {
            min-width: 44px;
            min-height: 44px;
            padding: 12px;
          }

          /* Prevent zoom on input focus */
          input,
          select,
          textarea {
            font-size: 16px !important;
          }

          /* Better touch targets for mobile */
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }

          /* Mobile-specific spacing */
          .mobile-spacing {
            padding: 1rem;
            margin: 0.5rem 0;
          }

          /* Ensure proper scroll behavior */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Enhanced responsive breakpoints */
        @media (max-width: 480px) {
          /* Extra small phones */
          .text-responsive {
            font-size: 0.875rem;
          }

          .button-responsive {
            padding: 8px 12px;
            font-size: 0.875rem;
          }

          .grid-mobile-compact {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          /* Standard mobile phones */
          .text-responsive {
            font-size: 1rem;
          }

          .button-responsive {
            padding: 10px 16px;
            font-size: 1rem;
          }

          .grid-mobile {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          /* Tablets */
          .text-responsive {
            font-size: 1.125rem;
          }

          .button-responsive {
            padding: 12px 20px;
            font-size: 1rem;
          }

          .grid-tablet {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
        }

        /* Dark mode optimizations for mobile */
        @media (max-width: 768px) {
          .dark .mobile-card {
            background: rgba(31, 41, 55, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(75, 85, 99, 0.3);
          }

          .dark .mobile-button {
            background: rgba(55, 65, 81, 0.8);
            border: 1px solid rgba(75, 85, 99, 0.3);
          }

          .dark .mobile-text {
            color: rgba(243, 244, 246, 0.9);
          }
        }
      `}</style>
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
      case "friends":
        return <FriendsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <TripsSection />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-center transition-all duration-500">
        <div className="text-center">
          {/* Site Logo */}
          <div className="relative mb-8">
            <img
              src="/groupifyLogo.png"
              alt="Groupify Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain animate-pulse drop-shadow-2xl mx-auto"
            />
            {/* Glow Effect around logo */}
            <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse mx-auto"></div>
          </div>

          {/* Brand Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-8 animate-pulse leading-relaxed pb-2">
            Groupify
          </h1>

          {/* Loading Spinner */}
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-6"></div>

          {/* Loading Text */}
          <p className="text-xl text-gray-800 dark:text-white font-medium mb-2">
            Loading your dashboard...
          </p>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Preparing your personalized experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
          isMobile
            ? "hidden"
            : sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveSection("trips");
                setCurrentView("home");
                setTripsDropdownOpen(false);
                // Close sidebar on mobile when clicking logo
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
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
                        // Close sidebar on mobile when changing sections
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
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
                              : item.hasNotification
                              ? "bg-red-500 text-white"
                              : "bg-gray-500 text-white"
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
                            ? "text-black dark:text-white hover:bg-white/20 dark:hover:bg-white/20"
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
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {sidebarOpen && !isMobile && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isMobile
            ? "h-[calc(100vh-4rem)] w-full"
            : sidebarOpen
            ? "ml-64 w-[calc(100%-16rem)] min-h-screen"
            : "w-full min-h-screen"
        } overflow-hidden`}
      >
        {" "}
        {/* Header */}
        <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-sm border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-30">
          <div className="w-full px-2 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-12 sm:h-14 w-full">
              {/* Left section - Mobile menu button */}
              <div className="flex items-center gap-4">
                {!isMobile && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Welcome message - hidden on mobile */}
                <div className="hidden sm:block lg:block">
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

                {/* Logo for mobile - shows when welcome message is hidden */}
                <button
                  onClick={() => {
                    setActiveSection("trips");
                    setCurrentView("home");
                    // Close sidebar on mobile when clicking logo
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className="sm:hidden flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <CameraIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Groupify
                  </span>
                </button>
              </div>

              {/* Center - Logo for medium screens (640px to 1024px) */}
              {(!sidebarOpen ||
                window.innerWidth < 768 ||
                window.innerWidth >= 1024) && (
                <button
                  onClick={() => {
                    setActiveSection("trips");
                    setCurrentView("home");
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className="hidden sm:flex lg:hidden items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <CameraIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Groupify
                  </span>
                </button>
              )}

              {/* Right section - Theme toggle, Notifications and user menu */}
              <div className="flex items-center gap-4">
                {/* Settings Toggle */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <CogIcon className="w-5 h-5" />
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

                {/* User avatar with mobile menu */}
                <div className="relative" ref={mobileUserMenuRef}>
                  <img
                    src={
                      userData?.photoURL ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    onClick={() => {
                      console.log("Profile clicked!");
                      setShowMobileUserMenu(!showMobileUserMenu);
                    }}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all duration-200 sm:cursor-default sm:hover:ring-0"
                  />

                  {/* Mobile User Menu - Only visible on mobile */}
                  {showMobileUserMenu && (
                    <div className="sm:hidden absolute right-0 top-10 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              userData?.photoURL ||
                              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                            }
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                          />
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {userData?.displayName ||
                                currentUser?.displayName ||
                                "User"}
                            </p>
                            <p className="text-white/70 text-xs">
                              {userData?.email || currentUser?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowMobileUserMenu(false);
                            // Add any profile view logic here if needed
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>View Profile</span>
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        <button
                          onClick={() => {
                            setShowMobileUserMenu(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div
            className={`w-full px-2 sm:px-4 lg:px-8 max-w-full ${
              isMobile ? "py-2 pb-4 h-full" : "py-2 sm:py-4"
            }`}
          >
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

      {/* Bottom Navigation Bar for Mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 z-40 h-14">
          <div className="flex justify-around items-center py-1.5">
            {[
              { id: "trips", name: "Trips", icon: MapIcon },
              { id: "friends", name: "Friends", icon: UserGroupIcon },
              { id: "settings", name: "Settings", icon: Cog6ToothIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id && currentView === "home";
              const badgeCount =
                item.id === "friends"
                  ? pendingRequests.length
                  : item.id === "trips"
                  ? tripInvites.length
                  : 0;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setCurrentView("home");
                  }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-medium">{item.name}</span>
                  {(item.id === "friends"
                    ? pendingRequests.length > 0
                    : item.id === "trips"
                    ? tripInvites.length > 0
                    : badgeCount > 0) && (
                    <span
                      className={`absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white text-indigo-600"
                          : item.id === "friends" || item.id === "trips"
                          ? "bg-red-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTripModal
        isOpen={showCreateTripModal}
        onClose={() => setShowCreateTripModal(false)}
        onTripCreated={async (newTrip) => {
          // Check if user can still create more trips
          const canCreate = await canUserCreateTrip(currentUser.uid);
          if (!canCreate) {
            const currentCount = await getUserTripCount(currentUser.uid);
            setShowError(
              `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
            );
            setTimeout(() => setShowError(null), 6000);
            return;
          }

          setTrips((prev) => [newTrip, ...prev]);
          setShowCreateTripModal(false);
          toast.success("Trip created successfully!");
        }}
      />

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlusIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Add Friend
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Search by email address
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <AddFriend
              onUserSelect={(uid) => handleOpenUserProfile(uid, true)}
              onAddFriendDirect={async (friendUid) => {
                try {
                  await sendFriendRequest(currentUser.uid, friendUid);
                  setShowSuccess("Friend request sent successfully!");
                  setTimeout(() => setShowSuccess(null), 3000);
                } catch (error) {
                  console.error("Error sending friend request:", error);
                  setShowError("Failed to send friend request");
                  setTimeout(() => setShowError(null), 3000);
                }
              }}
              preservedInput={preservedSearchInput}
              preservedUser={preservedFoundUser}
            />
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
        theme={theme}
        toggleTheme={toggleTheme}
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
          showBackButton={viewingFromAddFriend}
          onBack={() => {
            setSelectedUserProfile(null);
            setViewingFromAddFriend(false);
            setShowAddFriendModal(true);
          }}
          onAddFriend={async (uid) => {
            await sendFriendRequest(currentUser.uid, uid);
            setShowSuccess("Friend request sent");
            setTimeout(() => setShowSuccess(null), 3000);
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
            setShowSuccess("Friend request cancelled");
            setTimeout(() => setShowSuccess(null), 3000);
          }}
          onRemoveFriend={async (uid) => {
            await removeFriend(currentUser.uid, uid);
            setFriends((prev) => prev.filter((f) => f.uid !== uid));
            setShowSuccess("Friend removed");
            setTimeout(() => setShowSuccess(null), 3000);
          }}
          onClose={() => {
            setIsUserProfileOpen(false);
            setSelectedUserProfile(null);
            setViewingFromAddFriend(false);
            // Clear preserved state when closing normally
            setPreservedSearchInput("");
            setPreservedFoundUser(null);
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700/50 transform transition-all duration-500 ease-out scale-100 animate-slideIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightOnRectangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Logout Confirmation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to logout from your account?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep the existing CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>

      {/* Face Profile Management Modal */}
      {showFaceProfileManageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <div className="flex-1 text-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                    Manage & Set Up Face Profile
                  </h2>
                </div>
                <button
                  onClick={() => setShowFaceProfileManageModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-4"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {profile?.metadata?.method === "guided" ? (
                /* Smart Face Scan Profile */
                <div className="space-y-4 sm:space-y-6">
                  {/* Status Header */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 rounded-full font-semibold text-sm sm:text-base mb-3">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Smart Face Scan Active
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      AI-guided scanning with {profilePhotos.length} scan points
                    </p>
                  </div>

                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                      <div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                          {profilePhotos.length}
                        </p>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                          Scan Points
                        </p>
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                          High
                        </p>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                          Quality
                        </p>
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">
                          Active
                        </p>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                          Status
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <button
                        onClick={() => {
                          setShowFaceProfileManageModal(false);
                          setShowFaceProfileModal(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🔄</span>
                        Retake Session
                      </button>
                      <button
                        onClick={() => {
                          setShowFaceProfileManageModal(false);
                          deleteCurrentProfile();
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🗑️</span>
                        Delete Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowFaceProfileManageModal(false);
                          setShowFaceProfileModal(true);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🎯</span>
                        Switch Method
                      </button>
                    </div>
                  </div>

                  {/* Profile Preview for Guided */}
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                    <h5 className="font-bold text-gray-800 dark:text-white mb-4 text-center text-lg sm:text-xl">
                      Scan Preview
                    </h5>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
                      {profilePhotos.slice(0, 20).map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo.url}
                            alt={`Scan ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                          />
                        </div>
                      ))}
                      {profilePhotos.length > 20 && (
                        <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            +{profilePhotos.length - 20}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                      These photos were captured during your face scanning
                      session
                    </p>
                  </div>
                </div>
              ) : (
                /* Photo Upload Profile */
                <div className="space-y-4 sm:space-y-6">
                  {/* Status Header */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-4 py-2 rounded-full font-semibold text-sm sm:text-base mb-3">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      Photo Upload Profile Active
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Recognition based on {profilePhotos.length} uploaded
                      photos
                    </p>
                  </div>

                  {/* Upload Method Controls */}
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                      Add More Photos
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6">
                      Upload additional clear photos to improve recognition
                      accuracy
                    </p>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 sm:p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleProfilePhotoSelect}
                          className="w-full text-sm sm:text-base text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6 file:rounded-xl file:border-0 file:text-sm sm:file:text-base file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 file:transition-colors file:cursor-pointer cursor-pointer"
                        />
                      </div>
                      {uploadingProfilePhotos.length > 0 && (
                        <button
                          onClick={addMorePhotosToProfile}
                          disabled={isManagingProfile}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:opacity-50"
                        >
                          {isManagingProfile
                            ? "Adding Photos..."
                            : `Add ${uploadingProfilePhotos.length} Photo${
                                uploadingProfilePhotos.length > 1 ? "s" : ""
                              }`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current Photos Management - Only for uploaded photos */}
                  <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                      <h5 className="font-bold text-gray-800 dark:text-white text-lg sm:text-xl text-center sm:text-left">
                        Uploaded Photos ({profilePhotos.length})
                      </h5>
                      {selectedPhotosToRemove.length > 0 && (
                        <button
                          onClick={removeSelectedPhotos}
                          disabled={isManagingProfile}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg"
                        >
                          Remove {selectedPhotosToRemove.length} Photo
                          {selectedPhotosToRemove.length > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto">
                      {profilePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                              selectedPhotosToRemove.includes(photo.url)
                                ? "border-red-500 bg-red-100 dark:bg-red-900/30 scale-95"
                                : "border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                            }`}
                            onClick={() => togglePhotoSelection(photo.url)}
                          >
                            <img
                              src={photo.url}
                              alt="Uploaded"
                              className="w-full aspect-square object-cover"
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center transition-all ${
                                selectedPhotosToRemove.includes(photo.url)
                                  ? "bg-red-500 bg-opacity-60"
                                  : "bg-black bg-opacity-0 group-hover:bg-opacity-20"
                              }`}
                            >
                              {selectedPhotosToRemove.includes(photo.url) && (
                                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Click photos to select for removal. These are photos you
                      uploaded from your gallery.
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={optimizeCurrentProfile}
                      disabled={isManagingProfile}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">⚡</span>
                      {isManagingProfile ? "Optimizing..." : "Optimize Photos"}
                    </button>
                    <button
                      onClick={() => {
                        setShowFaceProfileManageModal(false);
                        setShowFaceProfileModal(true);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">🎯</span>
                      Switch to Smart Scan
                    </button>
                    <button
                      onClick={() => {
                        setShowFaceProfileManageModal(false);
                        deleteCurrentProfile();
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">🗑️</span>
                      Delete Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsive Custom Success/Error Messages */}
      {showSuccess && (
        <div className="fixed top-4 inset-x-0 flex justify-center z-50 px-4 sm:top-8 sm:inset-x-auto sm:right-8 sm:justify-start">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl animate-bounce backdrop-blur-lg border border-green-400/30 max-w-[90vw] sm:max-w-sm">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">
                {showSuccess}
              </span>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed top-4 inset-x-0 flex justify-center z-50 px-4 sm:top-8 sm:inset-x-auto sm:right-8 sm:justify-start">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl animate-bounce backdrop-blur-lg border border-red-400/30 max-w-[90vw] sm:max-w-sm">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">
                {showError}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

