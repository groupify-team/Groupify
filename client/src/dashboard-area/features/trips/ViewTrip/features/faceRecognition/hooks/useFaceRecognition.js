/**
 * Hook for AI face recognition and photo filtering functionality
 * Handles face profile loading, photo matching, and recognition progress tracking
 */

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  createFaceProfile,
} from "../service/faceRecognitionService";
import { getFaceProfileFromStorage } from "@shared/services/firebase/faceProfiles";

export const useFaceRecognition = (photos, currentUserId, isMember) => {
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

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
        return;
      }

      // Try to load from Firebase Storage automatically
      const storedProfile = await getFaceProfileFromStorage(currentUserId);

      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await createFaceProfile(currentUserId, imageUrls);
          setHasProfile(true);
        } catch (error) {
          console.error("❌ Failed to auto-load face profile:", error);
          setHasProfile(false);
        }
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error("❌ Error checking for face profile:", error);
      setHasProfile(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // progress handler with real-time updates
  const handleFaceRecognitionProgress = (progressData) => {
    setFaceRecognitionProgress((prev) => {
      switch (progressData.type) {
        case "initializing_models":
        case "loading_model":
        case "models_ready":
          return {
            ...prev,
            phase: progressData.phase,
            current: progressData.current,
            total: progressData.total,
            percentage: Math.round(
              (progressData.current / progressData.total) * 100
            ),
          };

        case "initializing":
          return {
            current: 0,
            total: progressData.total,
            phase: progressData.phase,
            profileInfo: progressData.profileInfo,
            matches: [],
            errors: [],
            percentage: 0,
          };

        case "batch_starting":
          return {
            ...prev,
            phase: progressData.phase,
            totalBatches: progressData.totalBatches,
          };

        case "processing":
          // 🔥 FIX: Don't reset, just update current values
          return {
            ...prev,
            current: progressData.current,
            total: progressData.total,
            batch: progressData.batch,
            totalBatches: progressData.totalBatches,
            currentPhoto: progressData.currentPhoto,
            estimatedTimeRemaining: progressData.estimatedTimeRemaining,
            phase: `${progressData.phase} (${progressData.current}/${progressData.total})`,
            percentage:
              progressData.percentage ||
              Math.round((progressData.current / progressData.total) * 100),
          };

        case "match_found":
          return {
            ...prev,
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
            ...prev,
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
            ...prev,
            phase: progressData.phase,
            current: prev.total,
            percentage: 100,
            totalMatches: progressData.totalMatches,
            strongMatches: progressData.strongMatches,
            weakMatches: progressData.weakMatches,
            averageConfidence: progressData.averageConfidence,
            processingTime: progressData.processingTime,
            profileUsed: progressData.profileUsed,
          };

        case "cancelled":
          return {
            ...prev,
            phase: progressData.phase,
          };

        default:
          return prev;
      }
    });
  };

  const enhancedHandleFindMyPhotos = () => {
    setShowScanModal(true);
  };

  // Face recognition function
  // 🔥 REPLACE the entire handleFindMyPhotos function:
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
      phase: "Initializing AI models...",
      matches: [],
      errors: [],
      percentage: 0,
    });
    resetFaceRecognition();

    try {
      // 🔥 ADD: Set up initialization progress callback
      const service = getFaceRecognitionService();
      service.setInitializationProgressCallback(handleFaceRecognitionProgress);

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

      // 🔥 ADD: Success handling with delay for UX
      setFaceRecognitionProgress((prev) => ({
        ...prev,
        phase: "Recognition completed successfully!",
        percentage: 100,
      }));

      // Small delay to show completion state
      setTimeout(() => {
        if (matches.length > 0) {
          setFilteredPhotos(matches);
          setFilterActive(true);
          setShowScanModal(false);
          setShowResultsModal(true); // 🔥 AUTO-OPEN RESULTS
          toast.success(`Found ${matches.length} matching photos!`);
        } else {
          setFilteredPhotos([]);
          setFilterActive(true);
          setShowScanModal(false);
          toast.info("No matching photos found");
        }
      }, 1500); // 1.5 second delay to show success
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
      setShowScanModal(false);
    } finally {
      // Don't set this immediately - let the success state show first
      setTimeout(() => {
        setIsProcessingFaces(false);
      }, 1500);
    }
  };

  // Cancel face recognition
  const handleCancelFaceRecognition = () => {
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
    showScanModal,
    showResultsModal,
    setShowScanModal,
    setShowResultsModal,
    enhancedHandleFindMyPhotos,
    enhancedHandleCancelFaceRecognition: handleCancelFaceRecognition,
    handleStartFaceRecognition: handleFindMyPhotos,
    handleNavigateToProfile: () => setShowScanModal(false),
  };
};
