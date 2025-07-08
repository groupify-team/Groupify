/**
 * Hook for photo operations within event view
 * Handles photo uploads, deletions, selection mode, and photo limit checks
 */

import { useState } from "react";
import { toast } from "react-hot-toast";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@shared/services/firebase/config";
import { MAX_PHOTOS_PER_EVENT } from "@shared/services/firebase/events";

export const usePhotoOperations = (
  eventId,
  photos,
  event,
  setPhotos,
  setEvent,
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
    return photos.length < MAX_PHOTOS_PER_EVENT;
  };

  const getRemainingPhotoSlots = () => {
    return Math.max(0, MAX_PHOTOS_PER_EVENT - photos.length);
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

    if (totalAfterUpload > MAX_PHOTOS_PER_EVENT) {
      const allowedPhotos = uploadedPhotos.slice(
        0,
        MAX_PHOTOS_PER_EVENT - photos.length
      );
      const rejectedCount = uploadedPhotos.length - allowedPhotos.length;

      toast.error(
        `Photo limit exceeded! Only ${allowedPhotos.length} photos were uploaded. ${rejectedCount} photos were rejected.`
      );

      if (allowedPhotos.length > 0) {
        setPhotos([...allowedPhotos, ...photos]);
        if (event && setEvent) {
          setEvent({
            ...event,
            photoCount: (event.photoCount || 0) + allowedPhotos.length,
          });
        }
      }
    } else {
      setPhotos([...uploadedPhotos, ...photos]);
      if (event && setEvent) {
        setEvent({
          ...event,
          photoCount: (event.photoCount || 0) + uploadedPhotos.length,
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
        const photoRef = ref(storage, `photos/${eventId}/${photo.fileName}`);
        await deleteObject(photoRef);

        // Delete from Firestore - eventPhotos collection
        const eventPhotoRef = doc(db, "eventPhotos", photoId);
        await deleteDoc(eventPhotoRef);

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

      // Update event photo count
      if (event && setEvent) {
        setEvent({
          ...event,
          photoCount: Math.max(
            (event.photoCount || 0) - selectedPhotos.length,
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
