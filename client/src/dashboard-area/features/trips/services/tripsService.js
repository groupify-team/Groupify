// services/tripsService.js - UPDATED to match exact pricing page limits
import {
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addTripMember,
  sendTripInvite,
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
  MAX_PHOTOS_PER_TRIP,
} from "@shared/services/firebase/trips";

import { getTripPhotos } from "@shared/services/firebase/storage";
import { getUserProfile } from "@shared/services/firebase/users";
import subscriptionService from "@shared/services/subscriptionService";

export const tripsService = {
  // Trip CRUD operations with enhanced plan validation
  async getTrips(userId) {
    try {
      return await getAllUserTrips(userId);
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw error;
    }
  },

  async getTripById(tripId) {
    try {
      return await getTrip(tripId);
    } catch (error) {
      console.error("Error fetching trip:", error);
      throw error;
    }
  },

  async createTrip(tripData) {
    try {
      // Enhanced plan validation before creation
      const subscription = subscriptionService.getCurrentSubscription();
      const currentTripCount = await this.getUserTripCount(tripData.createdBy);
      
      // Check plan limits using exact pricing page values
      const planFeatures = subscription.features;
      const tripLimit = planFeatures.trips;
      
      if (tripLimit !== 'unlimited' && currentTripCount >= tripLimit) {
        throw new Error(
          `Trip limit reached! Your ${subscription.plan} plan allows ${tripLimit} trips. You currently have ${currentTripCount} trips. Upgrade your plan to create more trips.`
        );
      }

      // Create the trip
      const newTrip = await createTrip({
        ...tripData,
        // Add plan-specific metadata
        planAtCreation: subscription.plan,
        createdAt: new Date().toISOString(),
        planLimits: {
          photosPerTrip: planFeatures.photosPerTrip,
          membersPerTrip: planFeatures.membersPerTrip
        }
      });

      // Update usage statistics
      subscriptionService.updateUsage({
        trips: currentTripCount + 1
      });

      return newTrip;
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  },

  async updateTrip(tripId, updates) {
    try {
      return await updateTrip(tripId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  },

  async deleteTrip(tripId) {
    try {
      // Get trip data before deletion for usage tracking
      const trip = await getTrip(tripId);
      
      await deleteTrip(tripId);

      // Update usage statistics
      const subscription = subscriptionService.getCurrentSubscription();
      const usage = subscription.usage;
      
      subscriptionService.updateUsage({
        trips: Math.max(0, (usage.trips?.used || 0) - 1),
        photos: Math.max(0, (usage.photos.used || 0) - (trip.photoCount || 0))
      });

      return true;
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  },

  // Trip photos with plan validation
  async getTripPhotos(tripId) {
    try {
      return await getTripPhotos(tripId);
    } catch (error) {
      console.error("Error fetching trip photos:", error);
      throw error;
    }
  },

  async validatePhotoUpload(tripId, newPhotoCount = 1, totalFileSize = 0) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = await getTrip(tripId);
      const currentTripPhotoCount = trip.photoCount || 0;
      const usage = subscription.usage;

      // Check per-trip photo limit using exact pricing page values
      const photosPerTripLimit = subscription.features.photosPerTrip;
      if (photosPerTripLimit !== 'unlimited') {
        if (currentTripPhotoCount + newPhotoCount > photosPerTripLimit) {
          return {
            allowed: false,
            reason: `Trip photo limit reached (${photosPerTripLimit} photos per trip)`,
            type: 'trip_photo_limit',
            currentUsage: currentTripPhotoCount,
            limit: photosPerTripLimit
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
            type: 'storage_limit',
            currentUsage: usage.storage.used,
            limit: storageLimit,
            additionalNeeded: totalFileSize
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error validating photo upload:", error);
      return {
        allowed: false,
        reason: "Failed to validate upload limits",
        type: 'validation_error'
      };
    }
  },

  // Trip members with plan validation
  async addTripMember(tripId, userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = await getTrip(tripId);
      const currentMemberCount = trip.members?.length || 0;
      const memberLimit = subscription.features.membersPerTrip;

      // Check member limit using exact pricing page values
      if (memberLimit !== 'unlimited' && currentMemberCount >= memberLimit) {
        throw new Error(
          `Member limit reached! Your ${subscription.plan} plan allows ${memberLimit} members per trip.`
        );
      }

      return await addTripMember(tripId, userId);
    } catch (error) {
      console.error("Error adding trip member:", error);
      throw error;
    }
  },

  async getTripMembers(memberIds) {
    try {
      if (!memberIds || memberIds.length === 0) return [];

      const memberProfiles = await Promise.all(
        memberIds.map((uid) => getUserProfile(uid))
      );
      return memberProfiles;
    } catch (error) {
      console.error("Error fetching trip members:", error);
      throw error;
    }
  },

  // Trip invitations with plan validation
  async sendTripInvite(tripId, inviterUid, inviteeUid) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = await getTrip(tripId);
      const currentMemberCount = trip.members?.length || 0;
      const memberLimit = subscription.features.membersPerTrip;

      // Check if adding this member would exceed the limit
      if (memberLimit !== 'unlimited' && currentMemberCount >= memberLimit) {
        throw new Error(
          `Cannot send invite. Member limit reached! Your ${subscription.plan} plan allows ${memberLimit} members per trip.`
        );
      }

      return await sendTripInvite(tripId, inviterUid, inviteeUid);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      throw error;
    }
  },

  // Enhanced trip validation with plan integration
  async canUserCreateTrip(userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const currentTripCount = await this.getUserTripCount(userId);
      const tripLimit = subscription.features.trips;

      if (tripLimit === 'unlimited') {
        return true;
      }

      return currentTripCount < tripLimit;
    } catch (error) {
      console.error("Error checking trip creation permission:", error);
      return false;
    }
  },

  async getUserTripCount(userId) {
    try {
      return await getUserTripCount(userId);
    } catch (error) {
      console.error("Error getting user trip count:", error);
      return 0;
    }
  },

  // Plan-specific limit helpers - UPDATED to match exact pricing page
  getTripLimitForPlan(plan) {
    const limits = {
      'free': 5,
      'premium': 50,
      'pro': 'unlimited',
      'enterprise': 'unlimited'
    };
    return limits[plan] || limits['free'];
  },

  getPhotoLimitForPlan(plan) {
    const limits = {
      'free': 30,
      'premium': 200, // Updated to match your pricing page
      'pro': 'unlimited',
      'enterprise': 'unlimited'
    };
    return limits[plan] || limits['free'];
  },

  getMemberLimitForPlan(plan) {
    const limits = {
      'free': 5,
      'premium': 20,
      'pro': 'unlimited',
      'enterprise': 'unlimited'
    };
    return limits[plan] || limits['free'];
  },

  getStorageLimitForPlan(plan) {
    const limits = {
      'free': 2 * 1024 * 1024 * 1024, // 2GB
      'premium': 50 * 1024 * 1024 * 1024, // 50GB
      'pro': 500 * 1024 * 1024 * 1024, // 500GB (NOT unlimited!)
      'enterprise': Number.MAX_SAFE_INTEGER // Unlimited
    };
    return limits[plan] || limits['free'];
  },

  // Plan validation utilities
  async validateTripAction(action, tripId, additionalData = {}) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = tripId ? await getTrip(tripId) : null;

      switch (action) {
        case 'create_trip':
          const currentTripCount = await this.getUserTripCount(additionalData.userId);
          const tripLimit = subscription.features.trips;
          
          if (tripLimit !== 'unlimited' && currentTripCount >= tripLimit) {
            return {
              allowed: false,
              reason: `Trip limit reached (${tripLimit} trips)`,
              upgradeRequired: true,
              currentUsage: currentTripCount,
              limit: tripLimit
            };
          }
          break;

        case 'upload_photos':
          return await this.validatePhotoUpload(
            tripId,
            additionalData.newPhotoCount,
            additionalData.totalFileSize
          );

        case 'invite_member':
          const currentMembers = trip?.members?.length || 0;
          const memberLimit = subscription.features.membersPerTrip;
          
          if (memberLimit !== 'unlimited' && currentMembers >= memberLimit) {
            return {
              allowed: false,
              reason: `Member limit reached (${memberLimit} members per trip)`,
              upgradeRequired: true,
              currentUsage: currentMembers,
              limit: memberLimit
            };
          }
          break;

        default:
          return { allowed: true };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error validating trip action:", error);
      return {
        allowed: false,
        reason: "Failed to validate action",
        type: 'validation_error'
      };
    }
  },

  // Enhanced usage tracking
  async updateTripPhotoCount(tripId, increment = 1) {
    try {
      const trip = await getTrip(tripId);
      const newPhotoCount = Math.max(0, (trip.photoCount || 0) + increment);
      
      await updateTrip(tripId, {
        photoCount: newPhotoCount,
        lastPhotoUpload: increment > 0 ? new Date().toISOString() : trip.lastPhotoUpload
      });

      return newPhotoCount;
    } catch (error) {
      console.error("Error updating trip photo count:", error);
      throw error;
    }
  },

  async syncUsageWithSubscriptionService(userId) {
    try {
      // Get actual usage from trips and photos
      const trips = await this.getTrips(userId);
      const totalTrips = trips.length;
      let totalPhotos = 0;
      let totalStorage = 0;

      // Calculate totals from all trips
      for (const trip of trips) {
        const photos = await getTripPhotos(trip.id);
        totalPhotos += photos.length;
        totalStorage += photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
      }

      // Update subscription service with real usage
      subscriptionService.updateUsage({
        trips: totalTrips,
        photos: totalPhotos,
        storage: totalStorage
      });

      return {
        trips: totalTrips,
        photos: totalPhotos,
        storage: totalStorage
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

    // Trip limit recommendations
    const tripLimit = subscription.features.trips;
    if (tripLimit !== 'unlimited') {
      const tripUsagePercent = ((usage.trips?.used || 0) / tripLimit) * 100;
      if (tripUsagePercent > 80) {
        recommendations.push({
          type: 'trips',
          urgency: tripUsagePercent > 95 ? 'high' : 'medium',
          message: `You've used ${Math.round(tripUsagePercent)}% of your trip limit`,
          currentPlan: plan,
          suggestedPlan: plan === 'free' ? 'premium' : 'pro'
        });
      }
    }

    // Photo limit recommendations
    const photoLimit = subscription.features.photosPerTrip;
    if (photoLimit !== 'unlimited') {
      // This is per-trip, so we'd need to check individual trips
      recommendations.push({
        type: 'photos',
        urgency: 'medium',
        message: `Consider upgrading for more photos per trip (current limit: ${photoLimit})`,
        currentPlan: plan,
        suggestedPlan: plan === 'free' ? 'premium' : 'pro'
      });
    }

    // Storage recommendations
    if (usage.storage.percentage > 80) {
      recommendations.push({
        type: 'storage',
        urgency: usage.storage.percentage > 95 ? 'high' : 'medium',
        message: `You've used ${Math.round(usage.storage.percentage)}% of your storage`,
        currentPlan: plan,
        suggestedPlan: plan === 'free' ? 'premium' : 'pro'
      });
    }

    return recommendations;
  },

  // Legacy constants for backward compatibility
  MAX_TRIPS_PER_USER,
  MAX_PHOTOS_PER_TRIP,

  // Enhanced constants based on plans - UPDATED to match pricing page
  PLAN_LIMITS: {
    free: {
      trips: 5,
      photosPerTrip: 30,
      membersPerTrip: 5,
      storage: 2 * 1024 * 1024 * 1024 // 2GB
    },
    premium: {
      trips: 50,
      photosPerTrip: 200, 
      membersPerTrip: 20,
      storage: 50 * 1024 * 1024 * 1024 // 50GB
    },
    pro: {
      trips: 'unlimited',
      photosPerTrip: 'unlimited',
      membersPerTrip: 'unlimited',
      storage: 500 * 1024 * 1024 * 1024 // 500GB
    },
    enterprise: {
      trips: 'unlimited',
      photosPerTrip: 'unlimited',
      membersPerTrip: 'unlimited',
      storage: 'unlimited'
    }
  }
};