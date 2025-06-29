// client/src/components/dashboard/TripDetailView.jsx

// **************** 🔹 Imports  ****************

// 🔹 React & Router
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTripInvitations } from "../hooks/useTripInvitations";
import PhotosSection from "./PhotosSection";
import TripHeader from "./TripHeader";
import PhotoModal from "./PhotoModal";
import PhotoGalleryModal from "./PhotoGalleryModal";
import FaceRecognitionSection from "./FaceRecognitionSection";
import MembersSection from "./MembersSection";
import TripSidebar from "./TripSidebar";

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
import { MAX_PHOTOS_PER_TRIP } from "../../services/firebase/trips";

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
} from "../../services/faceRecognitionService";

// 🔹 Components
import PhotoUpload from "../photos/PhotoUpload";
import InviteFriendDropdown from "../trips/InviteFriendDropdown";
import UserProfileModal from "../profile/UserProfileModal";
import EditTripModal from "../trips/EditTripModal";

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
  PencilIcon,
} from "@heroicons/react/24/outline";

const TripDetailView = ({ tripId: propTripId }) => {
  const { tripId: paramTripId } = useParams();
  const tripId = propTripId || paramTripId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { handleInviteFriend } = useTripInvitations(tripId, currentUser);

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [mobileActiveTab, setMobileActiveTab] = useState("trip");

  // Auto-load face profile on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserFaceProfile();
    }
  }, [currentUser]);

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
  const handleFindMyPhotos = async () => {
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
        toast.success(`Found ${matches.length} matching photos!`);
        console.log(`✅ Found ${matches.length} matching photos`);
      } else {
        console.log("ℹ️ No matching photos found");
        setFilteredPhotos([]);
        setFilterActive(true); // Still show the section but with "no matches" message
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

  const checkPhotoLimit = () => {
    return photos.length < MAX_PHOTOS_PER_TRIP;
  };

  const getRemainingPhotoSlots = () => {
    return Math.max(0, MAX_PHOTOS_PER_TRIP - photos.length);
  };

  const getPhotoLimitStatus = () => {
    const remaining = getRemainingPhotoSlots();
    if (remaining === 0) return "full";
    if (remaining <= 5) return "warning";
    return "normal";
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
      // Start face recognition
      handleFindMyPhotos();
    }
  };

  const handleDeleteSelectedPhotos = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeletePhotos = async () => {
    setShowDeleteConfirm(false);

    const deletingToast = toast.loading(
      `Deleting ${selectedPhotos.length} photos...`
    );

    try {
      // Store photos to delete for proper cleanup
      const photosToDelete = photos.filter((photo) =>
        selectedPhotos.includes(photo.id)
      );

      // Delete each photo from storage and database
      for (const photoId of selectedPhotos) {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) continue;

        // Delete from Firebase Storage
        const photoRef = ref(storage, `photos/${tripId}/${photo.fileName}`);
        await deleteObject(photoRef);

        // Delete from Firestore - tripPhotos collection
        const tripPhotoRef = doc(db, "tripPhotos", photoId);
        await deleteDoc(tripPhotoRef);

        // Delete from Firestore - photos collection (main photos collection)
        const photoRef2 = doc(db, "photos", photoId);
        await deleteDoc(photoRef2);
      }

      // Update the photos state by removing deleted photos
      setPhotos((prevPhotos) =>
        prevPhotos.filter((photo) => !selectedPhotos.includes(photo.id))
      );

      // Also update filtered photos if face filter is active
      if (filterActive && filteredPhotos.length > 0) {
        setFilteredPhotos((prevFiltered) =>
          prevFiltered.filter((photo) => !selectedPhotos.includes(photo.id))
        );
      }

      // Update trip photo count
      if (trip) {
        setTrip((prevTrip) => ({
          ...prevTrip,
          photoCount: Math.max(
            (prevTrip.photoCount || 0) - selectedPhotos.length,
            0
          ),
        }));
      }

      toast.dismiss(deletingToast);
      toast.success(`${selectedPhotos.length} photos deleted successfully`);

      // Reset selection state
      setSelectedPhotos([]);
      setSelectMode(false);

      // Force re-render
      setShowAllPhotosModal(false);
      setTimeout(() => {
        setShowAllPhotosModal(true);
      }, 100);
    } catch (error) {
      console.error("Failed to delete selected photos:", error);
      toast.dismiss(deletingToast);

      if (error.code === "storage/unauthorized") {
        toast.error(
          "Permission denied. You may not have permission to delete these photos."
        );
      } else {
        toast.error("An error occurred while deleting photos.");
      }
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
    // Check if adding these photos would exceed the limit
    const totalAfterUpload = photos.length + uploadedPhotos.length;

    if (totalAfterUpload > MAX_PHOTOS_PER_TRIP) {
      const allowedPhotos = uploadedPhotos.slice(
        0,
        MAX_PHOTOS_PER_TRIP - photos.length
      );
      const rejectedCount = uploadedPhotos.length - allowedPhotos.length;

      toast.error(
        `Photo limit exceeded! Only ${allowedPhotos.length} photos were uploaded. ${rejectedCount} photos were rejected.`
      );

      if (allowedPhotos.length > 0) {
        setPhotos((prev) => [...allowedPhotos, ...prev]);
        if (trip) {
          setTrip((prevTrip) => ({
            ...prevTrip,
            photoCount: (prevTrip.photoCount || 0) + allowedPhotos.length,
          }));
        }
      }
    } else {
      setPhotos((prev) => [...uploadedPhotos, ...prev]);
      if (trip) {
        setTrip((prevTrip) => ({
          ...prevTrip,
          photoCount: (prevTrip.photoCount || 0) + uploadedPhotos.length,
        }));
      }
      toast.success(`${uploadedPhotos.length} photos uploaded successfully!`);
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
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <TripHeader
          trip={trip}
          photos={photos}
          tripMembers={tripMembers}
          isAdmin={isAdmin}
          showUploadForm={showUploadForm}
          onEditTrip={() => setShowEditModal(true)}
          onToggleUpload={() => setShowUploadForm(!showUploadForm)}
          getPhotoLimitStatus={() => getPhotoLimitStatus()}
          getRemainingPhotoSlots={() => getRemainingPhotoSlots()}
          MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
          mobileActiveTab={mobileActiveTab}
          onMobileTabChange={setMobileActiveTab}
        />

        {/* Main Content Grid - Enhanced with glassmorphism */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Takes 3 columns on xl screens */}
          <div
            className={`xl:col-span-2 space-y-6 ${
              mobileActiveTab === "trip" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Upload Form - Enhanced with limit checking */}
            {showUploadForm && (
              <div className="space-y-4">
                {/* Photo limit warning */}
                {getPhotoLimitStatus() === "full" ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
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
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-red-800 dark:text-red-400">
                            Photo Limit Reached
                          </h3>
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            This trip has reached the maximum of{" "}
                            {MAX_PHOTOS_PER_TRIP} photos. Please delete some
                            photos before uploading new ones.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : getPhotoLimitStatus() === "warning" ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
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
                              d="M12 9v2m0 4h.01M12 17h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-yellow-800 dark:text-yellow-400">
                            Almost Full
                          </h3>
                          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                            Only {getRemainingPhotoSlots()} photo slots
                            remaining out of {MAX_PHOTOS_PER_TRIP}.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* PhotoUpload Component with limits */}
                <PhotoUpload
                  tripId={tripId}
                  onPhotoUploaded={handlePhotoUploaded}
                  maxPhotos={MAX_PHOTOS_PER_TRIP}
                  currentPhotoCount={photos.length}
                  showLimitWarning={getPhotoLimitStatus() === "warning"}
                  limitWarningText={`Only ${getRemainingPhotoSlots()} photo slots remaining out of ${MAX_PHOTOS_PER_TRIP}.`}
                  disabled={getPhotoLimitStatus() === "full"}
                />
              </div>
            )}

            <PhotosSection
              photos={photos}
              onPhotoClick={setSelectedPhoto}
              onViewAllClick={() => setShowAllPhotosModal(true)}
              onRandomPhotoClick={() => {
                const randomIndex = Math.floor(Math.random() * photos.length);
                setSelectedPhoto(photos[randomIndex]);
              }}
              onUploadClick={() => setShowUploadForm(true)}
              tripMembers={tripMembers}
              MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
            />

            <FaceRecognitionSection
              photos={photos}
              currentUser={currentUser}
              filteredPhotos={filteredPhotos}
              filterActive={filterActive}
              isProcessing={isProcessingFaces}
              hasProfile={hasProfile}
              isLoadingProfile={isLoadingProfile}
              progress={faceRecognitionProgress}
              canFilterByFace={canFilterByFace}
              onFindPhotos={handleFindMyPhotos}
              onCancelProcessing={handleCancelFaceRecognition}
              onClearFilter={() => {
                setFilterActive(false);
                setFilteredPhotos([]);
              }}
            />
          </div>

          <TripSidebar
            tripMembers={tripMembers}
            trip={trip}
            currentUser={currentUser}
            isAdmin={isAdmin}
            friends={friends}
            mobileActiveTab={mobileActiveTab}
            onMemberClick={async (member) => {
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
            onInviteFriend={handleInviteFriend}
          />
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

        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrashIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Delete Photos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {selectedPhotos.length}
                    </span>{" "}
                    selected photo{selectedPhotos.length > 1 ? "s" : ""}? This
                    will permanently remove{" "}
                    {selectedPhotos.length > 1 ? "them" : "it"} from the trip.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeletePhotos}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 text-sm shadow-lg"
                  >
                    Delete {selectedPhotos.length} Photo
                    {selectedPhotos.length > 1 ? "s" : ""}
                  </button>
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
      {/* Edit Trip Modal */}
      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={trip}
        onTripUpdated={(updatedTrip) => {
          setTrip(updatedTrip);
          setShowEditModal(false);
          // Modal already shows success message, no duplicate toast needed
        }}
        onTripDeleted={(deletedTripId) => {
          setShowEditModal(false);

          // Call parent callback if available (for dashboard integration)
          if (onTripDeleted) {
            onTripDeleted(deletedTripId);
          }

          // Navigate to dashboard as backup/fallback
          setTimeout(() => {
            navigate("/dashboard", {
              state: {
                refreshTrips: true,
                deletedTripId: deletedTripId,
              },
            });
          }, 100);
        }}
      />
    </div>
  );
};

export default TripDetailView;
