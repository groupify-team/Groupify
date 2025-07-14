/**
 * Hook for managing events, photos, and members in event detail view
 * PERFORMANCE OPTIMIZED VERSION with caching
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { updateEvent } from "@shared/services/firebase/events";
import {
  getEvent,
  getEventPhotos,
  getBatchUserProfiles,
} from "@shared/services/cache/cachedFirebaseServices";
import { measureAsyncPerformance } from "@shared/utils/performance";

export const useEventData = (eventId, currentUserId) => {
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [eventMembers, setEventMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);
  const fetchEventAndPhotos = useCallback(async () => {
    const currentKey = `${eventId}-${currentUserId}`;
    if (fetchInProgress.current) {
      return;
    }
    fetchInProgress.current = true;
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      const [eventData, photosData] = await Promise.all([
        measureAsyncPerformance("event fetch", () => getEvent(eventId)),
        measureAsyncPerformance("Photos fetch", () => getEventPhotos(eventId)),
      ]);

      let updatedeventData = eventData;
      if (!eventData.admins?.includes(eventData.createdBy)) {
        updatedeventData = {
          ...eventData,
          admins: [...(eventData.admins || []), eventData.createdBy],
        };
        await updateEvent(eventId, updatedeventData);
      }

      setEvent(updatedeventData);
      setIsAdmin(updatedeventData?.admins?.includes(currentUserId));
      if (!updatedeventData.members.includes(currentUserId)) {
        setError("You do not have access to this event");
        setLoading(false);
        return;
      }

      setPhotos(photosData);
      if (updatedeventData.members.length > 0) {
        measureAsyncPerformance("Member profiles fetch", async () => {
          const memberData = await getBatchUserProfiles(
            updatedeventData.members
          );
          setMemberProfiles(memberData);
          setEventMembers(memberData);
        });
      }
    } catch (error) {
      console.error("❌ Error fetching event data:", error);
      setError("Failed to load event data. Please try again.");
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [eventId, currentUserId]);

  const refresheventData = async () => {
    await fetchEventAndPhotos();
  };

  useEffect(() => {
    if (eventId && currentUserId) {
      fetchEventAndPhotos();
    }
  }, [eventId, currentUserId, fetchEventAndPhotos]);

  return {
    event,
    photos,
    eventMembers: useMemo(
      () =>
        [...eventMembers].sort((a, b) => {
          if (a.uid === currentUserId) return -1;
          if (b.uid === currentUserId) return 1;
          if (a.uid === event?.createdBy) return -1;
          if (b.uid === event?.createdBy) return 1;
          return (a.displayName || a.email || "").localeCompare(
            b.displayName || b.email || ""
          );
        }),
      [eventMembers, currentUserId, event?.createdBy]
    ),
    memberProfiles,
    isAdmin,
    loading,
    error,
    setEvent,
    setPhotos,
    setEventMembers,
    refresheventData,
  };
};
