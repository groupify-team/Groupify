// hooks/useTripPhotos.js - Optimization suggestions
import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { MAX_PHOTOS_PER_TRIP } from "@shared/services/firebase/trips";

export const useTripPhotos = (tripId, trip, setTrip) => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);

  // 🔥 OPTIMIZATION: Memoize expensive calculations
  const photoStats = useMemo(
    () => ({
      count: photos.length,
      remaining: Math.max(0, MAX_PHOTOS_PER_TRIP - photos.length),
      status: (() => {
        const remaining = Math.max(0, MAX_PHOTOS_PER_TRIP - photos.length);
        if (remaining === 0) return "full";
        if (remaining <= 5) return "warning";
        return "normal";
      })(),
    }),
    [photos.length]
  );

  // Add the missing updateTripPhotoCount function
  const updateTripPhotoCount = useCallback(
    (additionalCount) => {
      if (trip && setTrip) {
        setTrip((prev) => ({
          ...prev,
          photoCount: (prev.photoCount || 0) + additionalCount,
        }));
      }
    },
    [trip, setTrip]
  );

  // 🔥 OPTIMIZATION: Use useCallback for functions passed as props
  const handlePhotoUploaded = useCallback(
    (uploadedPhotos) => {
      const totalAfterUpload = photos.length + uploadedPhotos.length;

      if (totalAfterUpload > MAX_PHOTOS_PER_TRIP) {
        const allowedPhotos = uploadedPhotos.slice(
          0,
          MAX_PHOTOS_PER_TRIP - photos.length
        );
        const rejectedCount = uploadedPhotos.length - allowedPhotos.length;

        toast.error(
          `Photo limit exceeded! Only ${allowedPhotos.length} photos were uploaded.`
        );

        if (allowedPhotos.length > 0) {
          setPhotos((prev) => [...allowedPhotos, ...prev]);
          updateTripPhotoCount(allowedPhotos.length);
        }
      } else {
        setPhotos((prev) => [...uploadedPhotos, ...prev]);
        updateTripPhotoCount(uploadedPhotos.length);
        toast.success(`${uploadedPhotos.length} photos uploaded successfully!`);
      }
    },
    [photos.length, updateTripPhotoCount]
  );

  const removePhotos = useCallback(
    (photoIds) => {
      setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
      if (trip && setTrip) {
        setTrip((prev) => ({
          ...prev,
          photoCount: Math.max((prev.photoCount || 0) - photoIds.length, 0),
        }));
      }
    },
    [trip, setTrip]
  );

  // 🔥 OPTIMIZATION: Return memoized values
  return useMemo(
    () => ({
      photos,
      setPhotos,
      selectedPhoto,
      setSelectedPhoto,
      showAllPhotosModal,
      setShowAllPhotosModal,
      checkPhotoLimit: () => photoStats.count < MAX_PHOTOS_PER_TRIP,
      getRemainingPhotoSlots: () => photoStats.remaining,
      getPhotoLimitStatus: () => photoStats.status,
      handlePhotoUploaded,
      removePhotos,
      updateTripPhotoCount,
      MAX_PHOTOS_PER_TRIP,
    }),
    [
      photos,
      selectedPhoto,
      showAllPhotosModal,
      photoStats,
      handlePhotoUploaded,
      removePhotos,
      updateTripPhotoCount,
    ]
  );
};
