import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import { db, storage } from "@firebase-services/config";
import {
  addUserToTrip,
  removeUserFromTrip,
  removeTripFromAllUsers,
  getUserTripsWithValidation,
  getUserProfile,
} from "@firebase-services/users";
import { getTripPhotos } from "@shared/services/firebase/storage";
import subscriptionService from "@shared/services/subscriptionService";

// Constants
const MAX_TRIPS_PER_USER = 5;
const MAX_PHOTOS_PER_TRIP = 30;

// Core trip functions (moved from trips.js)
export const getUserTripCount = async (userId) => {
  try {
    const q = query(collection(db, "trips"), where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user trip count:", error);
    throw error;
  }
};

export const canUserCreateTrip = async (userId) => {
  try {
    const tripCount = await getUserTripCount(userId);
    return tripCount < MAX_TRIPS_PER_USER;
  } catch (error) {
    console.error("Error checking trip creation permission:", error);
    return false;
  }
};

export const getTripPhotoCount = async (tripId) => {
  try {
    const q = query(
      collection(db, "tripPhotos"),
      where("tripId", "==", tripId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting trip photo count:", error);
    return 0;
  }
};

export const canTripAcceptMorePhotos = async (tripId, additionalPhotos = 1) => {
  try {
    const currentPhotoCount = await getTripPhotoCount(tripId);
    return currentPhotoCount + additionalPhotos <= MAX_PHOTOS_PER_TRIP;
  } catch (error) {
    console.error("Error checking photo limit:", error);
    return false;
  }
};

export const createTrip = async (tripData) => {
  try {
    const tripRef = doc(collection(db, "trips"));
    const tripId = tripRef.id;

    const newTrip = {
      ...tripData,
      id: tripId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoCount: 0,
      members: [tripData.createdBy],
      admins: [tripData.createdBy],
    };

    await setDoc(tripRef, newTrip);
    await addUserToTrip(tripData.createdBy, tripId);

    return newTrip;
  } catch (error) {
    console.error("❌ Error creating trip:", error);
    throw error;
  }
};

export const getTrip = async (tripId) => {
  try {
    const tripDoc = await getDoc(doc(db, "trips", tripId));

    if (!tripDoc.exists()) {
      throw new Error("Trip not found");
    }

    return {
      id: tripDoc.id,
      ...tripDoc.data(),
    };
  } catch (error) {
    console.error("Error getting trip:", error);
    throw error;
  }
};

export const updateTrip = async (tripId, updates) => {
  try {
    await updateDoc(doc(db, "trips", tripId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: tripId,
      ...updates,
    };
  } catch (error) {
    console.error("Error updating trip:", error);
    throw error;
  }
};

export const deleteTrip = async (tripId) => {
  try {
    await removeTripFromAllUsers(tripId);

    const tripPhotosQuery = query(
      collection(db, "tripPhotos"),
      where("tripId", "==", tripId)
    );
    const tripPhotosSnapshot = await getDocs(tripPhotosQuery);

    const deletePhotoPromises = tripPhotosSnapshot.docs.map((photoDoc) =>
      deleteDoc(photoDoc.ref)
    );

    await Promise.all(deletePhotoPromises);

    try {
      const tripPhotosRef = ref(storage, `trip_photos/${tripId}/`);
      const photosList = await listAll(tripPhotosRef);

      if (photosList.items.length > 0) {
        const deleteStoragePromises = photosList.items.map((photoRef) =>
          deleteObject(photoRef)
        );

        await Promise.all(deleteStoragePromises);
      }
    } catch (storageError) {
      console.warn("⚠️ Error deleting trip photos from Storage:", storageError);
    }

    const invitesQuery = query(
      collection(db, "tripInvites"),
      where("tripId", "==", tripId)
    );
    const invitesSnapshot = await getDocs(invitesQuery);

    const deleteInvitePromises = invitesSnapshot.docs.map((inviteDoc) =>
      deleteDoc(inviteDoc.ref)
    );

    await Promise.all(deleteInvitePromises);

    const tripRef = doc(db, "trips", tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    console.error("❌ Error deleting trip:", error);
    throw error;
  }
};

export const getUserTrips = async (uid) => {
  try {
    const trips = await getUserTripsWithValidation(uid);

    trips.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return trips;
  } catch (error) {
    console.error("❌ Error getting user trips:", error);
    throw error;
  }
};

export const addTripMember = async (tripId, userId) => {
  try {
    const tripDoc = await getDoc(doc(db, "trips", tripId));

    if (!tripDoc.exists()) {
      throw new Error("Trip not found");
    }

    const tripData = tripDoc.data();
    const members = tripData.members || [];

    if (!members.includes(userId)) {
      members.push(userId);
      await updateDoc(doc(db, "trips", tripId), {
        members,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      id: tripId,
      ...tripData,
      members,
    };
  } catch (error) {
    console.error("Error adding trip member:", error);
    throw error;
  }
};

export const inviteUserToTripByUid = async (tripId, userId) => {
  try {
    const tripRef = doc(db, "trips", tripId);
    await updateDoc(tripRef, {
      members: arrayUnion(userId),
    });
  } catch (error) {
    console.error("❌ Error inviting user:", error);
    throw error;
  }
};

export const sendTripInvite = async (tripId, inviterUid, inviteeUid) => {
  const inviteData = {
    tripId,
    inviterUid,
    inviteeUid,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "tripInvites"), inviteData);
};

export const getPendingInvites = async (uid) => {
  const q = query(
    collection(db, "tripInvites"),
    where("inviteeUid", "==", uid),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  const invites = [];

  for (const docSnap of snapshot.docs) {
    const invite = docSnap.data();

    let tripName = invite.tripId;
    let inviterName = invite.inviterUid;

    try {
      const tripRef = doc(db, "trips", invite.tripId);
      const tripSnap = await getDoc(tripRef);
      if (tripSnap.exists()) {
        tripName = tripSnap.data().name?.trim() || tripName;
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch trip name:", invite.tripId);
    }

    try {
      const inviterRef = doc(db, "users", invite.inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      if (inviterSnap.exists()) {
        inviterName = inviterSnap.data().displayName || inviterName;
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch inviter:", invite.inviterUid);
    }

    invites.push({
      id: docSnap.id,
      ...invite,
      tripName,
      inviterName,
    });
  }

  return invites;
};

export const acceptTripInvite = async (inviteId, userId) => {
  const inviteRef = doc(db, "tripInvites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const { tripId } = inviteSnap.data();
  const tripRef = doc(db, "trips", tripId);

  await updateDoc(tripRef, {
    members: arrayUnion(userId),
  });

  await deleteDoc(inviteRef);
};

export const declineTripInvite = async (inviteId) => {
  await updateDoc(doc(db, "tripInvites", inviteId), {
    status: "declined",
  });
};

// Enhanced service object with plan validation
export const tripsService = {
  // Trip CRUD operations with enhanced plan validation
  async getTrips(userId) {
    try {
      return await getUserTrips(userId);
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw error;
    }
  },

  async acceptTripInvite(inviteId, userId) {
    return await acceptTripInvite(inviteId, userId);
  },

  async declineTripInvite(inviteId) {
    return await declineTripInvite(inviteId);
  },

  async getPendingInvites(userId) {
    return await getPendingInvites(userId);
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
      const subscription = subscriptionService.getCurrentSubscription();
      const currentTripCount = await this.getUserTripCount(tripData.createdBy);

      const planFeatures = subscription.features;
      const tripLimit = planFeatures.trips;

      if (tripLimit !== "unlimited" && currentTripCount >= tripLimit) {
        throw new Error(
          `Trip limit reached! Your ${subscription.plan} plan allows ${tripLimit} trips. You currently have ${currentTripCount} trips. Upgrade your plan to create more trips.`
        );
      }

      const newTrip = await createTrip({
        ...tripData,
        planAtCreation: subscription.plan,
        createdAt: new Date().toISOString(),
        planLimits: {
          photosPerTrip: planFeatures.photosPerTrip,
          membersPerTrip: planFeatures.membersPerTrip,
        },
      });

      subscriptionService.updateUsage({
        trips: currentTripCount + 1,
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
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  },

  async deleteTrip(tripId) {
    try {
      const trip = await getTrip(tripId);
      await deleteTrip(tripId);

      const subscription = subscriptionService.getCurrentSubscription();
      const usage = subscription.usage;

      subscriptionService.updateUsage({
        trips: Math.max(0, (usage.trips?.used || 0) - 1),
        photos: Math.max(0, (usage.photos.used || 0) - (trip.photoCount || 0)),
      });

      return true;
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  },

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

      const photosPerTripLimit = subscription.features.photosPerTrip;
      if (photosPerTripLimit !== "unlimited") {
        if (currentTripPhotoCount + newPhotoCount > photosPerTripLimit) {
          return {
            allowed: false,
            reason: `Trip photo limit reached (${photosPerTripLimit} photos per trip)`,
            type: "trip_photo_limit",
            currentUsage: currentTripPhotoCount,
            limit: photosPerTripLimit,
          };
        }
      }

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

  async addTripMember(tripId, userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = await getTrip(tripId);
      const currentMemberCount = trip.members?.length || 0;
      const memberLimit = subscription.features.membersPerTrip;

      if (memberLimit !== "unlimited" && currentMemberCount >= memberLimit) {
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

  async sendTripInvite(tripId, inviterUid, inviteeUid) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = await getTrip(tripId);
      const currentMemberCount = trip.members?.length || 0;
      const memberLimit = subscription.features.membersPerTrip;

      if (memberLimit !== "unlimited" && currentMemberCount >= memberLimit) {
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

  async canUserCreateTrip(userId) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const currentTripCount = await this.getUserTripCount(userId);
      const tripLimit = subscription.features.trips;

      if (tripLimit === "unlimited") {
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

  getTripLimitForPlan(plan) {
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
      premium: 200,
      pro: "unlimited",
      enterprise: "unlimited",
    };
    return limits[plan] || limits["free"];
  },

  getMemberLimitForPlan(plan) {
    const limits = {
      free: 5,
      premium: 20,
      pro: "unlimited",
      enterprise: "unlimited",
    };
    return limits[plan] || limits["free"];
  },

  getStorageLimitForPlan(plan) {
    const limits = {
      free: 2 * 1024 * 1024 * 1024,
      premium: 50 * 1024 * 1024 * 1024,
      pro: 500 * 1024 * 1024 * 1024,
      enterprise: Number.MAX_SAFE_INTEGER,
    };
    return limits[plan] || limits["free"];
  },

  async validateTripAction(action, tripId, additionalData = {}) {
    try {
      const subscription = subscriptionService.getCurrentSubscription();
      const trip = tripId ? await getTrip(tripId) : null;

      switch (action) {
        case "create_trip":
          const currentTripCount = await this.getUserTripCount(
            additionalData.userId
          );
          const tripLimit = subscription.features.trips;

          if (tripLimit !== "unlimited" && currentTripCount >= tripLimit) {
            return {
              allowed: false,
              reason: `Trip limit reached (${tripLimit} trips)`,
              upgradeRequired: true,
              currentUsage: currentTripCount,
              limit: tripLimit,
            };
          }
          break;

        case "upload_photos":
          return await this.validatePhotoUpload(
            tripId,
            additionalData.newPhotoCount,
            additionalData.totalFileSize
          );

        case "invite_member":
          const currentMembers = trip?.members?.length || 0;
          const memberLimit = subscription.features.membersPerTrip;

          if (memberLimit !== "unlimited" && currentMembers >= memberLimit) {
            return {
              allowed: false,
              reason: `Member limit reached (${memberLimit} members per trip)`,
              upgradeRequired: true,
              currentUsage: currentMembers,
              limit: memberLimit,
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
        type: "validation_error",
      };
    }
  },

  async updateTripPhotoCount(tripId, increment = 1) {
    try {
      const trip = await getTrip(tripId);
      const newPhotoCount = Math.max(0, (trip.photoCount || 0) + increment);

      await updateTrip(tripId, {
        photoCount: newPhotoCount,
        lastPhotoUpload:
          increment > 0 ? new Date().toISOString() : trip.lastPhotoUpload,
      });

      return newPhotoCount;
    } catch (error) {
      console.error("Error updating trip photo count:", error);
      throw error;
    }
  },

  async syncUsageWithSubscriptionService(userId) {
    try {
      const trips = await this.getTrips(userId);
      const totalTrips = trips.length;
      let totalPhotos = 0;
      let totalStorage = 0;

      for (const trip of trips) {
        const photos = await getTripPhotos(trip.id);
        totalPhotos += photos.length;
        totalStorage += photos.reduce(
          (sum, photo) => sum + (photo.size || 0),
          0
        );
      }

      subscriptionService.updateUsage({
        trips: totalTrips,
        photos: totalPhotos,
        storage: totalStorage,
      });

      return {
        trips: totalTrips,
        photos: totalPhotos,
        storage: totalStorage,
      };
    } catch (error) {
      console.error("Error syncing usage:", error);
      throw error;
    }
  },

  getUpgradeRecommendations(subscription) {
    const recommendations = [];
    const usage = subscription.usage;
    const plan = subscription.plan;

    const tripLimit = subscription.features.trips;
    if (tripLimit !== "unlimited") {
      const tripUsagePercent = ((usage.trips?.used || 0) / tripLimit) * 100;
      if (tripUsagePercent > 80) {
        recommendations.push({
          type: "trips",
          urgency: tripUsagePercent > 95 ? "high" : "medium",
          message: `You've used ${Math.round(
            tripUsagePercent
          )}% of your trip limit`,
          currentPlan: plan,
          suggestedPlan: plan === "free" ? "premium" : "pro",
        });
      }
    }

    const photoLimit = subscription.features.photosPerTrip;
    if (photoLimit !== "unlimited") {
      recommendations.push({
        type: "photos",
        urgency: "medium",
        message: `Consider upgrading for more photos per trip (current limit: ${photoLimit})`,
        currentPlan: plan,
        suggestedPlan: plan === "free" ? "premium" : "pro",
      });
    }

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

  MAX_TRIPS_PER_USER,
  MAX_PHOTOS_PER_TRIP,

  PLAN_LIMITS: {
    free: {
      trips: 5,
      photosPerTrip: 30,
      membersPerTrip: 5,
      storage: 2 * 1024 * 1024 * 1024,
    },
    premium: {
      trips: 50,
      photosPerTrip: 200,
      membersPerTrip: 20,
      storage: 50 * 1024 * 1024 * 1024,
    },
    pro: {
      trips: "unlimited",
      photosPerTrip: "unlimited",
      membersPerTrip: "unlimited",
      storage: 500 * 1024 * 1024 * 1024,
    },
    enterprise: {
      trips: "unlimited",
      photosPerTrip: "unlimited",
      membersPerTrip: "unlimited",
      storage: "unlimited",
    },
  },
};

// Export individual functions for backward compatibility
export { MAX_TRIPS_PER_USER, MAX_PHOTOS_PER_TRIP };
