// hooks/usePhotoSelection.js
import { useState } from "react";
import { toast } from "react-hot-toast";
import { deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@shared/services/firebase/config";

export const usePhotoSelection = (tripId, photos, removePhotos) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedPhotos([]);
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const deleteSelectedPhotos = async () => {
    const deletingToast = toast.loading(
      `Deleting ${selectedPhotos.length} photos...`
    );

    try {
      for (const photoId of selectedPhotos) {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) continue;

        // Delete from Firebase Storage
        const photoRef = ref(storage, `photos/${tripId}/${photo.fileName}`);
        await deleteObject(photoRef);

        // Delete from Firestore collections
        await deleteDoc(doc(db, "tripPhotos", photoId));
        await deleteDoc(doc(db, "photos", photoId));
      }

      removePhotos(selectedPhotos);
      toast.dismiss(deletingToast);
      toast.success(`${selectedPhotos.length} photos deleted successfully`);

      // Reset selection state
      setSelectedPhotos([]);
      setSelectMode(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete selected photos:", error);
      toast.dismiss(deletingToast);
      toast.error("An error occurred while deleting photos.");
    }
  };

  return {
    selectMode,
    selectedPhotos,
    showDeleteConfirm,
    setShowDeleteConfirm,
    toggleSelectMode,
    togglePhotoSelection,
    deleteSelectedPhotos,
  };
};
