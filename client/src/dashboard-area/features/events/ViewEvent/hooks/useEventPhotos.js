// client/src/dashboard-area/features/events/ViewEvent/hooks/useEventPhotos.js
import { useState, useEffect } from "react";
import { eventsService } from "@dashboard/features/events/services/eventsService";

export const useEventPhotos = (eventId) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventPhotos = await eventsService.getEventPhotos(eventId);
        setPhotos(eventPhotos || []);
      } catch (err) {
        console.error("Error fetching event photos:", err);
        setError(err.message);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();

    // Optional: Set up real-time listener for photos if needed
    // You could add a Firebase listener here similar to the EventContext pattern
    
  }, [eventId]);

  const addPhoto = (newPhoto) => {
    setPhotos((prevPhotos) => [...prevPhotos, newPhoto]);
  };

  const removePhoto = (photoId) => {
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId));
  };

  const updatePhoto = (photoId, updates) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) =>
        photo.id === photoId ? { ...photo, ...updates } : photo
      )
    );
  };

  return {
    photos,
    loading,
    error,
    setPhotos,
    addPhoto,
    removePhoto,
    updatePhoto,
  };
};