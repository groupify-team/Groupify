import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FaceProfileModal from "../components/faceProfile/FaceProfileModal";
import AddFriend from "../components/friends/AddFriend";
import EditProfileModal from "../components/profile/EditProfileModal";
import UserProfileModal from "../components/profile/UserProfileModal";
import SettingsModal from "../components/settings/SettingsModal";
import CreateTripModal from "../components/trips/CreateTripModal";
import TripCard from "../components/trips/TripCard";
import TripDetailView from "../components/trips/TripDetailView";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { UserIcon } from "@heroicons/react/24/outline";

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
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
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

  const handleBackToDashboard = () => {
    setCurrentView("home");
    setSelectedTripId(null);
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

  // Delete entire profile
  const deleteCurrentProfile = async () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="text-sm text-gray-800 font-medium">
            Delete your face profile?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This action cannot be undone.
          </p>
          <div className="mt-3 flex justify-center gap-3">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setIsManagingProfile(true);

                try {
                  // 1. Delete from memory
                  deleteFaceProfile(currentUser.uid);

                  // 2. Delete from Firebase Storage
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

                  // 3. Update state
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
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-md shadow hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md shadow hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        id: "delete-profile-confirmation",
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
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 z-50 max-h-96 overflow-y-auto max-w-[calc(100vw-1rem)] mr-2 sm:mr-0">
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            My Trips
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">
            Organize and manage your travel memories
          </p>
        </div>
        {/* Create Trip button - only show when on trips tab */}
        {tripsActiveTab === "trips" && (
          <button
            onClick={() => setShowCreateTripModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Trip</span>
            <span className="sm:hidden">Create</span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden mb-6">
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
          <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {/* Background slider */}
            <div
              className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md"
              style={{
                transform:
                  tripsActiveTab === "trips"
                    ? "translateX(0%)"
                    : "translateX(100%)",
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
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
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-4 lg:p-6 border border-white/20 dark:border-gray-700/50">
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
                    onClick={() => setShowCreateTripModal(true)}
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
                        toast.success("Trip invitation accepted");
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
                        toast.success("Trip invitation declined");
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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            My Friends
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">
            Connect and share memories with friends
          </p>
        </div>
        {/* Add Friend button - only show when on friends tab */}
        {friendsActiveTab === "friends" && (
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
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
              className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md"
              style={{
                transform:
                  friendsActiveTab === "friends"
                    ? "translateX(0%)"
                    : "translateX(100%)",
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
          Account Information
        </h2>

        {/* Profile Section - Updated for better responsiveness */}
        <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4 sm:gap-6">
            {/* Profile Image - Larger and more responsive */}
            <div className="relative flex-shrink-0">
              <img
                src={
                  userData?.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="Profile"
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
              />
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-green-500 border-2 sm:border-3 lg:border-4 border-white dark:border-gray-800 rounded-full shadow-lg"></div>{" "}
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
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Settings Grid - Better responsive layout */}
        <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-8">
          {/* Preferences - Improved spacing and touch targets */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg sm:text-xl font-bold">
                  ⚙️
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Notification Preferences
              </h4>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 text-sm sm:text-base">
                      📧
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Email notifications
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                  defaultChecked
                />
              </label>

              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 text-sm sm:text-base">
                      ✈️
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Trip invitations
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                  defaultChecked
                />
              </label>

              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 dark:text-orange-400 text-sm sm:text-base">
                      👥
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Friend requests
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                />
              </label>
            </div>
          </div>

          {/* Privacy - Improved spacing and touch targets */}
          <div className="bg-green-50/50 dark:bg-green-900/20 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg sm:text-xl font-bold">
                  🔒
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Privacy Settings
              </h4>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                      👤
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Profile visible to friends
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                  defaultChecked
                />
              </label>

              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 text-sm sm:text-base">
                      🔍
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Allow face recognition
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                />
              </label>

              <label className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group min-h-[60px] sm:min-h-[68px]">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 text-sm sm:text-base">
                      🌐
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium truncate">
                    Show in search results
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 ml-3"
                  defaultChecked
                />
              </label>
            </div>
          </div>
        </div>

        {/* Account Actions - Better responsive layout */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
          <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">⚡</span>
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl sm:rounded-2xl font-medium text-gray-800 dark:text-gray-200 min-h-[64px] sm:min-h-[72px] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <span className="text-xl sm:text-2xl">📤</span>
              <span className="text-sm sm:text-base font-semibold">
                Export My Data
              </span>
            </button>
            <button className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-xl sm:rounded-2xl font-medium text-blue-800 dark:text-blue-400 min-h-[64px] sm:min-h-[72px] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <span className="text-xl sm:text-2xl">🔄</span>
              <span className="text-sm sm:text-base font-semibold">
                Backup Settings
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Face Profile Management - Better responsive spacing */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
          Face Profile
        </h2>

        {!hasProfile ? (
          <div className="text-center py-6 sm:py-8 lg:py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8 shadow-lg">
              <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">
              Create Your Face Profile
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 lg:mb-10 max-w-md mx-auto px-4">
              Upload 2-10 clear photos of yourself to enable automatic photo
              recognition in your trips
            </p>
            <button
              onClick={() => setShowFaceProfileModal(true)}
              disabled={isLoadingProfile}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base lg:text-lg min-h-[48px] sm:min-h-[56px]"
            >
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {isLoadingProfile ? "Loading..." : "Setup Face Profile"}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-100 dark:bg-green-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                    Face Profile Active
                  </h3>
                  <p className="text-green-600 dark:text-green-400 text-sm sm:text-base lg:text-lg">
                    {profilePhotos.length} photos • Ready for automatic
                    recognition
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 self-start sm:self-auto">
                <button
                  onClick={() =>
                    setShowProfileManagement(!showProfileManagement)
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {showProfileManagement ? "Hide" : "Manage"}
                </button>
                <button
                  onClick={deleteCurrentProfile}
                  disabled={isManagingProfile}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-lg hover:shadow-xl"
                  title="Delete Face Profile"
                >
                  <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </div>

            {/* Profile Management Options */}
            {showProfileManagement && (
              <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <button
                    onClick={optimizeCurrentProfile}
                    disabled={isManagingProfile}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    {isManagingProfile ? "Optimizing..." : "Optimize Profile"}
                  </button>
                  <button
                    onClick={() => setShowFaceProfileModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Add More Photos
                  </button>
                </div>

                {/* Add Photos Section */}
                <div className="mb-6">
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Add More Photos
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleProfilePhotoSelect}
                      className="flex-1 text-sm sm:text-base text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                    />
                    {uploadingProfilePhotos.length > 0 && (
                      <button
                        onClick={addMorePhotosToProfile}
                        disabled={isManagingProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium disabled:opacity-50 transition-colors text-sm sm:text-base whitespace-nowrap shadow-lg hover:shadow-xl"
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
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Profile Photos ({profilePhotos.length})
                    </label>
                    {selectedPhotosToRemove.length > 0 && (
                      <button
                        onClick={removeSelectedPhotos}
                        disabled={isManagingProfile}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm sm:text-base font-medium disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
                      >
                        {isManagingProfile
                          ? "Removing..."
                          : `Remove ${selectedPhotosToRemove.length}`}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 max-h-60 sm:max-h-80 overflow-y-auto">
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
                            className="w-full h-20 sm:h-24 lg:h-28 object-cover"
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                              selectedPhotosToRemove.includes(photo.url)
                                ? "bg-red-500 bg-opacity-60"
                                : "bg-black bg-opacity-0 group-hover:bg-opacity-20"
                            }`}
                          >
                            {selectedPhotosToRemove.includes(photo.url) && (
                              <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-white text-xs sm:text-sm font-bold ${
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

            {/* Profile Photos Grid Preview */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 mb-6">
              {profilePhotos.slice(0, 8).map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Profile ${index + 1}`}
                    className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  />
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                    <span
                      className={`text-xs sm:text-sm font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-white shadow-lg ${
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
              {profilePhotos.length > 8 && (
                <div className="w-full h-16 sm:h-20 md:h-24 lg:h-28 bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-lg">
                  <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-600 dark:text-gray-400">
                    +{profilePhotos.length - 8}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data & Storage - Better responsive layout */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          Data & Storage
        </h2>

        {/* Stats Grid - Better responsive spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="text-center p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
              {trips.length}
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
              Total Trips
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
              {friends.length}
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
              Friends
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
              {hasProfile ? profilePhotos.length : 0}
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
              Profile Photos
            </p>
          </div>
        </div>

        {/* Action Buttons - Better responsive layout */}
        <div className="space-y-3 sm:space-y-4">
          <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 sm:py-4 lg:py-5 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 min-h-[56px] sm:min-h-[64px]">
            <span className="text-xl sm:text-2xl">📤</span>
            <span className="font-semibold">Export My Data</span>
          </button>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 py-3 sm:py-4 lg:py-5 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 min-h-[56px] sm:min-h-[64px]"
          >
            <span className="text-xl sm:text-2xl">🗑️</span>
            <span className="font-semibold">Delete Account</span>
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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
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
            onClick={handleLogout}
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
                    <div className="sm:hidden absolute right-0 top-10 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 dark:border-gray-700/50 z-50 overflow-hidden">
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
                            logout();
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
