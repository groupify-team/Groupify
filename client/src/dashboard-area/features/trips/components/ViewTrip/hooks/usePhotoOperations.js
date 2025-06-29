import { useState } from "react";
import { toast } from "react-hot-toast";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../services/firebase/config";
import { MAX_PHOTOS_PER_TRIP } from "../../../services/firebase/trips";

export const usePhotoOperations = (
  tripId,
  photos,
  trip,
  setPhotos,
  setTrip,
  filteredPhotos,
  setFilteredPhotos,
  filterActive
) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        setPhotos([...allowedPhotos, ...photos]);
        if (trip && setTrip) {
          setTrip({
            ...trip,
            photoCount: (trip.photoCount || 0) + allowedPhotos.length,
          });
        }
      }
    } else {
      setPhotos([...uploadedPhotos, ...photos]);
      if (trip && setTrip) {
        setTrip({
          ...trip,
          photoCount: (trip.photoCount || 0) + uploadedPhotos.length,
        });
      }
      toast.success(`${uploadedPhotos.length} photos uploaded successfully!`);
    }

    setShowUploadForm(false);
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
      setPhotos(photos.filter((photo) => !selectedPhotos.includes(photo.id)));

      // Also update filtered photos if face filter is active
      if (filterActive && filteredPhotos && setFilteredPhotos) {
        setFilteredPhotos(
          filteredPhotos.filter((photo) => !selectedPhotos.includes(photo.id))
        );
      }

      // Update trip photo count
      if (trip && setTrip) {
        setTrip({
          ...trip,
          photoCount: Math.max(
            (trip.photoCount || 0) - selectedPhotos.length,
            0
          ),
        });
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

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedPhotos([]);
  };

  const selectPhoto = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  return {
    selectMode,
    selectedPhotos,
    showUploadForm,
    showAllPhotosModal,
    showDeleteConfirm,
    setSelectMode,
    setSelectedPhotos,
    setShowUploadForm,
    setShowAllPhotosModal,
    setShowDeleteConfirm,
    handlePhotoUploaded,
    handleDeleteSelectedPhotos,
    confirmDeletePhotos,
    toggleSelectMode,
    selectPhoto,
    checkPhotoLimit,
    getRemainingPhotoSlots,
    getPhotoLimitStatus,
  };
};
