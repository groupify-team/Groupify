// hooks/useFaceRecognition.js
import { useState, useCallback } from "react";
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  getFaceProfile,
  createFaceProfile,
} from "@shared/services/faceRecognitionService";
import { getFaceProfileFromStorage } from "@shared/services/firebase/faceProfiles";

export const useFaceRecognition = (userId) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [filterActive, setFilterActive] = useState(false);
  const [progress, setProgress] = useState({
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

  // Load user face profile
  const loadUserFaceProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    try {
      // Check if profile exists in memory first
      if (hasFaceProfile(userId)) {
        setHasProfile(true);
        console.log("✅ Face profile already loaded in memory");
        return;
      }

      // Try to load from Firebase Storage automatically
      console.log("🔍 Checking for stored face profile...");
      const storedProfile = await getFaceProfileFromStorage(userId);

      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        console.log("📥 Found stored face profile, loading automatically...");

        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await createFaceProfile(userId, imageUrls);
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
  }, [userId]);

  // Enhanced progress handler with real-time updates
  const handleFaceRecognitionProgress = useCallback((progressData) => {
    setProgress((prev) => {
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
  }, []);

  // Start face recognition process
  const findMyPhotos = useCallback(
    async (photos) => {
      if (!userId || photos.length === 0) {
        throw new Error("User ID or trip photos missing");
      }

      // Check if user has a face profile
      if (!hasProfile) {
        throw new Error(
          "No face profile found. Please create one in your Dashboard first."
        );
      }

      setIsProcessing(true);
      setProgress({
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
          userId,
          handleFaceRecognitionProgress
        );

        setFilteredPhotos(matches);
        setFilterActive(true);

        return matches;
      } catch (error) {
        console.error("❌ Face recognition error:", error);
        setFilteredPhotos([]);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [userId, hasProfile, handleFaceRecognitionProgress]
  );

  // Cancel face recognition
  const cancelProcessing = useCallback(() => {
    console.log("🛑 Cancelling face recognition...");
    cancelFaceRecognition();

    setTimeout(() => {
      setIsProcessing(false);
      setProgress({
        current: 0,
        total: 0,
        phase: "",
        matches: [],
        errors: [],
      });
    }, 500);
  }, []);

  // Clear filter results
  const clearFilter = useCallback(() => {
    setFilterActive(false);
    setFilteredPhotos([]);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setIsProcessing(false);
    setFilterActive(false);
    setFilteredPhotos([]);
    setProgress({
      current: 0,
      total: 0,
      phase: "",
      matches: [],
      errors: [],
    });
  }, []);

  // Format time remaining helper
  const formatTimeRemaining = useCallback((seconds) => {
    if (!seconds || seconds < 0) return "";

    if (seconds < 60) {
      return `~${seconds}s remaining`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `~${minutes}m ${remainingSeconds}s remaining`;
    }
  }, []);

  // Calculate percentage helper
  const getProgressPercentage = useCallback(() => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress.current, progress.total]);

  return {
    // State
    isProcessing,
    hasProfile,
    isLoadingProfile,
    filteredPhotos,
    filterActive,
    progress,

    // Actions
    loadUserFaceProfile,
    findMyPhotos,
    cancelProcessing,
    clearFilter,
    reset,

    // Helpers
    formatTimeRemaining,
    getProgressPercentage,

    // Setters (for manual updates if needed)
    setHasProfile,
    setFilteredPhotos,
    setFilterActive,
  };
};
