// client/src/components/dashboard/TripDetailView.jsx

// **************** 🔹 Imports  ****************

// 🔹 React & Router
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

// 🔹 Context
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

// 🔹 Firebase Config
import { db, storage } from "../../services/firebase/config";

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
} from "../../services/firebase/trips";
import { getTripPhotos } from "../../services/firebase/storage";
import {
  getFriends,
  getUserProfile,
  sendFriendRequest,
  removeFriend,
  getPendingFriendRequests,
} from "../../services/firebase/users";
import { getFaceProfileFromStorage } from "../../services/firebase/faceProfiles";

// 🔹 Face Recognition (Simplified)
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  getFaceProfile,
  createFaceProfile,
} from "../../services/faceRecognition";

// 🔹 Components
import PhotoUpload from "../photos/PhotoUpload";
import InviteFriendDropdown from "../trips/InviteFriendDropdown";
import UserProfileModal from "../profile/UserProfileModal";

// 🔹 Icons
import {
  ArrowLeftIcon,
  CameraIcon,
  TrashIcon,
  SparklesIcon,
  PlusIcon,
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  FireIcon,
  MapPinIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const TripDetailView = ({ tripId: propTripId }) => {
  const { tripId: paramTripId } = useParams();
  const tripId = propTripId || paramTripId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useTheme();

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

  // Simplified face recognition state
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
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

  // 📚 Caching states for previous scan results
  const [cachedResults, setCachedResults] = useState(null);
  const [lastScannedPhotos, setLastScannedPhotos] = useState(null);
  const [lastScanTimestamp, setLastScanTimestamp] = useState(null);

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
  const [pendingRequests, setPendingRequests] = useState([]);

  // Auto-load face profile on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserFaceProfile();
    }
  }, [currentUser]);

  // 📚 Clear cache when photos change
  useEffect(() => {
    if (photosHaveChanged() && cachedResults) {
      console.log("📚 Photos changed, clearing cached results");
      setCachedResults(null);
      setLastScannedPhotos(null);
      setLastScanTimestamp(null);

      // If filter is currently active with old cached results, turn it off
      if (filterActive) {
        setFilterActive(false);
        setFilteredPhotos([]);
        toast.info("Photos changed - previous scan results cleared");
      }
    }
  }, [photos]);

  // 📚 Check if photos have changed since last scan
  const photosHaveChanged = () => {
    if (!lastScannedPhotos || !photos) return true;

    // Quick check: compare counts
    if (lastScannedPhotos.length !== photos.length) return true;

    // More thorough check: compare photo IDs and upload times
    const currentPhotoSignature = photos
      .map((p) => `${p.id}-${p.uploadedAt}`)
      .sort()
      .join("|");

    const lastPhotoSignature = lastScannedPhotos
      .map((p) => `${p.id}-${p.uploadedAt}`)
      .sort()
      .join("|");

    return currentPhotoSignature !== lastPhotoSignature;
  };

  // 📚 Check if cached results are still valid
  const hasCachedResults = () => {
    return (
      cachedResults &&
      lastScannedPhotos &&
      lastScanTimestamp &&
      !photosHaveChanged() &&
      hasProfile
    );
  };

  // 📚 Show cached results without scanning
  const showCachedResults = () => {
    if (hasCachedResults()) {
      setFilteredPhotos(cachedResults);
      setFilterActive(true);
      toast.success(`Showing ${cachedResults.length} previously found photos`);
      console.log(
        `📚 Loaded ${cachedResults.length} cached results from ${new Date(
          lastScanTimestamp
        ).toLocaleString()}`
      );
    }
  };

  // 📚 Save scan results to cache
  const saveScanResults = (results) => {
    setCachedResults(results);
    setLastScannedPhotos([...photos]); // Deep copy current photos state
    setLastScanTimestamp(Date.now());
    console.log(`💾 Cached ${results.length} face recognition results`);
  };

  // Updated loadUserFaceProfile function - simplified
  const loadUserFaceProfile = async () => {
    if (!currentUser?.uid) return;

    setIsLoadingProfile(true);
    try {
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

  // Simplified face recognition function
  const handleFindMyPhotos = async (forceRescan = false) => {
    if (!currentUser?.uid || photos.length === 0) {
      toast.error("User ID or trip photos missing");
      return;
    }

    // Check if user has a face profile
    if (!hasProfile) {
      toast.error(
        "No face profile found. Please create one in your Dashboard first."
      );
      return;
    }

    // 📚 If we have valid cached results and not forcing rescan, offer to use cache
    if (!forceRescan && hasCachedResults()) {
      showCachedResults();
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

        // 📚 Save results to cache
        saveScanResults(matches);

        toast.success(`Found ${matches.length} matching photos!`);
        console.log(`✅ Found ${matches.length} matching photos`);
      } else {
        console.log("ℹ️ No matching photos found");
        setFilteredPhotos([]);
        setFilterActive(true); // Still show the section but with "no matches" message

        // 📚 Save empty results to cache
        saveScanResults([]);

        toast.info("No matching photos found");
      }
    } catch (error) {
      console.error("❌ Face recognition error:", error);
      if (error.message.includes("No face profile found")) {
        toast.error(
          "No face profile found. Please create one in your Dashboard first."
        );
      } else {
        toast.error("Face recognition failed: " + error.message);
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
      toast.error(
        "Face filtering is only available for registered trip members."
      );
      return;
    }

    if (isProcessingFaces) return; // Don't toggle while processing

    if (filterActive) {
      // Turn off filter
      setFilterActive(false);
      setFilteredPhotos([]);
    } else {
      // 📚 If we have cached results and photos haven't changed, show cached first
      if (hasCachedResults()) {
        showCachedResults();
      } else {
        // Start face recognition
        handleFindMyPhotos(false);
      }
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
      toast.success(`${selectedPhotos.length} photos deleted successfully`);
      setSelectedPhotos([]);
      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete selected photos:", error);
      toast.error("An error occurred while deleting photos.");
    }
  };

  useEffect(() => {
    const fetchTripAndPhotos = async () => {
      try {
        setLoading(true);
        let tripData = await getTrip(tripId);

        if (!tripData.admins?.includes(tripData.createdBy)) {
          tripData = {
            ...tripData,
            admins: [...(tripData.admins || []), tripData.createdBy],
          };
          await updateTrip(tripId, tripData);
        }

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
        `User ${userToRemove?.displayName || uid} was removed from the trip`
      );

      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to remove user from trip:", error);
      toast.error("Failed to remove user from trip");
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
        toast.warning(`${friend.displayName} already has a pending invite.`, {
          style: {
            borderRadius: "10px",
            background: "#fdf6e3",
            color: "#333",
          },
        });

        return;
      }

      await sendTripInvite(tripId, currentUser.uid, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending trip invite:", error);

      toast.error("Failed to send invitation.");
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Animated loading rings with glassmorphism */}
            <div className="w-20 h-20 relative mx-auto">
              <div className="absolute inset-0 border-4 border-indigo-200/30 dark:border-indigo-800/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <div
                className="absolute inset-2 border-4 border-transparent border-t-purple-500 dark:border-t-purple-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
              <div
                className="absolute inset-4 border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"
                style={{ animationDuration: "2s" }}
              ></div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-8 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-12 right-6 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-300"></div>
              <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-500"></div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Loading Trip Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Getting everything ready for your amazing memories...
            </p>

            {/* Progress steps */}
            <div className="flex justify-center items-center space-x-4 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading trip
                </span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading photos
                </span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading members
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Error card with glassmorphism */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-2xl">
              {/* Error icon with animation */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 rounded-full animate-pulse"></div>
                <svg
                  className="w-10 h-10 text-red-500 dark:text-red-400 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-8 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Enhanced Header Section with glassmorphism */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Left side - Navigation & Trip Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapPinIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {trip.name}
                      </h1>
                      {trip.location && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {trip.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Trip Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <PhotoIcon className="w-5 h-5" />
                      <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">
                        {photos.length}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      Photos
                    </p>
                  </div>

                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

                  <div className="text-center">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <UserGroupIcon className="w-5 h-5" />
                      <span className="font-bold text-xl text-purple-600 dark:text-purple-400">
                        {tripMembers.length}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      Members
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isAdmin && (
                    <button
                      onClick={() =>
                        toast.info("Edit Trip feature coming soon!")
                      }
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2 backdrop-blur-sm"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Edit Trip
                    </button>
                  )}
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2 backdrop-blur-sm ${
                      showUploadForm
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    }`}
                  >
                    {showUploadForm ? (
                      <>
                        <XMarkIcon className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        Add Photos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trip Description */}
            {trip.description && (
              <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {trip.description}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Main Content Grid - Enhanced with glassmorphism */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Takes 3 columns on xl screens */}
          <div className="xl:col-span-2 space-y-6">
            {/* Upload Form - Enhanced with glassmorphism */}
            {showUploadForm && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CameraIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Upload New Photos
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Share your amazing memories with the group
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-800/30">
                    <PhotoUpload
                      tripId={tripId}
                      onPhotoUploaded={handlePhotoUploaded}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photos Preview Section - Enhanced */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <PhotoIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        All Trip Photos
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                          {photos.length}
                        </span>
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Collection of shared memories
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAllPhotosModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex items-center gap-2 backdrop-blur-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View All
                  </button>
                </div>

                {photos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CameraIcon className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl blur-xl"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                      No photos yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Start by uploading some amazing memories to share with
                      your group!
                    </p>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Upload First Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Photo scroll container with enhanced styling */}
                    <div className="relative">
                      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                        {photos.slice(0, 8).map((photo, index) => (
                          <div
                            key={`preview-${photo.id}`}
                            className="flex-shrink-0 w-40 sm:w-44 cursor-pointer group relative"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <div className="relative overflow-hidden rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-2">
                              <img
                                src={photo.downloadURL.replace(
                                  "groupify-77202.appspot.com",
                                  "groupify-77202.firebasestorage.app"
                                )}
                                alt={photo.fileName}
                                className="w-full h-28 sm:h-32 object-cover rounded-lg"
                              />

                              {/* Hover overlay with enhanced effects */}
                              <div className="absolute inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
                                <div className="p-3 w-full">
                                  <p className="text-white text-sm font-medium mb-1">
                                    {new Date(
                                      photo.uploadedAt
                                    ).toLocaleDateString()}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <EyeIcon className="w-4 h-4 text-white/80" />
                                    <span className="text-white/80 text-xs">
                                      Click to view
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Floating number badge */}
                              <div className="absolute top-3 left-3 w-6 h-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show more card if there are additional photos */}
                        {photos.length > 8 && (
                          <div
                            className="flex-shrink-0 w-48 sm:w-56 h-40 sm:h-44 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300 group"
                            onClick={() => setShowAllPhotosModal(true)}
                          >
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                <span className="text-white font-bold text-lg">
                                  +{photos.length - 8}
                                </span>
                              </div>
                              <p className="text-purple-700 dark:text-purple-400 font-medium text-sm">
                                View all photos
                              </p>
                              <p className="text-purple-600 dark:text-purple-500 text-xs mt-1">
                                Click to explore
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gradient fade on scroll edges */}
                      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white/80 dark:from-gray-800/80 to-transparent pointer-events-none rounded-r-xl"></div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-purple-200/30 dark:border-purple-800/30">
                      <div className="text-center p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
                        <PhotoIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                          {photos.length}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-500">
                          Total Photos
                        </p>
                      </div>
                      <div className="text-center p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg border border-pink-200/30 dark:border-pink-800/30">
                        <ClockIcon className="w-5 h-5 text-pink-600 dark:text-pink-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-pink-700 dark:text-pink-400">
                          {photos.length > 0
                            ? Math.ceil(
                                (Date.now() -
                                  Math.min(
                                    ...photos.map((p) =>
                                      new Date(p.uploadedAt).getTime()
                                    )
                                  )) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0}
                        </p>
                        <p className="text-xs text-pink-600 dark:text-pink-500">
                          Days Active
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30">
                        <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                          {tripMembers.length}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          Contributors
                        </p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                        <SparklesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          {photos.length > 0
                            ? Math.round(
                                (photos.length /
                                  Math.max(tripMembers.length, 1)) *
                                  10
                              ) / 10
                            : 0}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                          Avg per Member
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Face Recognition Section - Enhanced with glassmorphism */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Photos With Me
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        AI-powered face recognition to find photos containing
                        you
                      </p>
                    </div>
                  </div>

                  {!isProcessingFaces && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Status Indicators */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isLoadingProfile ? (
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full text-xs backdrop-blur-sm">
                            <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Loading...
                            </span>
                          </div>
                        ) : hasProfile ? (
                          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-full text-xs backdrop-blur-sm border border-green-200 dark:border-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 dark:text-green-400 font-medium">
                              Profile Ready
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-full text-xs backdrop-blur-sm border border-orange-200 dark:border-orange-800">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-orange-700 dark:text-orange-400 font-medium">
                              No Profile
                            </span>
                          </div>
                        )}

                        {hasCachedResults() && (
                          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-full text-xs backdrop-blur-sm border border-blue-200 dark:border-blue-800">
                            <ClockIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-700 dark:text-blue-400 font-medium">
                              Previous scan
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {hasCachedResults() && !filterActive && (
                          <button
                            onClick={showCachedResults}
                            disabled={!canFilterByFace || isLoadingProfile}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-xl font-medium transition-all duration-300 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-blue-200 dark:border-blue-800"
                          >
                            <ClockIcon className="w-4 h-4" />
                            Show Previous ({cachedResults.length})
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (filterActive) {
                              setFilterActive(false);
                              setFilteredPhotos([]);
                            } else if (hasCachedResults()) {
                              handleFindMyPhotos(true);
                            } else {
                              handleFindMyPhotos(false);
                            }
                          }}
                          disabled={!canFilterByFace || isLoadingProfile}
                          className={`px-5 py-2 rounded-xl font-medium transition-all duration-300 text-sm flex items-center gap-2 backdrop-blur-sm shadow-lg ${
                            canFilterByFace && !isLoadingProfile
                              ? filterActive
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                : hasProfile
                                ? hasCachedResults()
                                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                          {filterActive
                            ? "Hide Results"
                            : hasProfile
                            ? hasCachedResults()
                              ? `Scan Again`
                              : `Find My Photos`
                            : `Need Profile`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing UI */}
                {isProcessingFaces ? (
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Processing Photos
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {getProgressPercentage()}%
                        </span>
                      </div>
                      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${getProgressPercentage()}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Status Cards - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 backdrop-blur-sm">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2 text-sm">
                          <FireIcon className="w-4 h-4" />
                          Status
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                          {faceRecognitionProgress.phase || "Processing..."}
                        </p>
                        {faceRecognitionProgress.estimatedTimeRemaining && (
                          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                            ⏱️{" "}
                            {formatTimeRemaining(
                              faceRecognitionProgress.estimatedTimeRemaining
                            )}
                          </p>
                        )}
                      </div>

                      {faceRecognitionProgress.matches?.length > 0 && (
                        <div className="bg-green-50/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 backdrop-blur-sm">
                          <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2 text-sm">
                            <CheckIcon className="w-4 h-4" />
                            Matches Found
                          </h4>
                          <p className="text-green-700 dark:text-green-300 text-2xl font-bold">
                            {faceRecognitionProgress.matches.length}
                          </p>
                          <p className="text-green-600 dark:text-green-400 text-xs">
                            Found so far...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancelFaceRecognition}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Cancel Processing
                    </button>
                  </div>
                ) : filterActive && filteredPhotos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MagnifyingGlassIcon className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                      No matches found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                      No photos containing you were found using your face
                      profile.
                    </p>
                  </div>
                ) : filterActive ? (
                  <div className="space-y-6">
                    {/* Cache Information Banner */}
                    {hasCachedResults() && cachedResults === filteredPhotos && (
                      <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="font-semibold text-blue-800 dark:text-blue-400 text-sm">
                                Showing previous results
                              </p>
                              <p className="text-blue-600 dark:text-blue-400 text-xs">
                                Scanned on{" "}
                                {new Date(
                                  lastScanTimestamp
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFindMyPhotos(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors backdrop-blur-sm"
                          >
                            Scan Again
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Photos Grid - Responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredPhotos.map((photo) => (
                        <div
                          key={`filtered-${photo.id}`}
                          className="group cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <div className="relative overflow-hidden rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-2">
                            <img
                              src={photo.downloadURL.replace(
                                "groupify-77202.appspot.com",
                                "groupify-77202.firebasestorage.app"
                              )}
                              alt={photo.fileName}
                              className="w-full h-28 sm:h-32 object-cover rounded-lg"
                            />

                            {/* Match confidence badge */}
                            {photo.faceMatch && (
                              <div className="absolute top-3 right-3">
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm ${
                                    photo.faceMatch.matchType === "strong"
                                      ? "bg-green-500/90"
                                      : "bg-blue-500/90"
                                  }`}
                                >
                                  {(photo.faceMatch.confidence * 100).toFixed(
                                    0
                                  )}
                                  %
                                </div>
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
                              <div className="p-2 w-full">
                                <p className="text-white text-xs font-medium">
                                  {new Date(
                                    photo.uploadedAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MagnifyingGlassIcon className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                      {hasProfile
                        ? "Ready to find your photos!"
                        : "Setup your face profile"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md mx-auto">
                      {hasProfile
                        ? 'Click "Find My Photos" to automatically identify photos containing you using AI face recognition.'
                        : "You need to create a face profile in your Dashboard before you can find photos with yourself."}
                    </p>
                    {!hasProfile && (
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-3 mx-auto"
                      >
                        <SparklesIcon className="w-5 h-5" />
                        Setup Face Profile
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Enhanced with glassmorphism */}
          <div className="xl:col-span-1 space-y-6">
            {/* Invite People Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <PlusIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                      Invite People
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Add friends to the trip
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-200/30 dark:border-emerald-800/30">
                  <InviteFriendDropdown
                    currentUser={currentUser}
                    onSelect={handleInviteFriend}
                    excludedUserIds={trip.members}
                  />
                </div>
              </div>
            </div>

            {/* Trip Members Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      Trip Members
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                        {tripMembers.length}
                      </span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      View member profiles
                    </p>
                  </div>
                </div>

                {tripMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserGroupIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No members found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-700 scrollbar-track-transparent">
                    {[...tripMembers]
                      .sort((a, b) => {
                        if (a.uid === currentUser.uid) return -1;
                        if (b.uid === currentUser.uid) return 1;
                        if (a.uid === trip.createdBy) return -1;
                        if (b.uid === trip.createdBy) return 1;
                        return (a.displayName || a.email || "").localeCompare(
                          b.displayName || b.email || ""
                        );
                      })
                      .map((member) => (
                        <div
                          key={member.uid}
                          className="group/member flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-orange-900/20 hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/30 dark:hover:to-orange-900/40 transition-all duration-300 cursor-pointer border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm"
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
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={
                                  member.photoURL ||
                                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                                }
                                alt="Avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                              />
                              {member.uid === currentUser.uid && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate text-sm">
                                {member.displayName ||
                                  member.email ||
                                  member.uid}
                                {member.uid === currentUser.uid && (
                                  <span className="text-green-600 dark:text-green-400 ml-1">
                                    (You)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <div className="flex-shrink-0">
                            {member.uid === trip.createdBy ? (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                                Creator
                              </span>
                            ) : trip.admins?.includes(member.uid) ? (
                              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                                Admin
                              </span>
                            ) : (
                              <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
                                Member
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals - Enhanced with glassmorphism */}
        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUserId={currentUser?.uid}
            isAdmin={isAdmin}
            isFriend={friends.some((f) => f.uid === selectedUser.uid)}
            isPending={pendingRequests.some((r) => r.from === selectedUser.uid)}
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

        {/* Photo Modal - Enhanced for mobile */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-6xl max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={selectedPhoto.downloadURL.replace(
                  "groupify-77202.appspot.com",
                  "groupify-77202.firebasestorage.app"
                )}
                alt="Full view"
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* Photo info overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-4 text-white">
                <p className="font-medium">{selectedPhoto.fileName}</p>
                <p className="text-sm text-white/80">
                  {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Photos Modal - Enhanced for mobile */}
        {showAllPhotosModal && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAllPhotosModal(false)}
          >
            <div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-7xl max-h-[90vh] overflow-hidden w-full border border-white/20 dark:border-gray-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <PhotoIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                      All Trip Photos
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                        {photos.length}
                      </span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {selectMode && selectedPhotos.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedPhotos}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 text-sm flex items-center gap-2 shadow-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete {selectedPhotos.length}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectMode(!selectMode);
                          setSelectedPhotos([]);
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm shadow-lg ${
                          selectMode
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
                            : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                        }`}
                      >
                        {selectMode ? "Cancel" : "Select Photos"}
                      </button>
                    )}
                    <button
                      onClick={() => setShowAllPhotosModal(false)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 text-sm shadow-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {photos.map((photo) => {
                      const isSelected = selectedPhotos.includes(photo.id);
                      return (
                        <div
                          key={`modal-${photo.id}`}
                          className={`relative cursor-pointer rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 ${
                            selectMode && !isSelected ? "opacity-60" : ""
                          }`}
                          onClick={() => {
                            if (selectMode) {
                              setSelectedPhotos((prev) =>
                                prev.includes(photo.id)
                                  ? prev.filter((id) => id !== photo.id)
                                  : [...prev, photo.id]
                              );
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
                            className="w-full h-24 sm:h-28 object-cover rounded-lg"
                          />
                          {selectMode && (
                            <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                              {isSelected && (
                                <CheckIcon className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                            <p className="text-white text-xs font-medium">
                              {new Date(photo.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications - Enhanced */}
        {showSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-green-400/30">
            <div className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium">
                Friend request sent successfully!
              </span>
            </div>
          </div>
        )}

        {cancelSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-red-400/30">
            <div className="flex items-center gap-3">
              <XMarkIcon className="w-5 h-5" />
              <span className="font-medium">{cancelSuccess}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailView;
