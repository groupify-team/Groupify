import { useState } from "react";

export const usePhotoModal = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState("trip");

  const navigateToNext = (photos) => {
    if (!selectedPhoto || photos.length === 0) return;

    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    } else {
      setSelectedPhoto(photos[0]); // Loop to first
    }
  };

  const navigateToPrevious = (photos) => {
    if (!selectedPhoto || photos.length === 0) return;

    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    } else {
      setSelectedPhoto(photos[photos.length - 1]); // Loop to last
    }
  };

  const selectRandomPhoto = (photos) => {
    if (photos.length === 0) return;

    const randomIndex = Math.floor(Math.random() * photos.length);
    setSelectedPhoto(photos[randomIndex]);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  return {
    selectedPhoto,
    mobileActiveTab,
    setSelectedPhoto,
    setMobileActiveTab,
    navigateToNext,
    navigateToPrevious,
    selectRandomPhoto,
    closeModal,
  };
};
