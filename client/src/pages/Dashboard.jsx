// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/trips/TripCard";
import CreateTripModal from "../components/trips/CreateTripModal";
import AddFriend from "../components/friends/AddFriend";
import EditProfileModal from "../components/profile/EditProfileModal";
import SettingsModal from "../components/settings/SettingsModal";
import ModernNavbar from "../components/layout/Navbar";
import UserProfileModal from "../components/profile/UserProfileModal";
import FaceProfileManager from "../components/faceProfile/FaceProfileManager";
import Sidebar from "../components/layout/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hooks
import { useSidebar } from "../hooks/useSidebar";

// Icons
import {
  Bars3Icon,
  SparklesIcon,
  UserGroupIcon,
  CameraIcon,
  BellIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, storage } from "../services/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  // 🔐 Authentication & Navigation
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar state
  const sidebar = useSidebar();

  // 📊 State Management
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tripInvites, setTripInvites] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  // 🎭 Face Profile Management States
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [selectedPhotosToRemove, setSelectedPhotosToRemove] = useState([]);
  const [uploadingProfilePhotos, setUploadingProfilePhotos] = useState([]);
  const [isManagingProfile, setIsManagingProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  const checkFriendStatus = async () => {
    if (user.uid === currentUserId) {
      setFriendStatus("self");
    } else if (friends.some((f) => f.uid === user.uid)) {
      setFriendStatus("friend");
    } else {
      const sent = await didISendRequest(currentUserId, user.uid);
      if (sent) {
        setFriendStatus("pending");
      } else {
        setFriendStatus("none");
      }
    }
  };

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

  const handleProfileLoaded = (loaded) => {
    setHasProfile(loaded);
    if (loaded) {
      setShowProfileManager(false);
      toast.success("Face profile created successfully!");
      console.log("✅ Face profile created successfully");
    }
  };

  useEffect(() => {
    const fetchPendingRequests = async () => {
      const requests = await getPendingFriendRequests(currentUser?.uid);
      setPendingFriendRequests(requests || []);
    };

    if (currentUser) {
      fetchPendingRequests();
    }
  }, [currentUser]);

  // 📦 Dashboard Effects
  useEffect(() => {
    if (!currentUser?.uid) return;

    // --- Fetch Profile ---
    const fetchUserProfile = async () => {
      const profile = await getUserProfile(currentUser.uid);
      setUserData(profile);
    };

    // --- Fetch Dashboard Data ---
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [userTrips, friendRequests, invites] = await Promise.all([
          getUserTrips(currentUser.uid),
          getPendingFriendRequests(currentUser.uid),
          getPendingInvites(currentUser.uid),
        ]);
        setTrips(userTrips);
        setPendingRequests(friendRequests);
        setPendingInvites(invites);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load your data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // --- Fetch Trip Invites ---
    const fetchTripInvites = async () => {
      try {
        const invitesSnapshot = await getDocs(
          query(
            collection(db, "tripInvites"),
            where("inviteeUid", "==", currentUser.uid),
            where("status", "==", "pending")
          )
        );

        const invitesData = await Promise.all(
          invitesSnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            let tripName = "Unknown Trip";
            try {
              const tripDoc = await getDoc(doc(db, "trips", data.tripId));
              if (tripDoc.exists()) {
                tripName = tripDoc.data().name || "Unnamed Trip";
              }
            } catch (err) {
              console.warn("⚠️ Error fetching trip:", data.tripId, err);
            }

            let inviterName = null;
            try {
              const inviterDoc = await getDoc(
                doc(db, "users", data.inviterUid)
              );
              if (inviterDoc.exists()) {
                const inviterData = inviterDoc.data();
                inviterName =
                  inviterData.displayName || inviterData.email || null;
              }
            } catch (err) {
              console.warn("⚠️ Error fetching inviter:", data.inviterUid, err);
            }

            return {
              id: docSnap.id,
              ...data,
              tripName,
              inviterName,
            };
          })
        );

        setTripInvites(invitesData);
      } catch (err) {
        console.error("❌ Error fetching trip invites:", err);
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

    // Run initial fetches
    fetchUserProfile();
    fetchInitialData();
    fetchTripInvites();

    // Cleanup listeners
    return () => {
      unsubscribeFriends();
      unsubscribePendingRequests();
    };
  }, [currentUser]);

  //  **************************  Event Handlers  **************************

  // Open User Profile Modal
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

  // 🔧 Event Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleRemoveFriend = async (uid) => {
    try {
      await removeFriend(currentUser.uid, uid);
      setFriends((prev) => prev.filter((f) => f.uid !== uid));
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser(null);
        setShowUserProfileModal(false);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleTripCreated = (newTrip) => {
    setTrips((prevTrips) => [...prevTrips, newTrip]);
  };

  const handleAccept = async (fromUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, fromUid);

      setPendingRequests((prev) => prev.filter((req) => req.from !== fromUid));

      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleReject = async (senderUid) => {
    await rejectFriendRequest(currentUser.uid, senderUid);
    const updatedPending = await getPendingFriendRequests(currentUser.uid);
    setPendingRequests(updatedPending);
  };

  // Sort Friends Alphabetically
  const sortedFriends = [...friends].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  return (
    <div className="min-h-screen h-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Modern Glassmorphic Header */}
        <div className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              {/* Left section – Menu button + Profile + Dropdown */}
              <div className="flex items-center space-x-6">
                {/* Mobile menu button with modern styling */}
                <button
                  onClick={sidebar.toggle}
                  className="lg:hidden p-3 rounded-2xl hover:bg-white/60 transition-all duration-300 backdrop-blur-sm group"
                >
                  <Bars3Icon className="w-6 h-6 text-gray-700 group-hover:text-indigo-600 transition-colors" />
                </button>

                <div className="flex items-center space-x-4 relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative group"
                  >
                    <div className="relative overflow-hidden rounded-2xl ring-4 ring-white/50 group-hover:ring-indigo-200 transition-all duration-300">
                      <img
                        src={
                          userData?.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt="Profile"
                        className="w-14 h-14 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-1 shadow-lg">
                      <svg
                        className={`w-3 h-3 text-white transition-transform duration-300 ${
                          showUserMenu ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute left-0 top-20 w-56 bg-white/90 backdrop-blur-xl text-gray-800 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowEditProfileModal(true);
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium group-hover:text-indigo-600 transition-colors">
                            Edit Profile
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium group-hover:text-purple-600 transition-colors">
                            Settings
                          </span>
                        </button>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                          </div>
                          <span className="font-medium group-hover:text-red-600 transition-colors">
                            Logout
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="text-gray-600 text-sm font-medium">
                      Welcome back,
                    </span>
                    <span className="text-gray-900 text-lg font-bold">
                      {userData?.displayName ||
                        currentUser?.displayName ||
                        currentUser?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center – Modern Logo/Title */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Groupify
                  </h1>
                </div>
              </div>

              {/* Right section – Notifications */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 rounded-2xl hover:bg-white/60 transition-all duration-300 backdrop-blur-sm group"
                >
                  <BellIcon className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                  {(pendingRequests?.length > 0 || tripInvites?.length > 0) && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(pendingRequests?.length || 0) +
                            (tripInvites?.length || 0)}
                        </span>
                      </div>
                      <div className="absolute inset-0 w-5 h-5 bg-red-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative min-h-0 overflow-y-auto">
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
            className="!z-50"
            toastClassName="!bg-white/90 !backdrop-blur-xl !text-gray-800 !rounded-2xl !shadow-xl !border !border-white/20"
          />

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 lg:pr-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 🧭 Left Side (8/12 width) – My Trips */}
              <div className="lg:col-span-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      My Adventures
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Organize and discover your travel memories
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create Trip</span>
                  </button>
                </div>

                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center space-x-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p className="text-gray-600 text-lg">
                      Loading your adventures...
                    </p>
                  </div>
                ) : (
                  <>
                    {trips.length === 0 ? (
                      <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
                        <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                          <CameraIcon className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                          No trips yet
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                          Start your journey by creating your first trip and
                          begin organizing your amazing memories
                        </p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Create Your First Trip
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {trips.map((trip, index) => (
                          <div
                            key={trip.id}
                            className="transform hover:scale-105 transition-all duration-300"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: "fadeInUp 0.6s ease-out forwards",
                            }}
                          >
                            <TripCard
                              trip={trip}
                              onClick={() => setSelectedTrip(trip.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Trip Invites - Modern Design */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mt-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          Trip Invitations
                        </h2>
                        {tripInvites.length > 0 && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                            {tripInvites.length}
                          </span>
                        )}
                      </div>

                      {tripInvites.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-500">
                            No trip invitations at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tripInvites.map((invite) => (
                            <div
                              key={invite.id}
                              className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 p-6 bg-gradient-to-r from-white/60 to-gray-50/60 rounded-2xl border border-white/30 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="space-y-2">
                                <h3 className="text-xl font-bold text-indigo-700">
                                  {invite.tripName || "Unknown Trip"}
                                </h3>
                                <p className="text-gray-600">
                                  <span className="font-medium">
                                    Invited by:
                                  </span>{" "}
                                  <span className="text-gray-800 font-semibold">
                                    {invite.inviterName || invite.inviterUid}
                                  </span>
                                </p>
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={async () => {
                                    await acceptTripInvite(
                                      invite.id,
                                      currentUser.uid
                                    );
                                    setTripInvites(
                                      tripInvites.filter(
                                        (i) => i.id !== invite.id
                                      )
                                    );
                                    const refreshedTrips = await getUserTrips(
                                      currentUser.uid
                                    );
                                    setTrips(refreshedTrips);
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
                                >
                                  <CheckCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    await declineTripInvite(invite.id);
                                    setTripInvites(
                                      tripInvites.filter(
                                        (i) => i.id !== invite.id
                                      )
                                    );
                                  }}
                                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
                                >
                                  <XCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ************* Right Side (4/12 width) – Face Profile & Friends ************* */}
              <div className="lg:col-span-4 space-y-8">
                {/* 🎭 Face Profile Management Section */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Face Profile
                      </h2>
                    </div>

                    {/* Modern Profile Status Indicator */}
                    {isLoadingProfile ? (
                      <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
                        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        <span className="font-medium">Loading...</span>
                      </div>
                    ) : hasProfile ? (
                      <div className="flex items-center gap-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full border border-green-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold">
                          Ready ({profilePhotos.length} photos)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-full border border-orange-200">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold">Not Set Up</span>
                      </div>
                    )}
                  </div>

                  {/* Profile Actions */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {!hasProfile ? (
                      <button
                        onClick={() => setShowProfileManager(true)}
                        disabled={isLoadingProfile}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                      >
                        Create Face Profile
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2 w-full">
                        <button
                          onClick={() =>
                            setShowProfileManagement(!showProfileManagement)
                          }
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                        >
                          Manage Profile
                        </button>
                        <button
                          onClick={deleteCurrentProfile}
                          disabled={isManagingProfile}
                          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-all duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Management Options */}
                  {showProfileManagement && hasProfile && (
                    <div className="bg-gradient-to-r from-gray-50/80 to-white/80 rounded-2xl p-6 mb-6 border border-gray-200/50 backdrop-blur-sm">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={optimizeCurrentProfile}
                          disabled={isManagingProfile}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          {isManagingProfile ? "Optimizing..." : "Optimize"}
                        </button>
                      </div>

                      {profile && (
                        <div className="text-sm text-gray-600 grid grid-cols-2 gap-4 mb-6 p-4 bg-white/60 rounded-xl border border-white/30">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Photos:</span>
                              <span className="font-semibold text-gray-800">
                                {profilePhotos.length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Quality:</span>
                              <span className="font-semibold text-green-600">
                                {(profile.metadata.avgQuality * 100).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span className="font-semibold text-blue-600">
                                {profile.metadata.successRate}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Created:</span>
                              <span className="font-semibold text-gray-800">
                                {new Date(
                                  profile.metadata.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Add Photos Section */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Add More Photos
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleProfilePhotoSelect}
                            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:transition-all file:duration-200"
                          />
                          {uploadingProfilePhotos.length > 0 && (
                            <button
                              onClick={addMorePhotosToProfile}
                              disabled={isManagingProfile}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                          <label className="block text-sm font-semibold text-gray-700">
                            Profile Photos ({profilePhotos.length})
                          </label>
                          {selectedPhotosToRemove.length > 0 && (
                            <button
                              onClick={removeSelectedPhotos}
                              disabled={isManagingProfile}
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all duration-300"
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
                                    ? "border-red-500 bg-red-100 shadow-lg shadow-red-500/20"
                                    : "border-gray-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20"
                                }`}
                                onClick={() => togglePhotoSelection(photo.url)}
                              >
                                <img
                                  src={photo.url}
                                  alt="Profile"
                                  className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div
                                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                                    selectedPhotosToRemove.includes(photo.url)
                                      ? "bg-red-500 bg-opacity-60"
                                      : "bg-black bg-opacity-0 group-hover:bg-opacity-20"
                                  }`}
                                >
                                  {selectedPhotosToRemove.includes(
                                    photo.url
                                  ) && (
                                    <CheckCircleIcon className="w-8 h-8 text-white drop-shadow-lg" />
                                  )}
                                </div>
                              </div>
                              <div className="text-center mt-2">
                                <span
                                  className={`inline-block px-2 py-1 rounded-lg text-white text-xs font-bold shadow-sm ${
                                    photo.qualityTier === "high"
                                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                      : photo.qualityTier === "medium"
                                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                      : "bg-gradient-to-r from-red-500 to-rose-500"
                                  }`}
                                >
                                  {(photo.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs text-gray-600 mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                          💡 Click photos to select for removal. Higher
                          confidence (green) photos give better results.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Info */}
                  <div className="text-center py-6">
                    {!hasProfile ? (
                      <div className="text-sm text-gray-600 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                        <CameraIcon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                        Create a face profile to automatically find photos
                        containing you in your trips.
                      </div>
                    ) : (
                      <div className="text-sm text-green-600 p-4 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        Face profile ready! Visit your trips to find photos with
                        you.
                      </div>
                    )}
                  </div>
                </div>

                {/* My Friends - Enhanced Design */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">
                        My Friends
                      </h2>
                      {sortedFriends.length > 0 && (
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          {sortedFriends.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAddFriendModal(true)}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  </div>

                  {sortedFriends.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <UserGroupIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        No friends yet. Start connecting!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {sortedFriends.map((friend, index) => (
                        <div
                          key={friend.uid || friend.id}
                          className="flex items-center p-4 bg-gradient-to-r from-white/60 to-gray-50/60 hover:from-indigo-50/80 hover:to-purple-50/80 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-white/30 hover:border-indigo-200 group"
                          onClick={() => handleOpenUserProfile(friend.uid)}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: "fadeInUp 0.4s ease-out forwards",
                          }}
                        >
                          <div className="relative">
                            <img
                              src={
                                friend.photoURL ||
                                "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                              }
                              alt="Friend"
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                              {friend.displayName || friend.email || friend.uid}
                            </div>
                            <div className="text-sm text-gray-500">
                              Online now
                            </div>
                          </div>
                          <div className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <svg
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Friend Requests - Enhanced Design */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Friend Requests
                    </h2>
                    {pendingRequests.length > 0 && (
                      <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500">No pending requests.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((req, index) => (
                        <div
                          key={req.from}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-white/60 to-yellow-50/60 rounded-2xl border border-white/30 hover:shadow-lg transition-all duration-300"
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: "fadeInLeft 0.5s ease-out forwards",
                          }}
                        >
                          <div
                            onClick={() => handleOpenUserProfile(req.from)}
                            className="cursor-pointer font-semibold text-gray-800 hover:text-indigo-600 transition-colors flex-1"
                          >
                            {req.displayName || req.email || req.from}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAccept(req.from)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-1"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleReject(req.from)}
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-1"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Enhanced Face Profile Manager Modal */}
          {showProfileManager && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Create Face Profile
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Upload photos of yourself for automatic photo
                        recognition in trips
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProfileManager(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl hover:bg-gray-100 transition-all duration-200"
                    >
                      <svg
                        className="w-8 h-8"
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
                  </div>

                  <FaceProfileManager onProfileLoaded={handleProfileLoaded} />
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Modals */}

          {/* Add Friend Modal */}
          {showAddFriendModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Find Friends
                    </h2>
                    <button
                      onClick={() => setShowAddFriendModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl hover:bg-gray-100 transition-all duration-200"
                    >
                      <svg
                        className="w-6 h-6"
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
                  </div>
                  <AddFriend onUserSelect={handleOpenUserProfile} />
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          <EditProfileModal
            isOpen={showEditProfileModal}
            onClose={() => setShowEditProfileModal(false)}
          />

          {/* Create Trip Modal */}
          <CreateTripModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onTripCreated={handleTripCreated}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />

          {/* User Profile Modal */}
          {selectedUserProfile && (
            <UserProfileModal
              user={selectedUserProfile}
              currentUserId={currentUser.uid}
              isFriend={friends.some((f) => f.uid === selectedUserProfile.uid)}
              isPending={
                pendingRequests.some(
                  (r) => r.from === selectedUserProfile.uid
                ) ||
                pendingFriendRequests.some(
                  (r) => r.to === selectedUserProfile.uid
                )
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
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-top-2 {
          animation-name: slideInFromTop;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
