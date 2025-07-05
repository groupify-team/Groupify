import { useState, lazy } from "react";
import { toast } from "react-hot-toast";

export const useLazyFaceRecognition = (photos, currentUserId, isMember) => {
  // Component loading states
  const [FaceRecognitionComponent, setFaceRecognitionComponent] =
    useState(null);
  const [isFaceRecognitionLoaded, setIsFaceRecognitionLoaded] = useState(false);
  const [isLoadingFaceRecognition, setIsLoadingFaceRecognition] =
    useState(false);

  // Face recognition states
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [faceRecognitionProgress, setFaceRecognitionProgress] = useState({
    current: 0,
    total: 0,
    phase: "",
    matches: [],
    errors: [],
  });

  const canFilterByFace = isMember && currentUserId;

  // Initialize face recognition profiles
  const initializeFaceRecognition = async () => {
    setIsLoadingProfile(true);

    try {
      // Dynamic import of the face recognition service
      const faceRecognitionModule = await import(
        "../service/faceRecognitionService"
      );
      const faceProfilesModule = await import(
        "@shared/services/firebase/faceProfiles"
      );

      // Check if profile exists
      if (faceRecognitionModule.hasFaceProfile(currentUserId)) {
        setHasProfile(true);
        return;
      }

      // Try to load from Firebase Storage
      const storedProfile = await faceProfilesModule.getFaceProfileFromStorage(
        currentUserId
      );

      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await faceRecognitionModule.createFaceProfile(
            currentUserId,
            imageUrls
          );
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

  // Load face recognition component and initialize
  const loadFaceRecognition = async () => {
    if (isFaceRecognitionLoaded) {
      // Already loaded, just start the process
      handleFindMyPhotos();
      return;
    }

    setIsLoadingFaceRecognition(true);

    try {
      console.log("🔄 Loading Face Recognition component...");

      // Dynamic import - only loads when user clicks "Find My Photos"
      const FaceRecognitionModule = await import(
        "../components/FaceRecognition"
      );

      setFaceRecognitionComponent(() => FaceRecognitionModule.default);

      setIsFaceRecognitionLoaded(true);

      console.log("✅ Face Recognition component loaded!");

      // Initialize face recognition after loading
      setTimeout(() => {
        initializeFaceRecognition();
      }, 100);
    } catch (error) {
      console.error("❌ Failed to load Face Recognition component:", error);
      toast.error("Failed to load face recognition. Please try again.");
    } finally {
      setIsLoadingFaceRecognition(false);
    }
  };

  // Handle face recognition processing
  const handleFindMyPhotos = async () => {
    if (!currentUserId || photos.length === 0) {
      toast.error("User ID or trip photos missing");
      return;
    }

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

    try {
      // Dynamic import of face recognition service
      const faceRecognitionModule = await import(
        "../service/faceRecognitionService"
      );

      faceRecognitionModule.resetFaceRecognition();

      const photoData = photos.map((photo) => ({
        id: photo.id,
        downloadURL: photo.downloadURL,
        fileName: photo.originalName || photo.fileName || `Photo ${photo.id}`,
        ...photo,
      }));

      const matches = await faceRecognitionModule.filterPhotosByFaceProfile(
        photoData,
        currentUserId,
        (progressData) => {
          setFaceRecognitionProgress((prev) => {
            // Handle different progress types
            switch (progressData.type) {
              case "processing":
                return { ...prev, ...progressData };
              case "match_found":
                return {
                  ...prev,
                  matches: [...prev.matches, progressData],
                };
              case "completed":
                return { ...prev, ...progressData };
              default:
                return { ...prev, ...progressData };
            }
          });
        }
      );

      if (matches.length > 0) {
        setFilteredPhotos(matches);
        setFilterActive(true);
        toast.success(`Found ${matches.length} matching photos!`);
      } else {
        setFilteredPhotos([]);
        setFilterActive(true);
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
  const handleCancelFaceRecognition = async () => {
    try {
      const faceRecognitionModule = await import(
        "../service/faceRecognitionService"
      );
      faceRecognitionModule.cancelFaceRecognition();
    } catch (error) {
      console.error("Error cancelling face recognition:", error);
    }

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

  // Unload face recognition after completion
  const unloadFaceRecognition = () => {
    console.log("🗑️ Unloading Face Recognition component...");
    setFaceRecognitionComponent(null);
    setIsFaceRecognitionLoaded(false);
    setFilterActive(false);
    setFilteredPhotos([]);
  };

  // Enhanced handlers
  const enhancedHandleFindMyPhotos = () => {
    loadFaceRecognition();
  };

  const enhancedHandleCancelFaceRecognition = () => {
    handleCancelFaceRecognition();
    // Unload component after cancellation
    setTimeout(() => {
      unloadFaceRecognition();
    }, 500);
  };

  return {
    // Component states
    FaceRecognitionComponent,
    isFaceRecognitionLoaded,
    isLoadingFaceRecognition,

    // Face recognition states
    hasProfile,
    isLoadingProfile,
    isProcessingFaces,
    filterActive,
    filteredPhotos,
    faceRecognitionProgress,
    canFilterByFace,

    // Handlers
    enhancedHandleFindMyPhotos,
    enhancedHandleCancelFaceRecognition,
    unloadFaceRecognition,

    // Setters (for external control)
    setFilterActive,
    setFilteredPhotos,
  };
};
