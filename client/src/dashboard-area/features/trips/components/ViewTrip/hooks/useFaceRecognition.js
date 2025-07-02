import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  createFaceProfile,
} from "@shared/services/faceRecognitionService";
import { getFaceProfileFromStorage } from "@shared/services/firebase/faceProfiles";

export const useFaceRecognition = (photos, currentUserId, isMember) => {
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [faceRecognitionProgress, setFaceRecognitionProgress] = useState({
    current: 0,
    total: 0,
    phase: "",
    estimatedTimeRemaining: undefined,
    batch: 0,
    totalBatches: 0,
    currentPhoto: "",
    matches: [],
    errors: [],
  });

  const canFilterByFace = isMember && currentUserId;

  // Load user face profile
  const loadUserFaceProfile = async () => {
    if (!currentUserId) return;

    setIsLoadingProfile(true);
    try {
      // Check if profile exists in memory first
      if (hasFaceProfile(currentUserId)) {
        setHasProfile(true);
        console.log("✅ Face profile already loaded in memory");
        return;
      }

      // Try to load from Firebase Storage automatically
      console.log("🔍 Checking for stored face profile...");
      const storedProfile = await getFaceProfileFromStorage(currentUserId);

      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        console.log("📥 Found stored face profile, loading automatically...");

        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await createFaceProfile(currentUserId, imageUrls);
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

  // Face recognition function
  const handleFindMyPhotos = async () => {
    if (!currentUserId || photos.length === 0) {
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
        currentUserId,
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

  // Auto-load face profile on component mount
  useEffect(() => {
    let isMounted = true;

    if (currentUserId && isMounted) {
      loadUserFaceProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  return {
    hasProfile,
    isLoadingProfile,
    isProcessingFaces,
    filterActive,
    filteredPhotos,
    faceRecognitionProgress,
    canFilterByFace,
    handleFindMyPhotos,
    handleCancelFaceRecognition,
    setFilterActive,
    setFilteredPhotos,
    loadUserFaceProfile,
  };
};
