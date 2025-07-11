/**
 * Enhanced hook for managing user events list and event CRUD operations
 * Handles fetching all events, creating new events, and event validation with plan limits
 */

import { useState, useEffect, useCallback } from "react";
import { eventsService } from "../services/eventsService";
import { usePlanLimits } from "../../../shared/hooks/usePlanLimits";
import { toast } from "@shared/utils/toast";

export const useEvents = (userId) => {
  const [events, setevents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncingUsage, setSyncingUsage] = useState(false);

  // Plan limits integration
  const {
    canPerformAction,
    enforceLimit,
    updateUsage,
    getUsageInfo,
    getPlanFeatures,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
  } = usePlanLimits();

  const fetchevents = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const userevents = await eventsService.getEvents(userId);
      setevents(userevents);

      // Update usage tracking with actual event count
      const currentUsage = getUsageInfo();
      if (currentUsage && userevents.length !== currentUsage.events.used) {
        updateUsage({ events: userevents.length });
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [userId, getUsageInfo, updateUsage]);

  const createEvent = async (eventData) => {
    try {
      setError(null);

      // Enhanced plan validation before creation
      const currentEventCount = events.length;
      const limitCheck = canPerformAction("create_event", {
        currentEventCount,
      });

      if (!limitCheck.allowed) {
        if (limitCheck.upgradeRequired) {
          throw new Error(
            `${limitCheck.reason}. Upgrade your plan to Create More Events.`
          );
        } else {
          throw new Error(limitCheck.reason);
        }
      }

      // Check legacy limits for backward compatibility
      const canCreate = await eventsService.canUserCreateEvent(userId);
      if (!canCreate) {
        const currentCount = await eventsService.getUserEventCount(userId);
        const planFeatures = getPlanFeatures();
        const planLimit =
          planFeatures?.events || eventsService.MAX_EVENTS_PER_USER;

        throw new Error(
          `Event limit reached! You can only create ${planLimit} events. You currently have ${currentCount} events.`
        );
      }

      const newEvent = await eventsService.createEvent({
        ...eventData,
        createdBy: userId,
        members: [userId],
        admins: [userId],
        photoCount: 0,
      });

      // Add to local state
      setevents((prev) => [newEvent, ...prev]);

      // Show success message with plan context
      const planFeatures = getPlanFeatures();
      const remaining =
        planFeatures?.events === "unlimited"
          ? "unlimited"
          : planFeatures?.events - (currentEventCount + 1);

      if (remaining !== "unlimited" && remaining <= 2) {
        toast.success(
          `event created! ${remaining} events remaining in your ${
            isFreePlan ? "Free" : isPremiumPlan ? "Premium" : "Pro"
          } plan.`,
          { duration: 4000 }
        );
      } else {
        toast.success("Event Created Successfully!");
      }

      return newEvent;
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event");

      // Show upgrade prompt for plan limits
      if (err.message.includes("limit reached")) {
        toast.error(err.message, {
          duration: 6000,
          action: {
            label: "Upgrade Plan",
            onClick: () => {
              // Navigate to upgrade page
            },
          },
        });
      }

      throw err;
    }
  };

  const updateEvent = async (eventId, updates) => {
    try {
      setError(null);

      // Validate update based on plan limits if needed
      if (updates.members && updates.members.length > 0) {
        const planFeatures = getPlanFeatures();
        const memberLimit = eventsService.getMemberLimitForPlan(
          planFeatures?.plan || "free"
        );

        if (
          memberLimit !== "unlimited" &&
          updates.members.length > memberLimit
        ) {
          throw new Error(
            `Member limit exceeded! Your plan allows ${memberLimit} members per event.`
          );
        }
      }

      const updatedEvent = await eventsService.updateEvent(eventId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setevents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, ...updates } : event
        )
      );

      return updatedEvent;
    } catch (err) {
      console.error("Error updating event:", err);
      setError(err.message || "Failed to update event");
      throw err;
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      setError(null);

      // Find event to get photo count for usage tracking
      const eventToDelete = events.find((event) => event.id === eventId);
      const photoCount = eventToDelete?.photoCount || 0;

      await eventsService.deleteEvent(eventId);

      // Remove from local state
      setevents((prev) => prev.filter((event) => event.id !== eventId));

      // Update usage statistics
      const currentUsage = getUsageInfo();
      if (currentUsage) {
        updateUsage({
          events: Math.max(0, currentUsage.events.used - 1),
          photos: Math.max(0, currentUsage.photos.used - photoCount),
        });
      }

      toast.success("event deleted successfully");
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.message || "Failed to delete event");
      throw err;
    }
  };

  const addEventToList = useCallback(
    (newEvent) => {
      setevents((prev) => [newEvent, ...prev]);

      // Update usage tracking
      const currentUsage = getUsageInfo();
      if (currentUsage) {
        updateUsage({ events: currentUsage.events.used + 1 });
      }
    },
    [getUsageInfo, updateUsage]
  );

  const removeEventFromList = useCallback(
    (eventId) => {
      // Find event before removing for usage tracking
      const eventToRemove = events.find((event) => event.id === eventId);
      const photoCount = eventToRemove?.photoCount || 0;

      setevents((prev) => prev.filter((event) => event.id !== eventId));

      // Update usage tracking
      const currentUsage = getUsageInfo();
      if (currentUsage) {
        updateUsage({
          events: Math.max(0, currentUsage.events.used - 1),
          photos: Math.max(0, currentUsage.photos.used - photoCount),
        });
      }
    },
    [events, getUsageInfo, updateUsage]
  );

  // Sync usage with actual data
  const syncUsageWithActualData = useCallback(async () => {
    if (!userId) return;

    try {
      setSyncingUsage(true);
      await eventsService.syncUsageWithSubscriptionService(userId);

      // Refresh events to ensure consistency
      await fetchevents();
    } catch (error) {
      console.error("Error syncing usage:", error);
    } finally {
      setSyncingUsage(false);
    }
  }, [userId, fetchevents]);

  // Validate event operations with plan limits
  const validateEventOperation = useCallback(
    async (operation, data = {}) => {
      try {
        switch (operation) {
          case "create":
            return canPerformAction("create_event", {
              currentEventCount: events.length,
            });

          case "upload_photos":
            return await eventsService.validatePhotoUpload(
              data.eventId,
              data.photoCount,
              data.totalFileSize
            );

          case "invite_member":
            const event = events.find((t) => t.id === data.eventId);
            return canPerformAction("invite_members", {
              currentMemberCount: event?.members?.length || 0,
              newMemberCount: 1,
            });

          default:
            return { allowed: true };
        }
      } catch (error) {
        console.error("Error validating event operation:", error);
        return {
          allowed: false,
          reason: "Failed to validate operation",
        };
      }
    },
    [events, canPerformAction]
  );

  // Get plan-specific event statistics
  const getEventstats = useCallback(() => {
    const planFeatures = getPlanFeatures();
    if (!planFeatures) return null;

    const currentCount = events.length;
    const limit = planFeatures.events;

    return {
      current: currentCount,
      limit: limit,
      remaining:
        limit === "unlimited" ? "unlimited" : Math.max(0, limit - currentCount),
      percentage: limit === "unlimited" ? 0 : (currentCount / limit) * 100,
      nearLimit: limit !== "unlimited" && currentCount / limit > 0.8,
      atLimit: limit !== "unlimited" && currentCount >= limit,
    };
  }, [events, getPlanFeatures]);

  // Check if user can perform specific actions
  const cancreateEvent = useCallback(() => {
    const stats = getEventstats();
    return stats ? !stats.atLimit : false;
  }, [getEventstats]);

  const canUploadPhotos = useCallback(
    (eventId, photoCount = 1, totalFileSize = 0) => {
      return validateEventOperation("upload_photos", {
        eventId,
        photoCount,
        totalFileSize,
      });
    },
    [validateEventOperation]
  );

  const canInviteMembers = useCallback(
    (eventId) => {
      return validateEventOperation("invite_member", { eventId });
    },
    [validateEventOperation]
  );

  // Initialize events on mount
  useEffect(() => {
    fetchevents();
  }, [fetchevents]);

  // Sync usage periodically (optional)
  useEffect(() => {
    if (userId && events.length > 0) {
      // Sync usage when events change significantly
      const currentUsage = getUsageInfo();
      if (
        currentUsage &&
        Math.abs(events.length - currentUsage.events.used) > 1
      ) {
        syncUsageWithActualData();
      }
    }
  }, [userId, events.length, getUsageInfo, syncUsageWithActualData]);

  return {
    // Data
    events,
    loading,
    error,
    syncingUsage,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    addEventToList,
    removeEventFromList,
    refetch: fetchevents,
    syncUsage: syncUsageWithActualData,

    // Validation
    validateEventOperation,
    cancreateEvent,
    canUploadPhotos,
    canInviteMembers,

    // Statistics
    getEventstats,

    // Plan information
    planFeatures: getPlanFeatures(),
    isFreePlan,
    isPremiumPlan,
    isProPlan,

    // Legacy compatibility
    setevents,
  };
};
