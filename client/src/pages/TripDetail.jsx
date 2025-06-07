// **************** 🔹 Imports  ****************

// 🔹 React & Router
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

// 🔹 Context
import { useAuth } from "../contexts/AuthContext";

// 🔹 Firebase Config
import { db, storage } from "../services/firebase/config";

// 🔹 Firestore & Storage Functions
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// 🔹 Firebase App Functions
import {
  getTrip,
  addTripMember,
  sendTripInvite,
  updateTrip,
} from "../services/firebase/trips";
import { getTripPhotos } from "../services/firebase/storage";
import {
  getFriends,
  getUserProfile,
  sendFriendRequest,
  removeFriend,
} from "../services/firebase/users";
import {
  deleteFaceProfileFromStorage,
  getFaceProfileFromStorage,
} from "../services/firebase/faceProfiles";

// 🔹 Face Recognition (Enhanced)
import {
  filterPhotosByFace,
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  createFaceProfile,
  getFaceProfile,
  addPhotosToProfile,
  removePhotosFromProfile,
  getProfilePhotos,
  optimizeProfile,
  deleteFaceProfile,
} from "../services/faceRecognition";

// 🔹 Components
import PhotoUpload from "../components/photos/PhotoUpload";
import InviteFriendDropdown from "../components/trips/InviteFriendDropdown";
import UserProfileModal from "../components/profile/UserProfileModal";
import FaceProfileManager from "../components/faceProfile/FaceProfileManager";

// 🔹 Assets
import logo from "../assets/logo/3.png";

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [trip, setTrip] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [filterActive, setFilterActive] = useState(false);

  // Enhanced face recognition state with profiles
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [faceRecognitionProgress, setFaceRecognitionProgress] = useState({
    current: 0,
    total: 0,
    phase: "",
    estimatedTimeRemaining: null,
    batch: 0,
    totalBatches: 0,
    currentPhoto: "",
    matches: [],
    errors: [],
  });

  // Enhanced profile management state
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [selectedPhotosToRemove, setSelectedPhotosToRemove] = useState([]);
  const [uploadingProfilePhotos, setUploadingProfilePhotos] = useState([]);
  const [isManagingProfile, setIsManagingProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  const isMember = trip?.members?.includes(currentUser?.uid);
  const canFilterByFace = isMember && currentUser?.uid;
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);

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

      alert(`Added ${uploadingProfilePhotos.length} photos to your profile!`);
    } catch (error) {
      console.error("Failed to add photos:", error);
      alert(error.message || "Failed to add photos to profile");
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

      alert(`Removed ${selectedPhotosToRemove.length} photos from profile`);
    } catch (error) {
      console.error("Failed to remove photos:", error);
      alert(error.message || "Failed to remove photos");
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

      alert("Profile optimized - removed low quality photos");
    } catch (error) {
      console.error("Failed to optimize profile:", error);
      alert(error.message || "Failed to optimize profile");
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
        // Continue anyway since memory is cleared
      }

      // Update local state
      setHasProfile(false);
      setProfile(null);
      setProfilePhotos([]);
      setShowProfileManagement(false);

      // Clear any filtered photos
      setFilterActive(false);
      setFilteredPhotos([]);

      alert("Face profile deleted successfully");
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alert("Failed to delete profile: " + error.message);
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

  // Updated loadUserFaceProfile function with CORS workaround
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

          // Skip CORS accessibility test in development - just try to create the profile
          // The createFaceProfile function will handle CORS errors gracefully
          await createFaceProfile(currentUser.uid, imageUrls);

          setHasProfile(true);
          console.log("✅ Face profile loaded automatically from storage");
        } catch (error) {
          console.error("❌ Failed to auto-load face profile:", error);
          console.log("🗑️ Cleaning up corrupted profile data...");

          // Clean up corrupted profile
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

  // Enhanced progress handler with real-time updates
  const handleFaceRecognitionProgress = (progressData) => {
    setFaceRecognitionProgress((prev) => {
      const newProgress = { ...prev };

      switch (progressData.type) {
        case "initializing":
          return {
            ...newProgress,
            phase: progressData.phase,
            current: 0,
            total: progressData.total,
            profileInfo: progressData.profileInfo,
          };

        case "batch_starting":
          return {
            ...newProgress,
            phase: progressData.phase,
            totalBatches: progressData.totalBatches,
          };

        case "processing":
          return {
            ...newProgress,
            current: progressData.current,
            total: progressData.total,
            batch: progressData.batch,
            totalBatches: progressData.totalBatches,
            currentPhoto: progressData.currentPhoto,
            estimatedTimeRemaining: progressData.estimatedTimeRemaining,
            phase: `${progressData.phase} (${progressData.current}/${progressData.total})`,
          };

        case "match_found":
          return {
            ...newProgress,
            matches: [
              ...prev.matches,
              {
                photo: progressData.photo,
                confidence: progressData.confidence,
                matchType: progressData.matchType,
                consensus: progressData.consensus,
                timestamp: Date.now(),
              },
            ],
          };

        case "error":
          return {
            ...newProgress,
            errors: [
              ...prev.errors,
              {
                photo: progressData.photo,
                error: progressData.error,
                timestamp: Date.now(),
              },
            ],
          };

        case "completed":
          return {
            ...newProgress,
            phase: progressData.phase,
            current: prev.total,
            totalMatches: progressData.totalMatches,
            strongMatches: progressData.strongMatches,
            weakMatches: progressData.weakMatches,
            averageConfidence: progressData.averageConfidence,
            processingTime: progressData.processingTime,
            cacheStats: progressData.cacheStats,
            profileUsed: progressData.profileUsed,
          };

        case "cancelled":
          return {
            ...newProgress,
            phase: progressData.phase,
          };

        default:
          return newProgress;
      }
    });
  };

  // Enhanced face recognition function with profile support
  const handleFindMyPhotos = async () => {
    if (!currentUser?.uid || photos.length === 0) {
      alert("User ID or trip photos missing");
      return;
    }

    // Check if user has a face profile
    if (!hasProfile) {
      console.log("⚠️ No face profile found, opening profile manager");
      setShowProfileManager(true);
      return;
    }

    setIsProcessingFaces(true);
    setFaceRecognitionProgress({
      current: 0,
      total: photos.length,
      phase: "Initializing...",
      matches: [],
      errors: [],
    });
    resetFaceRecognition();

    try {
      console.log("🚀 Starting PROFILE-BASED face recognition...");

      const photoData = photos.map((photo) => ({
        id: photo.id,
        downloadURL: photo.downloadURL,
        fileName: photo.originalName || photo.fileName || `Photo ${photo.id}`,
        ...photo,
      }));

      // Use profile-based recognition
      const matches = await filterPhotosByFaceProfile(
        photoData,
        currentUser.uid,
        handleFaceRecognitionProgress
      );

      if (matches.length > 0) {
        setFilteredPhotos(matches);
        setFilterActive(true);
        console.log(`✅ Found ${matches.length} matching photos`);
      } else {
        console.log("ℹ️ No matching photos found");
        setFilteredPhotos([]);
        setFilterActive(true); // Still show the section but with "no matches" message
      }
    } catch (error) {
      console.error("❌ Face recognition error:", error);
      if (error.message.includes("No face profile found")) {
        setShowProfileManager(true);
      }
      setFilteredPhotos([]);
    } finally {
      setIsProcessingFaces(false);
    }
  };

  // Cancel face recognition
  const handleCancelFaceRecognition = () => {
    console.log("🛑 Cancelling face recognition...");
    cancelFaceRecognition();

    setTimeout(() => {
      setIsProcessingFaces(false);
      setFaceRecognitionProgress({
        current: 0,
        total: 0,
        phase: "",
        matches: [],
        errors: [],
      });
    }, 500);
  };

  const handleToggleFaceFilter = () => {
    if (!canFilterByFace) {
      alert("Face filtering is only available for registered trip members.");
      return;
    }

    if (isProcessingFaces) return; // Don't toggle while processing

    if (filterActive) {
      // Turn off filter
      setFilterActive(false);
      setFilteredPhotos([]);
    } else {
      // Start face recognition
      handleFindMyPhotos();
    }
  };

  const handleProfileLoaded = (loaded) => {
    setHasProfile(loaded);
    if (loaded) {
      setShowProfileManager(false);
      console.log("✅ Face profile created successfully");
    }
  };

  const handleDeleteSelectedPhotos = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPhotos.length} selected photo(s)?`
    );
    if (!confirmed) return;

    try {
      for (const photoId of selectedPhotos) {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) continue;

        const photoRef = ref(storage, `photos/${tripId}/${photo.fileName}`);
        await deleteObject(photoRef);

        const docRef = doc(db, "tripPhotos", photoId);
        await deleteDoc(docRef);
      }

      setPhotos((prev) => prev.filter((p) => !selectedPhotos.includes(p.id)));
      alert(`${selectedPhotos.length} photos deleted successfully ✅`);
      setSelectedPhotos([]);

      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete selected photos:", error);
      alert("An error occurred while deleting photos.");
    }
  };

  useEffect(() => {
    const fetchTripAndPhotos = async () => {
      try {
        setLoading(true);
        const tripData = await getTrip(tripId);
        setTrip(tripData);
        setIsAdmin(tripData?.admins?.includes(currentUser?.uid));

        if (!tripData.members.includes(currentUser.uid)) {
          setError("You do not have access to this trip");
          setLoading(false);
          return;
        }

        const photos = await getTripPhotos(tripId);
        setPhotos(photos);

        if (tripData.members.length > 0) {
          const memberData = await Promise.all(
            tripData.members.map((uid) => getUserProfile(uid))
          );
          setMemberProfiles(memberData);
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
        setError("Failed to load trip data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (tripId && currentUser) {
      fetchTripAndPhotos();
    }
  }, [tripId, currentUser]);

  // Get pending friend requests helper function
  const getPendingFriendRequests = async (uid) => {
    try {
      const q = query(
        collection(db, "friendRequests"),
        where("fromUid", "==", uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        uid: doc.data().toUid,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchFriendsAndPending = async () => {
      if (!currentUser?.uid) return;
      try {
        const userFriends = await getFriends(currentUser.uid);
        const friendIds = userFriends.map((f) => f.uid);
        setFriends(friendIds);
        console.log("✅ Loaded friends:", friendIds);

        const pending = await getPendingFriendRequests(currentUser.uid);
        const pendingIds = pending.map((r) => r.uid);
        setPendingFriendRequests(pendingIds);
        console.log("🕒 Pending requests:", pendingIds);
      } catch (error) {
        console.error("❌ Failed to fetch friends or pending:", error);
      }
    };

    fetchFriendsAndPending();
  }, [currentUser]);

  const handlePhotoUploaded = (uploadedPhotos) => {
    setPhotos((prev) => [...uploadedPhotos, ...prev]);

    if (trip) {
      setTrip((prevTrip) => ({
        ...prevTrip,
        photoCount: (prevTrip.photoCount || 0) + uploadedPhotos.length,
      }));
    }

    setShowUploadForm(false);
  };

  const handleAddFriend = async (targetUid) => {
    try {
      await sendFriendRequest(currentUser.uid, targetUid);
      setPendingFriendRequests((prev) => [...prev, targetUid]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("✅ Friend request sent to:", targetUid);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: true,
      }));
    } catch (error) {
      console.error("❌ Failed to send friend request:", error);
    }
  };

  const handleRemoveFriend = async (targetUid) => {
    try {
      await removeFriend(currentUser.uid, targetUid);
      setFriends((prev) => prev.filter((uid) => uid !== targetUid));
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isFriend: false,
      }));
      console.log("🗑️ Removed friend:", targetUid);
    } catch (error) {
      console.error("❌ Failed to remove friend:", error);
    }
  };

  const checkFriendStatus = async (myUid, otherUid) => {
    const ref = doc(db, "friendRequests", `${myUid}_${otherUid}`);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.status === "pending" ? "pending" : "none";
    }
    return "none";
  };

  const handlePromoteToAdmin = (uid) => {
    setTrip((prevTrip) => ({
      ...prevTrip,
      admins: [...(prevTrip.admins || []), uid],
    }));
  };

  const handleDemoteFromAdmin = (uid) => {
    setTrip((prevTrip) => {
      const isLastAdmin =
        prevTrip.admins?.length === 1 && prevTrip.admins[0] === uid;

      if (isLastAdmin) {
        alert(
          "❌ You are the only Group Admin. Either delete the trip or assign another admin first."
        );
        return prevTrip;
      }
      return {
        ...prevTrip,
        admins: prevTrip.admins?.filter((id) => id !== uid),
      };
    });
  };

  useEffect(() => {
    const fetchTripMembers = async () => {
      if (trip && trip.members && trip.members.length > 0) {
        const memberProfiles = await Promise.all(
          trip.members.map((uid) => getUserProfile(uid))
        );
        setTripMembers(memberProfiles);
      } else {
        setTripMembers([]);
      }
    };

    fetchTripMembers();
  }, [trip?.members]);

  const handleRemoveFromTrip = async (uid) => {
    try {
      const userToRemove = tripMembers.find((m) => m.uid === uid);

      const updatedMembers = trip.members?.filter((id) => id !== uid);
      const updatedAdmins = trip.admins?.filter((id) => id !== uid);

      const updatedTrip = {
        ...trip,
        members: updatedMembers,
        admins: updatedAdmins,
      };

      await updateTrip(trip.id, updatedTrip);

      const memberProfiles = await Promise.all(
        updatedMembers.map((id) => getUserProfile(id))
      );
      setTripMembers(memberProfiles);

      setTrip(updatedTrip);

      toast.success(
        `User ${userToRemove?.displayName || uid} was removed from the trip ✅`,
        { duration: 4000 }
      );

      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to remove user from trip:", error);
      toast.error("❌ Failed to remove user from trip", { duration: 4000 });
    }
  };

  const handleCancelFriendRequest = async (targetUid) => {
    try {
      const ref = doc(db, "friendRequests", `${currentUser.uid}_${targetUid}`);
      await deleteDoc(ref);
      setPendingFriendRequests((prev) =>
        prev.filter((uid) => uid !== targetUid)
      );
      setCancelSuccess(
        `Friend request to ${
          selectedUser.displayName || selectedUser.email
        } was cancelled.`
      );
      setTimeout(() => setCancelSuccess(null), 3000);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: false,
      }));

      console.log("🗑️ Friend request canceled:", targetUid);
    } catch (error) {
      console.error("❌ Failed to cancel friend request:", error);
    }
  };

  const handleInviteFriend = async (friend) => {
    try {
      const q = query(
        collection(db, "tripInvites"),
        where("tripId", "==", tripId),
        where("inviteeUid", "==", friend.uid),
        where("status", "==", "pending")
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert(`${friend.displayName} already has a pending invite.`);
        return;
      }

      await sendTripInvite(tripId, currentUser.uid, friend.uid);
      alert(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      alert("Failed to send invitation.");
    }
  };

  // Format time remaining helper
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds < 0) return "";

    if (seconds < 60) {
      return `~${seconds}s remaining`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `~${minutes}m ${remainingSeconds}s remaining`;
    }
  };

  // Calculate percentage helper
  const getProgressPercentage = () => {
    if (faceRecognitionProgress.total === 0) return 0;
    return Math.round(
      (faceRecognitionProgress.current / faceRecognitionProgress.total) * 100
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading trip details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start">
            {/* Left side: Trip thumbnail + details */}
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              {photos.length > 0 && (
                <img
                  src={photos[0].downloadURL.replace(
                    "groupify-77202.appspot.com",
                    "groupify-77202.firebasestorage.app"
                  )}
                  alt="Trip Thumbnail"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white transform hover:scale-105 transition duration-300"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {trip.name}
                </h1>
                <p className="text-indigo-100 mt-1">
                  {trip.location || "No location specified"}
                </p>
                <div className="flex mt-2 text-sm text-indigo-200">
                  <span className="mr-4 font-medium">
                    {trip.startDate || "No start date"}
                    {trip.startDate && trip.endDate && " - "}
                    {trip.endDate}
                  </span>
                  <span>{trip.members?.length || 1} members</span>
                </div>
              </div>
            </div>

            {/* Right side: Logo with rounded background */}
            <Link to="/dashboard" title="Go to Dashboard">
              <div className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-contain"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Trip Details</h2>

                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => alert("Edit Trip modal will open here")}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Edit Trip
                    </button>
                  )}
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {showUploadForm ? "Cancel Upload" : "Add Photos"}
                  </button>
                </div>
              </div>

              {trip.description ? (
                <p className="text-gray-700">{trip.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}

              <div className="text-sm text-gray-500 mt-2">
                {photos.length} photos
              </div>
            </div>

            {showUploadForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Upload Photos</h2>
                <PhotoUpload
                  tripId={tripId}
                  onPhotoUploaded={handlePhotoUploaded}
                />
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">All Trip Photos</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllPhotosModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    All Photos
                  </button>
                </div>
              </div>

              <div className="flex overflow-x-auto space-x-4 pb-2">
                {photos.map((photo) => (
                  <div
                    key={`all-${photo.id}`}
                    className="flex-shrink-0 w-64 cursor-pointer relative"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.downloadURL.replace(
                        "groupify-77202.appspot.com",
                        "groupify-77202.firebasestorage.app"
                      )}
                      alt={photo.fileName}
                      className="w-full h-40 object-cover rounded-lg shadow"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Face Recognition Section with Profile Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Photos With Me</h2>

                {/* Enhanced Face Recognition Controls */}
                {!isProcessingFaces ? (
                  <div className="flex items-center gap-3">
                    {/* Profile Status Indicator */}
                    {isLoadingProfile ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        Loading profile...
                      </div>
                    ) : hasProfile ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Profile Ready ({profilePhotos.length} photos)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        No Profile
                      </div>
                    )}

                    {/* Profile Management Button */}
                    {hasProfile && (
                      <button
                        onClick={() =>
                          setShowProfileManagement(!showProfileManagement)
                        }
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-1"
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                        Manage
                      </button>
                    )}

                    {/* Main Action Button */}
                    <button
                      onClick={handleToggleFaceFilter}
                      disabled={!canFilterByFace || isLoadingProfile}
                      className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 ${
                        canFilterByFace && !isLoadingProfile
                          ? filterActive
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : hasProfile
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {filterActive
                        ? "Hide My Photos"
                        : hasProfile
                        ? `Find My Photos (${photos.length})`
                        : `Setup Profile & Scan`}
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Profile Management Options Dropdown */}
              {showProfileManagement && hasProfile && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() =>
                        setShowProfileManagement(!showProfileManagement)
                      }
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                      {showProfileManagement ? "Hide" : "Show"} Photo Management
                    </button>
                    <button
                      onClick={optimizeCurrentProfile}
                      disabled={isManagingProfile}
                      className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
                    >
                      {isManagingProfile ? "Optimizing..." : "Optimize Profile"}
                    </button>
                    <button
                      onClick={deleteCurrentProfile}
                      disabled={isManagingProfile}
                      className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50"
                    >
                      Delete Profile
                    </button>
                  </div>

                  {profile && (
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
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

                  {/* Photo Management Section */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-3">
                      Manage Profile Photos
                    </h3>

                    {/* Add Photos Section */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-blue-800 mb-2">
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
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                          >
                            {isManagingProfile
                              ? "Adding..."
                              : `Add ${uploadingProfilePhotos.length} Photos`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Current Profile Photos */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-blue-800">
                          Current Profile Photos ({profilePhotos.length})
                        </label>
                        {selectedPhotosToRemove.length > 0 && (
                          <button
                            onClick={removeSelectedPhotos}
                            disabled={isManagingProfile}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50"
                          >
                            {isManagingProfile
                              ? "Removing..."
                              : `Remove ${selectedPhotosToRemove.length} Selected`}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
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

                      <div className="text-xs text-blue-600 mt-2">
                        Click photos to select for removal. Higher confidence
                        (green) photos give better results.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Processing UI */}
              {isProcessingFaces ? (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Processing Photos</span>
                      <span className="font-medium">
                        {getProgressPercentage()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-medium text-gray-800">
                      {faceRecognitionProgress.phase || "Processing..."}
                    </div>

                    {faceRecognitionProgress.profileInfo && (
                      <div className="text-xs text-blue-600">
                        Using profile with{" "}
                        {faceRecognitionProgress.profileInfo.references}{" "}
                        reference photos
                      </div>
                    )}

                    {faceRecognitionProgress.currentPhoto && (
                      <div className="text-xs text-gray-600">
                        Current: {faceRecognitionProgress.currentPhoto}
                      </div>
                    )}

                    {faceRecognitionProgress.batch > 0 &&
                      faceRecognitionProgress.totalBatches > 0 && (
                        <div className="text-xs text-gray-600">
                          Batch {faceRecognitionProgress.batch} of{" "}
                          {faceRecognitionProgress.totalBatches}
                        </div>
                      )}

                    {faceRecognitionProgress.estimatedTimeRemaining && (
                      <div className="text-xs text-indigo-600 font-medium">
                        {formatTimeRemaining(
                          faceRecognitionProgress.estimatedTimeRemaining
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Match Counter */}
                  {faceRecognitionProgress.matches?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-green-800">
                        ✅ Found {faceRecognitionProgress.matches.length}{" "}
                        matches so far
                      </div>
                      {faceRecognitionProgress.matches.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Latest:{" "}
                          {
                            faceRecognitionProgress.matches[
                              faceRecognitionProgress.matches.length - 1
                            ]?.photo
                          }
                          {faceRecognitionProgress.matches[
                            faceRecognitionProgress.matches.length - 1
                          ]?.consensus && (
                            <span className="ml-2 text-green-700 font-medium">
                              (
                              {
                                faceRecognitionProgress.matches[
                                  faceRecognitionProgress.matches.length - 1
                                ].consensus
                              }{" "}
                              consensus)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Counter */}
                  {faceRecognitionProgress.errors?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-yellow-800">
                        ⚠️ {faceRecognitionProgress.errors.length} photos failed
                        to process
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  <button
                    onClick={handleCancelFaceRecognition}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium 
                               py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel Processing
                  </button>
                </div>
              ) : filterActive && filteredPhotos.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No matching photos found using your face profile.
                </p>
              ) : filterActive ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={`filtered-${photo.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.downloadURL.replace(
                          "groupify-77202.appspot.com",
                          "groupify-77202.firebasestorage.app"
                        )}
                        alt={photo.fileName}
                        className="w-full h-32 object-cover rounded-lg shadow"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {photo.faceMatch && (
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-medium ${
                                photo.faceMatch.matchType === "strong"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {(photo.faceMatch.confidence * 100).toFixed(1)}%
                              match
                            </span>
                            {photo.faceMatch.consensus && (
                              <span className="text-xs text-gray-400">
                                {photo.faceMatch.consensus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-400 italic mb-4">
                    {hasProfile
                      ? 'Click "Find My Photos" to automatically identify photos containing you using your face profile.'
                      : "Create a face profile with multiple photos for much better face recognition accuracy."}
                  </div>
                  {!hasProfile && (
                    <button
                      onClick={() => setShowProfileManager(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                    >
                      Setup Face Profile Now
                    </button>
                  )}
                </div>
              )}

              {/* Completion Summary with Profile Stats */}
              {!isProcessingFaces &&
                faceRecognitionProgress.totalMatches !== undefined && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="text-sm font-medium text-indigo-800 mb-2">
                      🎯 Profile-Based Recognition Complete!
                    </div>
                    <div className="text-xs text-indigo-600 space-y-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div>
                            Total matches:{" "}
                            {faceRecognitionProgress.totalMatches}
                          </div>
                          <div>
                            Strong matches:{" "}
                            {faceRecognitionProgress.strongMatches}
                          </div>
                          <div>
                            Weak matches: {faceRecognitionProgress.weakMatches}
                          </div>
                        </div>
                        <div>
                          <div>
                            Average confidence:{" "}
                            {faceRecognitionProgress.averageConfidence}%
                          </div>
                          {faceRecognitionProgress.processingTime && (
                            <div>
                              Processing time:{" "}
                              {faceRecognitionProgress.processingTime}s
                            </div>
                          )}
                          {faceRecognitionProgress.profileUsed && (
                            <div>
                              Profile refs:{" "}
                              {faceRecognitionProgress.profileUsed.references}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cache Performance Stats */}
                    {faceRecognitionProgress.cacheStats && (
                      <div className="mt-2 pt-2 border-t border-indigo-200">
                        <div className="text-xs text-indigo-500">
                          💾 Cache: {faceRecognitionProgress.cacheStats.hitRate}{" "}
                          hit rate
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Invite People</h2>
              <InviteFriendDropdown
                currentUser={currentUser}
                onSelect={handleInviteFriend}
                excludedUserIds={trip.members}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Trip Members</h2>

              {tripMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">No members found.</p>
              ) : (
                <ul className="space-y-3">
                  {[...tripMembers]

                    .sort((a, b) => {
                      // 1. Current user first
                      if (a.uid === currentUser.uid) return -1;
                      if (b.uid === currentUser.uid) return 1;

                      // 2. Admin second
                      if (a.uid === trip.createdBy) return -1;
                      if (b.uid === trip.createdBy) return 1;

                      // 3. Alphabetical for the rest
                      return (a.displayName || a.email || "").localeCompare(
                        b.displayName || b.email || ""
                      );
                    })
                    .map((member) => (
                      <li
                        key={member.uid}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <img
                            src={
                              member.photoURL ||
                              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                            }
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover border mr-3"
                          />
                          <span
                            className="text-sm font-medium text-gray-700 hover:underline cursor-pointer"
                            onClick={async () => {
                              const isFriendNow = friends.includes(member.uid);
                              const status = await checkFriendStatus(
                                currentUser.uid,
                                member.uid
                              );
                              const isPendingNow = status === "pending";
                              setSelectedUser({
                                ...member,
                                __isFriend: isFriendNow,
                                __isPending: isPendingNow,
                              });
                            }}
                          >
                            {member.displayName || member.email || member.uid}
                            {member.uid === currentUser.uid && " (Me)"}
                          </span>
                        </div>

                        {/* Admin Badge */}
                        {member.uid === trip.createdBy ? (
                          <span className="bg-gray-300 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Trip Creator
                          </span>
                        ) : trip.admins?.includes(member.uid) ? (
                          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Group Admin
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Face Profile Manager Modal */}
        {showProfileManager && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Face Profile Required
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create a face profile for much better photo recognition
                      accuracy
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

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUserId={currentUser?.uid}
            isAdmin={isAdmin}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onCancelRequest={handleCancelFriendRequest}
            onClose={() => setSelectedUser(null)}
            trip={trip}
            setTrip={setTrip}
            tripMembers={tripMembers}
            setTripMembers={setTripMembers}
            setSelectedUser={setSelectedUser}
            onPromoteToAdmin={handlePromoteToAdmin}
            onDemoteFromAdmin={handleDemoteFromAdmin}
            onRemoveFromTrip={handleRemoveFromTrip}
            onlyTripMembers={true}
          />
        )}

        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <img
              src={selectedPhoto.downloadURL.replace(
                "groupify-77202.appspot.com",
                "groupify-77202.firebasestorage.app"
              )}
              alt="Full view"
              className="max-w-4xl max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        )}

        {showSuccess && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
            Friend request sent ✅
          </div>
        )}
        {cancelSuccess && (
          <div className="fixed top-5 right-5 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
            {cancelSuccess}
          </div>
        )}

        {showAllPhotosModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={() => setShowAllPhotosModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg max-w-6xl max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">All Trip Photos</h3>
                <div className="flex items-center gap-2">
                  {selectMode && selectedPhotos.length > 0 && (
                    <button
                      onClick={handleDeleteSelectedPhotos}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center"
                    >
                      <span className="mr-2">🗑️</span>
                      Delete {selectedPhotos.length}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectMode(!selectMode);
                        setSelectedPhotos([]);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      {selectMode ? "Cancel Selection" : "Select Photos"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAllPhotosModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  return (
                    <div
                      key={`modal-${photo.id}`}
                      className={`relative cursor-pointer rounded-lg overflow-hidden shadow ${
                        selectMode && !isSelected ? "opacity-60" : ""
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          togglePhotoSelection(photo.id);
                        } else {
                          setSelectedPhoto(photo);
                          setShowAllPhotosModal(false);
                        }
                      }}
                    >
                      <img
                        src={photo.downloadURL.replace(
                          "groupify-77202.appspot.com",
                          "groupify-77202.firebasestorage.app"
                        )}
                        alt={photo.fileName}
                        className="w-full h-40 object-cover"
                      />
                      {selectMode && (
                        <div className="absolute top-2 right-2 w-5 h-5 border-2 border-white rounded bg-white flex items-center justify-center">
                          {isSelected && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Uploaded{" "}
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetail;
