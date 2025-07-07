/**
 * Hook for AI face recognition and photo filtering functionality
 * Handles face profile loading, photo matching, and recognition progress tracking
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  filterPhotosByFaceProfile,
  hasFaceProfile,
  cancelFaceRecognition,
  resetFaceRecognition,
  createFaceProfile,
} from "../service/faceRecognitionService";
import { getFaceProfileFromStorage } from "@shared/services/firebase/faceProfiles";

export const useFaceRecognition = (photos, currentUserId, isMember, tripId) => {
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [persistedResults, setPersistedResults] = useState(null);
  const [lastScanInfo, setLastScanInfo] = useState(null);

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

  const saveResultsToStorage = (results, tripId) => {
    try {
      const dataToSave = {
        results,
        tripId,
        timestamp: Date.now(),
        userId: currentUserId,
        scanDate: new Date().toISOString(), // Add readable date
        photoCount: results.length,
        version: "1.0", // For future compatibility
      };
      localStorage.setItem(
        `faceRecognition_${tripId}_${currentUserId}`,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error("Failed to save results:", error);
    }
  };

  const loadResultsFromStorage = (tripId) => {
    try {
      const saved = localStorage.getItem(
        `faceRecognition_${tripId}_${currentUserId}`
      );
      if (saved) {
        const data = JSON.parse(saved);
        // Remove the 24-hour limit - keep results indefinitely
        if (data.tripId === tripId && data.userId === currentUserId) {
          return {
            results: data.results,
            scanDate: data.scanDate,
            photoCount: data.photoCount,
            timestamp: data.timestamp,
          };
        }
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    }
    return null;
  };

  useEffect(() => {
    if (currentUserId && canFilterByFace && tripId) {
      loadUserFaceProfile();

      // Load saved results on component mount
      const savedData = loadResultsFromStorage(tripId);
      if (savedData && savedData.results.length > 0) {
        setFilteredPhotos(savedData.results);
        setFilterActive(true);
        setLastScanInfo({
          date: savedData.scanDate,
          photoCount: savedData.photoCount,
          timestamp: savedData.timestamp,
        });
      }
    }
  }, [currentUserId, canFilterByFace, tripId]);

  // Load user face profile
  const loadUserFaceProfile = useCallback(async () => {
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
          console.error("? Failed to auto-load face profile:", error);
          setHasProfile(false);
        }
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error("? Error checking for face profile:", error);
      setHasProfile(false);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [currentUserId]);

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
          const newPercentage = Math.round(
            (progressData.current / progressData.total) * 100
          );
          return {
            ...newProgress,
            current: progressData.current,
            total: progressData.total,
            batch: progressData.batch,
            totalBatches: progressData.totalBatches,
            currentPhoto: progressData.currentPhoto,
            estimatedTimeRemaining: progressData.estimatedTimeRemaining,
            phase: `${progressData.phase} (${progressData.current}/${progressData.total})`,
            percentage: newPercentage,
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

  const enhancedHandleFindMyPhotos = () => {
    setShowScanModal(true);
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
        saveResultsToStorage(matches, tripId);
        toast.success(`Found ${matches.length} matching photos!`);
        setShowScanModal(false);
        setTimeout(() => setShowResultsModal(true), 300);
      } else {
        setFilteredPhotos([]);
        setFilterActive(true);
        toast.info("No matching photos found");
        setShowScanModal(false);
        setTimeout(() => setShowResultsModal(true), 300);
      }
    } catch (error) {
      console.error("? Face recognition error:", error);
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

  const handleClearScan = () => {
    setFilterActive(false);
    setFilteredPhotos([]);
    setShowResultsModal(false);
    setShowScanModal(false);
    // Clear saved results from localStorage
    try {
      localStorage.removeItem(`faceRecognition_${tripId}_${currentUserId}`);
    } catch (error) {
      console.error("Failed to clear saved results:", error);
    }
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
    handleRescanFromResults: () => {
      setShowResultsModal(false);
      setTimeout(() => setShowScanModal(true), 300);
    },
    handleClearScan,
    lastScanInfo,
  };
};




