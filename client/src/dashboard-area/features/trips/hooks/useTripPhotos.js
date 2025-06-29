// hooks/useTripPhotos.js
import { useState } from "react";
import { toast } from "react-hot-toast";
import { MAX_PHOTOS_PER_TRIP } from "../../../services/firebase/trips";

export const useTripPhotos = (tripId, trip, setTrip) => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);

  const checkPhotoLimit = () => photos.length < MAX_PHOTOS_PER_TRIP;

  const getRemainingPhotoSlots = () =>
    Math.max(0, MAX_PHOTOS_PER_TRIP - photos.length);

  const getPhotoLimitStatus = () => {
    const remaining = getRemainingPhotoSlots();
    if (remaining === 0) return "full";
    if (remaining <= 5) return "warning";
    return "normal";
  };

  const handlePhotoUploaded = (uploadedPhotos) => {
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
  };

  const updateTripPhotoCount = (count) => {
    if (trip && setTrip) {
      setTrip((prevTrip) => ({
        ...prevTrip,
        photoCount: (prevTrip.photoCount || 0) + count,
      }));
    }
  };

  const removePhotos = (photoIds) => {
    setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
    if (trip && setTrip) {
      setTrip((prev) => ({
        ...prev,
        photoCount: Math.max((prev.photoCount || 0) - photoIds.length, 0),
      }));
    }
  };

  return {
    photos,
    setPhotos,
    selectedPhoto,
    setSelectedPhoto,
    showAllPhotosModal,
    setShowAllPhotosModal,
    checkPhotoLimit,
    getRemainingPhotoSlots,
    getPhotoLimitStatus,
    handlePhotoUploaded,
    removePhotos,
    MAX_PHOTOS_PER_TRIP,
  };
};
