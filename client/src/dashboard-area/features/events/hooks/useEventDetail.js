/**
 * Hook for generic event operations and management
 * Handles event fetching, updating, member management, and photo operations
 */

import { useState, useEffect } from "react";
import { eventsService } from "../services/eventsService";
import {
  isUserEventAdmin,
  isUserEventMember,
} from "@dashboard/utils/eventHelpers";

export const useEventDetail = (eventId, currentUser) => {
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Permission checks
  const isAdmin = event ? isUserEventAdmin(event, currentUser?.uid) : false;
  const isMember = event ? isUserEventMember(event, currentUser?.uid) : false;

  const fetcheventData = async () => {
    if (!eventId || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch event details
      let eventData = await eventsService.getEventById(eventId);

      // Ensure creator is in admins array
      if (!eventData.admins?.includes(eventData.createdBy)) {
        eventData = {
          ...eventData,
          admins: [...(eventData.admins || []), eventData.createdBy],
        };
        await eventsService.updateEvent(eventId, eventData);
      }

      setEvent(eventData);

      // Check if user has access
      if (!eventData.members.includes(currentUser.uid)) {
        setError("You do not have access to this event");
        return;
      }

      // Fetch photos and members in parallel
      const [photosData, membersData] = await Promise.all([
        eventsService.getEventPhotos(eventId),
        eventsService.getEventMembers(eventData.members),
      ]);

      setPhotos(photosData);
      setMembers(membersData);
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError(err.message || "Failed to load event data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (updates) => {
    try {
      const updatedEvent = await eventsService.updateEvent(eventId, updates);
      setEvent((prev) => ({ ...prev, ...updates }));
      return updatedEvent;
    } catch (err) {
      console.error("Error updating event:", err);
      throw err;
    }
  };

  const addPhotos = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    if (event) {
      setEvent((prev) => ({
        ...prev,
        photoCount: (prev.photoCount || 0) + newPhotos.length,
      }));
    }
  };

  const removePhotos = (photoIds) => {
    setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
    if (event) {
      setEvent((prev) => ({
        ...prev,
        photoCount: Math.max((prev.photoCount || 0) - photoIds.length, 0),
      }));
    }
  };

  const updateMember = (memberId, updates) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.uid === memberId ? { ...member, ...updates } : member
      )
    );
  };

  const removeMember = (memberId) => {
    setMembers((prev) => prev.filter((member) => member.uid !== memberId));
    if (event) {
      setEvent((prev) => ({
        ...prev,
        members: prev.members?.filter((id) => id !== memberId),
        admins: prev.admins?.filter((id) => id !== memberId),
      }));
    }
  };

  const addMember = (newMember) => {
    setMembers((prev) => [...prev, newMember]);
    if (event) {
      setEvent((prev) => ({
        ...prev,
        members: [...(prev.members || []), newMember.uid],
      }));
    }
  };

  useEffect(() => {
    fetcheventData();
  }, [eventId, currentUser]);

  return {
    // Data
    event,
    photos,
    members,
    loading,
    error,

    // Permissions
    isAdmin,
    isMember,

    // Setters (for direct updates)
    setEvent,
    setPhotos,
    setMembers,
    setError,

    // Actions
    updateEvent,
    addPhotos,
    removePhotos,
    updateMember,
    removeMember,
    addMember,
    refetch: fetcheventData,
  };
};
