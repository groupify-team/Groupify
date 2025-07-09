// services/eventsService.js - UPDATED to match exact pricing page limits
import {
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventMember,
  sendEventInvite,
  getUserEvents,
  getUserEventCount,
  MAX_EVENTS_PER_USER,
  MAX_PHOTOS_PER_EVENT,
} from "@shared/services/firebase/events";

import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

import { getEventPhotos } from "@shared/services/firebase/storage";
import { getUserProfile } from "@firebase-services/users";
import subscriptionService from "@shared/services/subscriptionService";

export const eventsService = {
  // Event CRUD operations with enhanced plan validation
  async getEvents(userId) {
    try {
      // FIXED: Get ALL events where user is a member (not just created by user)
      const eventsQuery = query(
        collection(db, "events"),
        where("members", "array-contains", userId)
      );
      const querySnapshot = await getDocs(eventsQuery);
      
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("📊 Events fetched for user:", {
        userId,
        totalEvents: events.length,
        createdByUser: events.filter(e => e.createdBy === userId).length,
        memberOfOnly: events.filter(e => e.createdBy !== userId).length
      });

      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  },

  async getUserCreatedEvents(userId) {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("createdBy", "==", userId)
    );
    const querySnapshot = await getDocs(eventsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user created events:", error);
    throw error;
  }
},

async getUserMemberEvents(userId) {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("members", "array-contains", userId)
    );
    const querySnapshot = await getDocs(eventsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user member events:", error);
    throw error;
  }
},

  async createEvent(eventData) {
    try {
      // Enhanced plan validation before creation
      const subscription = subscriptionService.getCurrentSubscription();
      const currentEventCount = await this.getUserEventCount(
        eventData.createdBy
      );

      // Check plan limits using exact pricing page values
      const planFeatures = subscription.features;
      const eventLimit = planFeatures.events;

      if (eventLimit !== "unlimited" && currentEventCount >= eventLimit) {
        const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
      throw new Error(
        `Event limit reached! Your ${planName} plan allows ${eventLimit} events. You currently participate in ${currentEventCount} events. Upgrade to ${subscription.plan === 'free' ? 'Premium' : 'Pro'} for ${subscription.plan === 'free' ? '50 events' : 'unlimited events'}.`
      );
    }


      // Create the event
      const newEvent = await createEvent({
        ...eventData,
        // Add plan-specific metadata
        planAtCreation: subscription.plan,
        createdAt: new Date().toISOString(),
        planLimits: {
          photosPerEvent: planFeatures.photosPerEvent,
          membersPerEvent: planFeatures.membersPerEvent,
        },
      });

      // Update usage statistics
      subscriptionService.updateUsage({
        events: currentEventCount + 1,
      });

      return newEvent;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  async updateEvent(eventId, updates) {
    try {
      return await updateEvent(eventId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  async deleteEvent(eventId) {
    try {
      // Get event data before deletion for usage tracking
      const event = await getEvent(eventId);

      await deleteEvent(eventId);

      // Update usage statistics
      const subscription = subscriptionService.getCurrentSubscription();
      const usage = subscription.usage;

      subscriptionService.updateUsage({
        events: Math.max(0, (usage.events?.used || 0) - 1),
        photos: Math.max(0, (usage.photos.used || 0) - (event.photoCount || 0)),
      });

      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // event photos with plan validation
  async getEventPhotos(eventId) {
    try {
      return await getEventPhotos(eventId);
    } catch (error) {
      console.error("Error fetching event photos:", error);
      throw error;
    }
  },

  async validatePhotoUpload(eventId, newPhotoCount = 1, totalFileSize = 0) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const event = await getEvent(eventId);
      const currentEventPhotoCount = event.photoCount || 0;
      const usage = subscription.usage;

      // Check per-event photo limit using exact pricing page values
      const photosPerEventLimit = subscription.features.photosPerEvent;
      if (photosPerEventLimit !== "unlimited") {
        if (currentEventPhotoCount + newPhotoCount > photosPerEventLimit) {
          return {
            allowed: false,
            reason: `event photo limit reached (${photosPerEventLimit} photos per event)`,
            type: "event_photo_limit",
            currentUsage: currentEventPhotoCount,
            limit: photosPerEventLimit,
          };
        }
      }

      // Check storage limit using exact pricing page values
      const storageLimit = subscription.features.storageBytes;
      if (storageLimit !== Number.MAX_SAFE_INTEGER) {
        if (usage.storage.used + totalFileSize > storageLimit) {
          const storageFormatted = subscription.features.storage;
          return {
            allowed: false,
            reason: `Storage limit exceeded (${storageFormatted} limit)`,
            type: "storage_limit",
            currentUsage: usage.storage.used,
            limit: storageLimit,
            additionalNeeded: totalFileSize,
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error validating photo upload:", error);
      return {
        allowed: false,
        reason: "Failed to validate upload limits",
        type: "validation_error",
      };
    }
  },

  // event members with plan validation
  async addEventMember(eventId, userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const event = await getEvent(eventId);
      const currentMemberCount = event.members?.length || 0;
      const memberLimit = subscription.features.membersPerEvent;

      // Check member limit using exact pricing page values
      if (memberLimit !== "unlimited" && currentMemberCount >= memberLimit) {
        throw new Error(
          `Member limit reached! Your ${subscription.plan} plan allows ${memberLimit} members per event.`
        );
      }

      return await addEventMember(eventId, userId);
    } catch (error) {
      console.error("Error adding event member:", error);
      throw error;
    }
  },

  async getEventMembers(memberIds) {
    try {
      if (!memberIds || memberIds.length === 0) return [];

      const memberProfiles = await Promise.all(
        memberIds.map(async (uid) => {
          try {
            const profile = await getUserProfile(uid);
            return profile
              ? {
                  uid: profile.uid || profile.id || uid,
                  id: profile.id || profile.uid || uid,
                  ...profile,
                }
              : null;
          } catch (error) {
            console.error(`Error fetching member profile ${uid}:`, error);
            return null;
          }
        })
      );

      // Filter out null profiles and ensure proper structure
      return memberProfiles.filter((profile) => profile !== null);
    } catch (error) {
      console.error("Error fetching event members:", error);
      throw error;
    }
  },

  // event invitations with plan validation
  async sendEventInvite(eventId, inviterUid, inviteeUid) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const event = await getEvent(eventId);
      const currentMemberCount = event.members?.length || 0;
      const memberLimit = subscription.features.membersPerEvent;

      // Check if adding this member would exceed the limit
      if (memberLimit !== "unlimited" && currentMemberCount >= memberLimit) {
        throw new Error(
          `Cannot send invite. Member limit reached! Your ${subscription.plan} plan allows ${memberLimit} members per event.`
        );
      }

      return await sendEventInvite(eventId, inviterUid, inviteeUid);
    } catch (error) {
      console.error("Error sending event invite:", error);
      throw error;
    }
  },

  // Enhanced event validation with plan integration
  async canUserCreateEvent(userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const currentEventCount = await this.getUserEventCount(userId);
      const eventLimit = subscription.features.events;

      if (eventLimit === "unlimited") {
        return true;
      }

      return currentEventCount < eventLimit;
    } catch (error) {
      console.error("Error checking event creation permission:", error);
      return false;
    }
  },

  async getUserEventCount(userId) {
    try {
      return await getUserEventCount(userId);
    } catch (error) {
      console.error("Error getting user event count:", error);
      return 0;
    }
  },

  // Plan-specific limit helpers - UPDATED to match exact pricing page
  getEventLimitForPlan(plan) {
    const limits = {
      free: 5,
      premium: 50,
      pro: "unlimited",
      enterprise: "unlimited",
    };
    return limits[plan] || limits["free"];
  },

  getPhotoLimitForPlan(plan) {
    const limits = {
      free: 30,
      premium: 200, // Updated to match your pricing page
      pro: "unlimited",
      enterprise: "unlimited",
    };
    return limits[plan] || limits["free"];
  },

  getMemberLimitForPlan(plan) {
    const limits = {
      free: 8,
      premium: 20,
      pro: "unlimited",
      enterprise: "unlimited",
    };
    return limits[plan] || limits["free"];
  },

  getStorageLimitForPlan(plan) {
    const limits = {
      free: 2 * 1024 * 1024 * 1024, // 2GB
      premium: 50 * 1024 * 1024 * 1024, // 50GB
      pro: 500 * 1024 * 1024 * 1024, // 500GB (NOT unlimited!)
      enterprise: Number.MAX_SAFE_INTEGER, // Unlimited
    };
    return limits[plan] || limits["free"];
  },

  // Plan validation utilities
  async validateEventAction(action, eventId, additionalData = {}) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const event = eventId ? await getEvent(eventId) : null;

      switch (action) {
        case "create_event": {
          const currentEventCount = await this.getUserEventCount(
            additionalData.userId
          );
          const eventLimit = subscription.features.events;

          if (eventLimit !== "unlimited" && currentEventCount >= eventLimit) {
            return {
              allowed: false,
              reason: `Event limit reached (${eventLimit} events)`,
              upgradeRequired: true,
              currentUsage: currentEventCount,
              limit: eventLimit,
            };
          }
          break;
        }

        case "upload_photos":
          return await this.validatePhotoUpload(
            eventId,
            additionalData.newPhotoCount,
            additionalData.totalFileSize
          );

        case "invite_member": {
          const currentMembers = event?.members?.length || 0;
          const memberLimit = subscription.features.membersPerEvent;

          if (memberLimit !== "unlimited" && currentMembers >= memberLimit) {
            return {
              allowed: false,
              reason: `Member limit reached (${memberLimit} members per event)`,
              upgradeRequired: true,
              currentUsage: currentMembers,
              limit: memberLimit,
            };
          }
          break;
        }

        default:
          return { allowed: true };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error validating event action:", error);
      return {
        allowed: false,
        reason: "Failed to validate action",
        type: "validation_error",
      };
    }
  },

  // Enhanced usage tracking
  async updateEventPhotoCount(eventId, increment = 1) {
    try {
      const event = await getEvent(eventId);
      const newPhotoCount = Math.max(0, (event.photoCount || 0) + increment);

      await updateEvent(eventId, {
        photoCount: newPhotoCount,
        lastPhotoUpload:
          increment > 0 ? new Date().toISOString() : event.lastPhotoUpload,
      });

      return newPhotoCount;
    } catch (error) {
      console.error("Error updating event photo count:", error);
      throw error;
    }
  },

  async syncUsageWithSubscriptionService(userId) {
    try {
      // Get actual usage from events and photos
      const events = await this.getEvents(userId);
      const totalevents = events.length;
      let totalPhotos = 0;
      let totalStorage = 0;

      // Calculate totals from all events
      for (const event of events) {
        const photos = await getEventPhotos(event.id);
        totalPhotos += photos.length;
        totalStorage += photos.reduce(
          (sum, photo) => sum + (photo.size || 0),
          0
        );
      }

      // Update subscription service with real usage
      subscriptionService.updateUsage({
        events: totalevents,
        photos: totalPhotos,
        storage: totalStorage,
      });

      return {
        events: totalevents,
        photos: totalPhotos,
        storage: totalStorage,
      };
    } catch (error) {
      console.error("Error syncing usage:", error);
      throw error;
    }
  },

  // Get plan upgrade recommendations based on usage
  getUpgradeRecommendations(subscription) {
    const recommendations = [];
    const usage = subscription.usage;
    const plan = subscription.plan;

    // event limit recommendations
    const eventLimit = subscription.features.events;
    if (eventLimit !== "unlimited") {
      const eventUsagePercent = ((usage.events?.used || 0) / eventLimit) * 100;
      if (eventUsagePercent > 80) {
        recommendations.push({
          type: "events",
          urgency: eventUsagePercent > 95 ? "high" : "medium",
          message: `You've used ${Math.round(
            eventUsagePercent
          )}% of your event limit`,
          currentPlan: plan,
          suggestedPlan: plan === "free" ? "premium" : "pro",
        });
      }
    }

    // Photo limit recommendations
    const photoLimit = subscription.features.photosPerEvent;
    if (photoLimit !== "unlimited") {
      // This is per-event, so we'd need to check individual events
      recommendations.push({
        type: "photos",
        urgency: "medium",
        message: `Consider upgrading for more photos per event (current limit: ${photoLimit})`,
        currentPlan: plan,
        suggestedPlan: plan === "free" ? "premium" : "pro",
      });
    }

    // Storage recommendations
    if (usage.storage.percentage > 80) {
      recommendations.push({
        type: "storage",
        urgency: usage.storage.percentage > 95 ? "high" : "medium",
        message: `You've used ${Math.round(
          usage.storage.percentage
        )}% of your storage`,
        currentPlan: plan,
        suggestedPlan: plan === "free" ? "premium" : "pro",
      });
    }

    return recommendations;
  },

  // Legacy constants for backward compatibility
  MAX_EVENTS_PER_USER,
  MAX_PHOTOS_PER_EVENT,

  // Enhanced constants based on plans - UPDATED to match pricing page
  PLAN_LIMITS: {
    free: {
      events: 5,
      photosPerEvent: 30,
      membersPerEvent: 8,
      storage: 2 * 1024 * 1024 * 1024, // 2GB
    },
    premium: {
      events: 50,
      photosPerEvent: 200,
      membersPerEvent: 20,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    },
    pro: {
      events: "unlimited",
      photosPerEvent: "unlimited",
      membersPerEvent: "unlimited",
      storage: 500 * 1024 * 1024 * 1024, // 500GB
    },
    enterprise: {
      events: "unlimited",
      photosPerEvent: "unlimited",
      membersPerEvent: "unlimited",
      storage: "unlimited",
    },
  },
};
