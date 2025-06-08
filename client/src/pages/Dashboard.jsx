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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

      toast.success(`Added ${uploadingProfilePhotos.length} photos to your profile!`);
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

      toast.success(`Removed ${selectedPhotosToRemove.length} photos from profile`);
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
    <div className="min-h-screen bg-gray-100">
      <ModernNavbar
        userData={userData}
        currentUser={currentUser}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        pendingRequests={pendingFriendRequests}
        handleLogout={handleLogout}
        setShowEditProfileModal={setShowEditProfileModal}
        setShowSettingsModal={setShowSettingsModal}
      />

      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 🧭 Left Side (2/3 width) – My Trips */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create New Trip
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-2">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading your trips...</p>
              </div>
            ) : (
              <>
                {trips.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow mx-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No trips yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first trip to start organizing your photos
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create New Trip
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
                    {trips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onClick={() => setSelectedTrip(trip.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Always show pending invites */}
                <div className="bg-white rounded-lg shadow p-4 mt-6 mx-2">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Pending Trip Invites
                  </h2>

                  {tripInvites.length === 0 ? (
                    <p className="text-gray-500">
                      No trip invites at the moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {tripInvites.map((invite) => (
                        <li
                          key={invite.id}
                          className="py-3 flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0"
                        >
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-indigo-700">
                              {invite.tripName || "Unknown Trip"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Invited by:{" "}
                              <span className="font-medium text-gray-700">
                                {invite.inviterName || invite.inviterUid}
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                await acceptTripInvite(
                                  invite.id,
                                  currentUser.uid
                                );
                                setTripInvites(
                                  tripInvites.filter((i) => i.id !== invite.id)
                                );
                                const refreshedTrips = await getUserTrips(
                                  currentUser.uid
                                );
                                setTrips(refreshedTrips);
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                await declineTripInvite(invite.id);
                                setTripInvites(
                                  tripInvites.filter((i) => i.id !== invite.id)
                                );
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ************* Right Side (1/3 width) – Face Profile & Friends ************* */}
          <div className="space-y-6">
            {/* 🎭 Face Profile Management Section */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Face Profile
                </h2>
                
                {/* Profile Status Indicator */}
                {isLoadingProfile ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    Loading...
                  </div>
                ) : hasProfile ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Ready ({profilePhotos.length} photos)
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Not Set Up
                  </div>
                )}
              </div>

              {/* Profile Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {!hasProfile ? (
                  <button
                    onClick={() => setShowProfileManager(true)}
                    disabled={isLoadingProfile}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Face Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowProfileManagement(!showProfileManagement)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                    >
                      Manage Profile
                    </button>
                    <button
                      onClick={deleteCurrentProfile}
                      disabled={isManagingProfile}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
                    >
                      Delete Profile
                    </button>
                  </>
                )}
              </div>

              {/* Profile Management Options */}
              {showProfileManagement && hasProfile && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={optimizeCurrentProfile}
                      disabled={isManagingProfile}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
                    >
                      {isManagingProfile ? "Optimizing..." : "Optimize"}
                    </button>
                  </div>

                  {profile && (
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div>Photos: {profilePhotos.length}</div>
                        <div>
                          Avg Quality:{" "}
                          {(profile.metadata.avgQuality * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div>Success Rate: {profile.metadata.successRate}%</div>
                        <div>
                          Created:{" "}
                          {new Date(
                            profile.metadata.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Photos Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add More Photos
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleProfilePhotoSelect}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingProfilePhotos.length > 0 && (
                        <button
                          onClick={addMorePhotosToProfile}
                          disabled={isManagingProfile}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
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
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Profile Photos ({profilePhotos.length})
                      </label>
                      {selectedPhotosToRemove.length > 0 && (
                        <button
                          onClick={removeSelectedPhotos}
                          disabled={isManagingProfile}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                        >
                          {isManagingProfile
                            ? "Removing..."
                            : `Remove ${selectedPhotosToRemove.length}`}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {profilePhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <div
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                              selectedPhotosToRemove.includes(photo.url)
                                ? "border-red-500 bg-red-100"
                                : "border-gray-200 hover:border-blue-400"
                            }`}
                            onClick={() => togglePhotoSelection(photo.url)}
                          >
                            <img
                              src={photo.url}
                              alt="Profile"
                              className="w-full h-16 object-cover"
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center ${
                                selectedPhotosToRemove.includes(photo.url)
                                  ? "bg-red-500 bg-opacity-50"
                                  : "bg-transparent"
                              }`}
                            >
                              {selectedPhotosToRemove.includes(photo.url) && (
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-center mt-1">
                            <span
                              className={`inline-block px-1 py-0.5 rounded text-white text-xs ${
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

                    <div className="text-xs text-gray-600 mt-2">
                      Click photos to select for removal. Higher confidence
                      (green) photos give better results.
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Info */}
              <div className="text-center py-4">
                {!hasProfile ? (
                  <div className="text-sm text-gray-500 italic">
                    Create a face profile to automatically find photos containing you in your trips.
                  </div>
                ) : (
                  <div className="text-sm text-green-600">
                    ✅ Face profile ready! Visit your trips to find photos with you.
                  </div>
                )}
              </div>
            </div>

            {/* My Friends */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  My Friends
                </h2>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full transition shadow"
                >
                  + Add Friend
                </button>
              </div>
              {sortedFriends.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  You have no friends yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {sortedFriends.map((friend) => (
                    <div
                      key={friend.uid || friend.id}
                      className="flex items-center bg-gray-50 hover:bg-gray-100 p-3 rounded-xl shadow-sm transition cursor-pointer"
                      onClick={() => handleOpenUserProfile(friend.uid)}
                    >
                      <img
                        src={
                          friend.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt="Friend"
                        className="w-10 h-10 rounded-full object-cover border mr-3"
                      />
                      <div className="text-sm font-medium text-gray-800">
                        {friend.displayName || friend.email || friend.uid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Friend Requests */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Friend Requests
              </h2>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.from}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-xl shadow-sm transition"
                    >
                      <div
                        onClick={() => handleOpenUserProfile(req.from)}
                        className="cursor-pointer font-medium text-sm text-gray-800"
                      >
                        {req.displayName || req.email || req.from}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(req.from)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.from)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-sm shadow"
                        >
                          Reject
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

      {/* Face Profile Manager Modal */}
      {showProfileManager && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Create Face Profile
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload photos of yourself for automatic photo recognition in trips
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileManager(false)}
                  className="text-gray-400 hover:text-gray-600"
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

              <FaceProfileManager onProfileLoaded={handleProfileLoaded} />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Upload Section */}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Find Friends</h2>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <AddFriend onUserSelect={handleOpenUserProfile} />
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
    </div>
  );
};

export default Dashboard;