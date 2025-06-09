// client/src/pages/TripDetail.jsx

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
  getPendingFriendRequests,
} from "../services/firebase/users";
import { getFaceProfileFromStorage } from "../services/firebase/faceProfiles";

// 🔹 Face Recognition (Simplified)
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  getFaceProfile,
  createFaceProfile,
} from "../services/faceRecognition";

// 🔹 Components
import PhotoUpload from "../components/photos/PhotoUpload";
import InviteFriendDropdown from "../components/trips/InviteFriendDropdown";
import UserProfileModal from "../components/profile/UserProfileModal";

// 🔹 Icons
import {
  MapIcon,
  UserCircleIcon,
  UserGroupIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  PlusIcon,
  CameraIcon,
  TrashIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Navigation items (same as Dashboard)
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: MapIcon, path: '/dashboard' },
    { id: 'photos', name: 'My Photos', icon: CameraIcon, path: '/photos' },
    { id: 'friends', name: 'Friends', icon: UserGroupIcon, path: '/friends' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, path: '/notifications' },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-xl text-white/80 font-medium">Loading your amazing trip...</p>
          <p className="text-purple-300 mt-2">Getting everything ready</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-red-100 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex w-full">
      {/* Sidebar - Same as Dashboard */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Groupify</h1>
                <p className="text-sm text-gray-500">Trip View</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {photos.length > 0 && (
              <img
                src={photos[0].downloadURL.replace(
                  "groupify-77202.appspot.com",
                  "groupify-77202.firebasestorage.app"
                )}
                alt="Trip"
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            )}
            <div>
              <p className="font-semibold text-gray-800">{trip.name}</p>
              <p className="text-sm text-gray-500">{trip.location || "No location"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
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
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 w-full">
              {/* Left section - Mobile menu button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <Bars3Icon className="w-6 h-6 text-gray-600" />
                </button>
                
                {/* Trip title */}
                <div className="hidden sm:block">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {trip.name}
                  </h2>
                  <p className="text-sm text-gray-500">{photos.length} photos</p>
                </div>
              </div>

              {/* Center - Logo for mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Groupify</span>
              </div>

              {/* Right section - User info */}
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content - 3 columns */}
              <div className="lg:col-span-3 space-y-6">
                {/* Trip Details Card */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Trip Details</h2>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{photos.length} photos</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {isAdmin && (
                          <button
                            onClick={() => toast.info("Edit Trip feature coming soon!")}
                            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Trip
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowUploadForm(!showUploadForm)}
                          className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {showUploadForm ? "Cancel Upload" : "Add Photos"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {trip.description ? (
                      <p className="text-gray-700 text-lg leading-relaxed">{trip.description}</p>
                    ) : (
                      <p className="text-gray-500 italic text-lg">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Upload Form */}
                {showUploadForm && (
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        Upload New Photos
                      </h2>
                      <PhotoUpload
                        tripId={tripId}
                        onPhotoUploaded={handlePhotoUploaded}
                      />
                    </div>
                  </div>
                )}

                {/* All Photos Section */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        All Trip Photos
                        <span className="text-lg text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          {photos.length}
                        </span>
                      </h2>
                      <button
                        onClick={() => setShowAllPhotosModal(true)}
                        className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          View All
                        </span>
                      </button>
                    </div>

                    {photos.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos yet</h3>
                        <p className="text-gray-500">Start by uploading some amazing memories!</p>
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                        {photos.slice(0, 8).map((photo, index) => (
                          <div
                            key={`preview-${photo.id}`}
                            className="flex-shrink-0 w-56 cursor-pointer group relative"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <div className="relative overflow-hidden rounded-2xl shadow-lg transform group-hover:scale-105 transition-all duration-500">
                              <img
                                src={photo.downloadURL.replace(
                                  "groupify-77202.appspot.com",
                                  "groupify-77202.firebasestorage.app"
                                )}
                                alt={photo.fileName}
                                className="w-full h-36 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                                <p className="text-white text-sm font-medium">
                                  {new Date(photo.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {photos.length > 8 && (
                          <div 
                            className="flex-shrink-0 w-56 h-36 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl border-2 border-dashed border-purple-300 flex items-center justify-center cursor-pointer hover:from-purple-200 hover:to-indigo-200 transition-all duration-300"
                            onClick={() => setShowAllPhotosModal(true)}
                          >
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-lg">+{photos.length - 8}</span>
                              </div>
                              <p className="text-purple-700 font-medium">View all photos</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Face Recognition Section */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          Photos With Me
                        </h2>
                        <p className="text-gray-600">AI-powered face recognition to find photos containing you</p>
                      </div>

                      {!isProcessingFaces && (
                        <div className="flex items-center gap-4">
                          {/* Status Indicators */}
                          <div className="flex items-center gap-3">
                            {isLoadingProfile ? (
                              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                <span className="text-sm text-gray-600">Loading...</span>
                              </div>
                            ) : hasProfile ? (
                              <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-700 font-medium">Profile Ready</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-orange-100 px-3 py-2 rounded-full">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-orange-700 font-medium">No Profile</span>
                              </div>
                            )}

                            {hasCachedResults() && (
                              <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-full">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                <span className="text-sm text-blue-700 font-medium">Previous scan</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {hasCachedResults() && !filterActive && (
                              <button
                                onClick={showCachedResults}
                                disabled={!canFilterByFace || isLoadingProfile}
                                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                </svg>
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
                              className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 ${
                                canFilterByFace && !isLoadingProfile
                                  ? filterActive
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                                    : hasProfile
                                    ? hasCachedResults()
                                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              {filterActive
                                ? "Hide My Photos"
                                : hasProfile
                                ? hasCachedResults()
                                  ? `Scan Again (${photos.length})`
                                  : `Find My Photos (${photos.length})`
                                : `Need Profile First`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Processing UI with modern design */}
                    {isProcessingFaces ? (
                      <div className="space-y-6">
                        {/* Modern Progress Bar */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Processing Photos</span>
                            <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
                          </div>
                          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                              style={{ width: `${getProgressPercentage()}%` }}
                            >
                              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Status
                            </h4>
                            <p className="text-blue-700 font-medium">
                              {faceRecognitionProgress.phase || "Processing..."}
                            </p>
                            {faceRecognitionProgress.currentPhoto && (
                              <p className="text-blue-600 text-sm mt-2 truncate">
                                Current: {faceRecognitionProgress.currentPhoto}
                              </p>
                            )}
                            {faceRecognitionProgress.estimatedTimeRemaining && (
                              <p className="text-blue-600 font-medium text-sm mt-2">
                                ⏱️ {formatTimeRemaining(faceRecognitionProgress.estimatedTimeRemaining)}
                              </p>
                            )}
                          </div>

                          {faceRecognitionProgress.matches?.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Matches Found
                              </h4>
                              <p className="text-green-700 text-2xl font-bold">
                                {faceRecognitionProgress.matches.length}
                              </p>
                              <p className="text-green-600 text-sm">
                                Found so far...
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Cancel Button */}
                        <button
                          onClick={handleCancelFaceRecognition}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Processing
                        </button>
                      </div>
                    ) : filterActive && filteredPhotos.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No matches found</h3>
                        <p className="text-gray-500">No photos containing you were found using your face profile.</p>
                      </div>
                    ) : filterActive ? (
                      <div className="space-y-6">
                        {/* Cache Information Banner */}
                        {hasCachedResults() && cachedResults === filteredPhotos && (
                          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="font-semibold text-blue-800">Showing previous results</p>
                                  <p className="text-blue-600 text-sm">
                                    Scanned on {new Date(lastScanTimestamp).toLocaleDateString()} at{" "}
                                    {new Date(lastScanTimestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleFindMyPhotos(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                              >
                                Scan Again
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Photos Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredPhotos.map((photo) => (
                            <div
                              key={`filtered-${photo.id}`}
                              className="group cursor-pointer"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <div className="relative overflow-hidden rounded-2xl shadow-lg transform group-hover:scale-105 transition-all duration-500">
                                <img
                                  src={photo.downloadURL.replace(
                                    "groupify-77202.appspot.com",
                                    "groupify-77202.firebasestorage.app"
                                  )}
                                  alt={photo.fileName}
                                  className="w-full h-40 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Match confidence badge */}
                                {photo.faceMatch && (
                                  <div className="absolute top-3 right-3">
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                                      photo.faceMatch.matchType === "strong" 
                                        ? "bg-green-500" 
                                        : "bg-blue-500"
                                    }`}>
                                      {(photo.faceMatch.confidence * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-3">
                          {hasProfile ? "Ready to find your photos!" : "Setup your face profile"}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          {hasProfile
                            ? 'Click "Find My Photos" to automatically identify photos containing you using AI face recognition.'
                            : "You need to create a face profile in your Dashboard before you can find photos with yourself."}
                        </p>
                        {!hasProfile && (
                          <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            Setup Face Profile
                          </button>
                        )}
                      </div>
                    )}

                    {/* Completion Summary */}
                    {!isProcessingFaces && faceRecognitionProgress.totalMatches !== undefined && (
                      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-indigo-800">Face Recognition Complete!</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-indigo-600">{faceRecognitionProgress.totalMatches}</div>
                            <div className="text-indigo-700">Total matches</div>
                          </div>
                          <div className="bg-white/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{faceRecognitionProgress.strongMatches}</div>
                            <div className="text-green-700">Strong matches</div>
                          </div>
                          <div className="bg-white/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600">{faceRecognitionProgress.averageConfidence}%</div>
                            <div className="text-blue-700">Avg confidence</div>
                          </div>
                          <div className="bg-white/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-purple-600">📚</div>
                            <div className="text-purple-700">Results cached</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar - 1 column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Invite People Card */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      Invite People
                    </h2>
                    <InviteFriendDropdown
                      currentUser={currentUser}
                      onSelect={handleInviteFriend}
                      excludedUserIds={trip.members}
                    />
                  </div>
                </div>

                {/* Trip Members Card */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      Trip Members
                      <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        {tripMembers.length}
                      </span>
                    </h2>

                    {tripMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No members found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
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
                              className="group flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300 cursor-pointer"
                              onClick={async () => {
                                const isFriendNow = friends.includes(member.uid);
                                const status = await checkFriendStatus(currentUser.uid, member.uid);
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
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                  {member.uid === currentUser.uid && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 truncate">
                                    {member.displayName || member.email || member.uid}
                                    {member.uid === currentUser.uid && (
                                      <span className="text-green-600 ml-1">(You)</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Role Badge */}
                              <div className="flex-shrink-0">
                                {member.uid === trip.createdBy ? (
                                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    Creator
                                  </span>
                                ) : trip.admins?.includes(member.uid) ? (
                                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
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

            {/* Modals and overlays remain the same but with enhanced styling */}
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

            {/* Enhanced Photo Modal */}
            {selectedPhoto && (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedPhoto(null)}
              >
                <div className="relative max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl">
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
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced All Photos Modal */}
            {showAllPhotosModal && (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowAllPhotosModal(false)}
              >
                <div
                  className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl max-h-[85vh] overflow-hidden border border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        All Trip Photos
                        <span className="text-lg text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          {photos.length}
                        </span>
                      </h3>
                      <div className="flex items-center gap-3">
                        {selectMode && selectedPhotos.length > 0 && (
                          <button
                            onClick={handleDeleteSelectedPhotos}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete {selectedPhotos.length}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectMode(!selectMode);
                              setSelectedPhotos([]);
                            }}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
                              selectMode 
                                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
                                : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                            }`}
                          >
                            {selectMode ? "Cancel" : "Select Photos"}
                          </button>
                        )}
                        <button
                          onClick={() => setShowAllPhotosModal(false)}
                          className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {photos.map((photo) => {
                          const isSelected = selectedPhotos.includes(photo.id);
                          return (
                            <div
                              key={`modal-${photo.id}`}
                              className={`relative cursor-pointer rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 ${
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
                                className="w-full h-32 object-cover"
                              />
                              {selectMode && (
                                <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded-full bg-white flex items-center justify-center shadow-lg">
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
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

            {/* Enhanced Toast Notifications */}
            {showSuccess && (
              <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform animate-bounce">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Friend request sent successfully!
                </div>
              </div>
            )}
            
            {cancelSuccess && (
              <div className="fixed top-8 right-8 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform animate-bounce">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {cancelSuccess}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TripDetail;