/**
 * Hook for event photo operations and photo limit management
 * Handles photo uploads, photo statistics, and photo count validation
 */

import { useState, useCallback, useMemo } from "react";
import { toast } from "@shared/utils/toast";
import { MAX_PHOTOS_PER_EVENT } from "@shared/services/firebase/events";

export const useEventPhotos = (eventId, event, setEvent) => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);

  // ?? OPTIMIZATION: Memoize expensive calculations
  const photoStats = useMemo(
    () => ({
      count: photos.length,
      remaining: Math.max(0, MAX_PHOTOS_PER_EVENT - photos.length),
      status: (() => {
        const remaining = Math.max(0, MAX_PHOTOS_PER_EVENT - photos.length);
        if (remaining === 0) return "full";
        if (remaining <= 5) return "warning";
        return "normal";
      })(),
    }),
    [photos.length]
  );

  // Add the missing updateEventPhotoCount function
  const updateEventPhotoCount = useCallback(
    (additionalCount) => {
      if (event && setEvent) {
        setEvent((prev) => ({
          ...prev,
          photoCount: (prev.photoCount || 0) + additionalCount,
        }));
      }
    },
    [event, setEvent]
  );

  // ?? OPTIMIZATION: Use useCallback for functions passed as props
  const handlePhotoUploaded = useCallback(
    (uploadedPhotos) => {
      const totalAfterUpload = photos.length + uploadedPhotos.length;

      if (totalAfterUpload > MAX_PHOTOS_PER_EVENT) {
        const allowedPhotos = uploadedPhotos.slice(
          0,
          MAX_PHOTOS_PER_EVENT - photos.length
        );
        const rejectedCount = uploadedPhotos.length - allowedPhotos.length;

        toast.error(
          `Photo limit exceeded! Only ${allowedPhotos.length} photos were uploaded.`
        );

        if (allowedPhotos.length > 0) {
          setPhotos((prev) => [...allowedPhotos, ...prev]);
          updateEventPhotoCount(allowedPhotos.length);
        }
      } else {
        setPhotos((prev) => [...uploadedPhotos, ...prev]);
        updateEventPhotoCount(uploadedPhotos.length);
        toast.success(`${uploadedPhotos.length} photos uploaded successfully!`);
      }
    },
    [photos.length, updateEventPhotoCount]
  );

  const removePhotos = useCallback(
    (photoIds) => {
      setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
      if (event && setEvent) {
        setEvent((prev) => ({
          ...prev,
          photoCount: Math.max((prev.photoCount || 0) - photoIds.length, 0),
        }));
      }
    },
    [event, setEvent]
  );

  // ?? OPTIMIZATION: Return memoized values
  return useMemo(
    () => ({
      photos,
      setPhotos,
      selectedPhoto,
      setSelectedPhoto,
      showAllPhotosModal,
      setShowAllPhotosModal,
      checkPhotoLimit: () => photoStats.count < MAX_PHOTOS_PER_EVENT,
      getRemainingPhotoSlots: () => photoStats.remaining,
      getPhotoLimitStatus: () => photoStats.status,
      handlePhotoUploaded,
      removePhotos,
      updateEventPhotoCount,
      MAX_PHOTOS_PER_EVENT,
    }),
    [
      photos,
      selectedPhoto,
      showAllPhotosModal,
      photoStats,
      handlePhotoUploaded,
      removePhotos,
      updateEventPhotoCount,
    ]
  );
};
