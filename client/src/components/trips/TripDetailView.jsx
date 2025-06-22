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
 // Handle keyboard navigation for selected photo
  useEffect(() => {
  const handleKeyPress = (e) => {
    if (!selectedPhoto) return;

    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedPhoto(photos[currentIndex - 1]);
        } else {
          setSelectedPhoto(photos[photos.length - 1]); // Loop to last
        }
        break;
      
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < photos.length - 1) {
          setSelectedPhoto(photos[currentIndex + 1]);
        } else {
          setSelectedPhoto(photos[0]); // Loop to first
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setSelectedPhoto(null);
        break;
    }
  };

  // Only add listener when modal is open
  if (selectedPhoto) {
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }
}, [selectedPhoto, photos]);

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
  if (remaining === 0) return 'full';
  if (remaining <= 5) return 'warning';
  return 'normal';
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
    const allowedPhotos = uploadedPhotos.slice(0, MAX_PHOTOS_PER_TRIP - photos.length);
    const rejectedCount = uploadedPhotos.length - allowedPhotos.length;
    
    toast.error(`Photo limit exceeded! Only ${allowedPhotos.length} photos were uploaded. ${rejectedCount} photos were rejected.`);
    
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
        // Use toast.error instead of toast.warning, or use a custom styled toast
        toast(`${friend.displayName} already has a pending invite.`, {
          style: {
            borderRadius: "10px",
            background: "#fdf6e3",
            color: "#333",
            border: "1px solid #f59e0b",
          },
          icon: "⚠️",
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
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Enhanced Header Section with glassmorphism */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col gap-3 sm:gap-6">
              {/* Left side - Navigation & Trip Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {trip.name}
                      </h1>
                      {trip.location && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          {trip.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Trip Stats */}
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                      <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-bold text-base sm:text-lg lg:text-xl text-indigo-600 dark:text-indigo-400">
                        {photos.length}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      Photos
                    </p>
                  </div>

                  <div className="w-px h-6 sm:h-8 bg-gray-300 dark:bg-gray-600"></div>

                  <div className="text-center">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                      <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-bold text-base sm:text-lg lg:text-xl text-purple-600 dark:text-purple-400">
                        {tripMembers.length}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      Members
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row gap-2 w-full sm:w-auto">
                  {isAdmin && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full sm:w-auto px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                      <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edit Trip
                    </button>
                  )}
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    disabled={getPhotoLimitStatus() === 'full' && !showUploadForm}
                    className={`w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm ${
                      getPhotoLimitStatus() === 'full' && !showUploadForm
                        ? "bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        : showUploadForm
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        : getPhotoLimitStatus() === 'warning'
                        ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    }`}
                  >
                    {getPhotoLimitStatus() === 'full' && !showUploadForm ? (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        Limit Reached
                      </>
                    ) : showUploadForm ? (
                      <>
                        <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        Add Photos ({getRemainingPhotoSlots()} left)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trip Description */}
            {trip.description && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {trip.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="xl:hidden relative">
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
            <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {/* Background slider */}
              <div
                className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-300 ease-in-out transform ${
                  mobileActiveTab === "trip"
                    ? "translate-x-0"
                    : "translate-x-full"
                }`}
              />

              {/* Tab buttons */}
              <button
                onClick={() => setMobileActiveTab("trip")}
                className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                  mobileActiveTab === "trip"
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>Trip</span>
                </div>
              </button>

              <button
                onClick={() => setMobileActiveTab("members")}
                className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                  mobileActiveTab === "members"
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>Members</span>
                </div>
              </button>
            </div>
          </div>
        </div>

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
                {getPhotoLimitStatus() === 'full' ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-red-800 dark:text-red-400">Photo Limit Reached</h3>
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            This trip has reached the maximum of {MAX_PHOTOS_PER_TRIP} photos. 
                            Please delete some photos before uploading new ones.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : getPhotoLimitStatus() === 'warning' ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-yellow-800 dark:text-yellow-400">Almost Full</h3>
                          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                            Only {getRemainingPhotoSlots()} photo slots remaining out of {MAX_PHOTOS_PER_TRIP}.
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
                  showLimitWarning={getPhotoLimitStatus() === 'warning'}
                  limitWarningText={`Only ${getRemainingPhotoSlots()} photo slots remaining out of ${MAX_PHOTOS_PER_TRIP}.`}
                  disabled={getPhotoLimitStatus() === 'full'}
                />
              </div>
            )}

            {/* Photos Preview Section - Enhanced */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3">
                        All Trip Photos
                        <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                          {photos.length}
                        </span>
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Collection of shared memories
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAllPhotosModal(true)}
                    className="w-full sm:w-auto px-3 py-2 sm:px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    View All
                  </button>
                </div>

                {photos.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="relative mb-4 sm:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl sm:rounded-2xl blur-xl"></div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      No photos yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4 sm:mb-6">
                      Start by uploading some amazing memories to share with
                      your group!
                    </p>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto text-sm"
                    >
                      <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Upload First Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Photo scroll container with enhanced styling */}
                    <div className="relative">
                      <div className="flex overflow-x-auto space-x-2 sm:space-x-3 pb-3 sm:pb-4 px-1 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                        {photos.slice(0, 8).map((photo, index) => (
                          <div
                            key={`preview-${photo.id}`}
                            className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-44 cursor-pointer group relative"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <div className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1.5 sm:p-2">
                              <img
                                src={photo.downloadURL.replace(
                                  "groupify-77202.appspot.com",
                                  "groupify-77202.firebasestorage.app"
                                )}
                                alt={photo.fileName}
                                className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-md sm:rounded-lg"
                              />

                              {/* Hover overlay with enhanced effects */}
                              <div className="absolute inset-1.5 sm:inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md sm:rounded-lg flex items-end">
                                <div className="p-1.5 sm:p-3 w-full">
                                  <p className="text-white text-xs sm:text-sm font-medium mb-1">
                                    {new Date(
                                      photo.uploadedAt
                                    ).toLocaleDateString()}
                                  </p>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                                    <span className="text-white/80 text-xs">
                                      Click to view
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Floating number badge */}
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show more card if there are additional photos */}
                        {photos.length > 8 && (
                          <div
                            className="flex-shrink-0 w-32 sm:w-48 md:w-56 h-20 sm:h-40 md:h-44 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg sm:rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300 group"
                            onClick={() => setShowAllPhotosModal(true)}
                          >
                            <div className="text-center">
                              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                <span className="text-white font-bold text-sm sm:text-lg">
                                  +{photos.length - 8}
                                </span>
                              </div>
                              <p className="text-purple-700 dark:text-purple-400 font-medium text-xs sm:text-sm">
                                View all photos
                              </p>
                              <p className="text-purple-600 dark:text-purple-500 text-xs mt-1 hidden sm:block">
                                Click to explore
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gradient fade on scroll edges */}
                      <div className="absolute top-0 right-0 w-6 sm:w-8 h-full bg-gradient-to-l from-white/80 dark:from-gray-800/80 to-transparent pointer-events-none rounded-r-xl"></div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-purple-200/30 dark:border-purple-800/30">
                      <div className="text-center p-2 sm:p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
                        <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                        <p className="text-sm sm:text-lg font-bold text-purple-700 dark:text-purple-400">
                          {photos.length}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-500">
                          Total Photos
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg border border-pink-200/30 dark:border-pink-800/30">
                        <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400 mx-auto mb-1" />
                        <p className="text-sm sm:text-lg font-bold text-pink-700 dark:text-pink-400">
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
                      <div className="text-center p-2 sm:p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30">
                        <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-sm sm:text-lg font-bold text-blue-700 dark:text-blue-400">
                          {tripMembers.length}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          Contributors
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                        <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                        <p className="text-sm sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
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
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                        Photos With Me
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        AI-powered face recognition to find photos containing
                        you
                      </p>
                    </div>
                  </div>

                  {!isProcessingFaces && (
                    <div className="flex flex-col gap-2 sm:gap-3">
                      {/* Status Indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {isLoadingProfile ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm">
                            <div className="animate-spin w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Loading...
                            </span>
                          </div>
                        ) : hasProfile ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-green-100 dark:bg-green-900/30 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm border border-green-200 dark:border-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 dark:text-green-400 font-medium">
                              Profile Ready
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-orange-100 dark:bg-orange-900/30 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs backdrop-blur-sm border border-orange-200 dark:border-orange-800">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-orange-700 dark:text-orange-400 font-medium">
                              No Profile
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            if (filterActive) {
                              setFilterActive(false);
                              setFilteredPhotos([]);
                            } else {
                              handleFindMyPhotos();
                            }
                          }}
                          disabled={!canFilterByFace || isLoadingProfile}
                          className={`w-full sm:w-auto px-3 py-2 sm:px-5 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg ${
                            canFilterByFace && !isLoadingProfile
                              ? filterActive
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                : hasProfile
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          {filterActive
                            ? "Hide Results"
                            : hasProfile
                            ? "Find My Photos"
                            : "Need Profile"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing UI */}
                {isProcessingFaces ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          Processing Photos
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {getProgressPercentage()}%
                        </span>
                      </div>
                      <div className="relative w-full h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${getProgressPercentage()}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Status Cards - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                          <FireIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          Status
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 font-medium text-xs sm:text-sm">
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
                        <div className="bg-green-50/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                          <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                            <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            Matches Found
                          </h4>
                          <p className="text-green-700 dark:text-green-300 text-xl sm:text-2xl font-bold">
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
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm text-sm"
                    >
                      <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Cancel Processing
                    </button>
                  </div>
                ) : filterActive && filteredPhotos.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <MagnifyingGlassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      No matches found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                      No photos containing you were found using your face
                      profile.
                    </p>
                  </div>
                ) : filterActive ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Photos Grid - Responsive */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                      {filteredPhotos.map((photo) => (
                        <div
                          key={`filtered-${photo.id}`}
                          className="group cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <div className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 sm:p-2">
                            <img
                              src={photo.downloadURL.replace(
                                "groupify-77202.appspot.com",
                                "groupify-77202.firebasestorage.app"
                              )}
                              alt={photo.fileName}
                              className="w-full h-16 sm:h-20 md:h-24 lg:h-28 object-cover rounded-md sm:rounded-lg"
                            />

                            {/* Match confidence badge */}
                            {photo.faceMatch && (
                              <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3">
                                <div
                                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm ${
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
                            <div className="absolute inset-1 sm:inset-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md sm:rounded-lg flex items-end">
                              <div className="p-1.5 sm:p-2 w-full">
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
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <MagnifyingGlassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                      {hasProfile
                        ? "Ready to find your photos!"
                        : "Setup your face profile"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 sm:mb-8 max-w-md mx-auto">
                      {hasProfile
                        ? 'Click "Find My Photos" to automatically identify photos containing you using AI face recognition.'
                        : "You need to create a face profile in your Dashboard before you can find photos with yourself."}
                    </p>
                    {!hasProfile && (
                      <button
                        onClick={() =>
                          navigate("/dashboard?section=faceprofile")
                        }
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2 sm:gap-3 mx-auto text-sm"
                      >
                        <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        Setup Face Profile
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Enhanced with glassmorphism */}
          <div
            className={`xl:col-span-1 space-y-6 ${
              mobileActiveTab === "members" ? "block" : "hidden xl:block"
            }`}
          >
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
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
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
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No members found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-700 scrollbar-track-transparent">
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
                          className="group/member flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-orange-900/20 hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/30 dark:hover:to-orange-900/40 transition-all duration-300 cursor-pointer border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm"
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
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  member.photoURL ||
                                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                                }
                                alt="Avatar"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                              />
                              {member.uid === currentUser.uid && (
                                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate text-xs sm:text-sm">
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
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                Creator
                              </span>
                            ) : trip.admins?.includes(member.uid) ? (
                              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                Admin
                              </span>
                            ) : (
                              <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded-full">
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

        {/* Photo Modal - Enhanced with Navigation Arrows and Fixed Sizing */}
        {selectedPhoto && (
          <div
            className="fixed bg-black/95 backdrop-blur-lg flex items-center justify-center z-[9999]"
            style={{ 
              position: 'fixed',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              width: 'calc(100vw + 20px)',
              height: 'calc(100vh + 20px)',
              margin: 0,
              padding: 0
            }}
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Fixed container with consistent dimensions */}
            <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-4">
              
              {/* Image container with fixed aspect ratio */}
              <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                <img
                  src={selectedPhoto.downloadURL.replace(
                    "groupify-77202.appspot.com",
                    "groupify-77202.firebasestorage.app"
                  )}
                  alt="Full view"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(null);
                  }}
                  className="absolute top-6 right-6 w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors shadow-xl z-20"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Left Arrow - Fixed position */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                    if (currentIndex > 0) {
                      setSelectedPhoto(photos[currentIndex - 1]);
                    } else {
                      setSelectedPhoto(photos[photos.length - 1]);
                    }
                  }}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-300 hover:scale-110 shadow-xl z-20"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Right Arrow - Fixed position */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                    if (currentIndex < photos.length - 1) {
                      setSelectedPhoto(photos[currentIndex + 1]);
                    } else {
                      setSelectedPhoto(photos[0]);
                    }
                  }}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-300 hover:scale-110 shadow-xl z-20"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Photo counter - Fixed position */}
                <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium shadow-xl z-20">
                  {photos.findIndex(p => p.id === selectedPhoto.id) + 1} / {photos.length}
                </div>

                {/* Photo info overlay - Fixed position */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl">
                  <p className="font-medium text-lg">{selectedPhoto.fileName}</p>
                  <p className="text-sm text-white/80 mt-1">
                    {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                  </p>
                  {selectedPhoto.faceMatch && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedPhoto.faceMatch.matchType === "strong" 
                          ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        Face Match: {(selectedPhoto.faceMatch.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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

        {/* Edit Trip Modal */}
        <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={trip}
        onTripUpdated={(updatedTrip) => {
          setTrip(updatedTrip);
          setShowEditModal(false);
          toast.success("Trip updated successfully!");
        }}
        onTripDeleted={async (deletedTripId) => {
          setShowEditModal(false);
          
          // Always call the dashboard callback if available
          if (onTripDeleted) {
            onTripDeleted(deletedTripId);
          }
          
          // Also always navigate as backup (this will work even if callback fails)
          setTimeout(() => {
            navigate('/dashboard');
            toast.success("Trip deleted successfully!");
          }, 100);
        }}
      />

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
                  <div
                    key={`photo-grid-${photos.length}-${selectedPhotos.length}`}
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
                  >
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
      {/* Edit Trip Modal */}
      <EditTripModal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      trip={trip}
      onTripUpdated={(updatedTrip) => {
        setTrip(updatedTrip);
        setShowEditModal(false);
        toast.success("Trip updated successfully!");
      }}
      onTripDeleted={(deletedTripId) => {
        // Close modal first
        setShowEditModal(false);
        
        // Show success message
        toast.success("Trip deleted successfully!");
        
        // Navigate with a flag to refresh and pass the deleted trip ID
        navigate('/dashboard', { 
          state: { 
            refreshTrips: true, 
            deletedTripId: deletedTripId 
          } 
        });
      }}
    />
    </div>
  );
};

export default TripDetailView;
