// services/tripsService.js
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

export const tripsService = {
  // Trip CRUD operations
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
      return await createTrip(tripData);
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  },

  async updateTrip(tripId, updates) {
    try {
      return await updateTrip(tripId, updates);
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  },

  async deleteTrip(tripId) {
    try {
      return await deleteTrip(tripId);
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  },

  // Trip photos
  async getTripPhotos(tripId) {
    try {
      return await getTripPhotos(tripId);
    } catch (error) {
      console.error("Error fetching trip photos:", error);
      throw error;
    }
  },

  // Trip members
  async addTripMember(tripId, userId) {
    try {
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

  // Trip invitations
  async sendTripInvite(tripId, inviterUid, inviteeUid) {
    try {
      return await sendTripInvite(tripId, inviterUid, inviteeUid);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      throw error;
    }
  },

  // Trip validation
  async canUserCreateTrip(userId) {
    try {
      return await canUserCreateTrip(userId);
    } catch (error) {
      console.error("Error checking trip creation permission:", error);
      throw error;
    }
  },

  async getUserTripCount(userId) {
    try {
      return await getUserTripCount(userId);
    } catch (error) {
      console.error("Error getting user trip count:", error);
      throw error;
    }
  },

  // Constants
  MAX_TRIPS_PER_USER,
  MAX_PHOTOS_PER_TRIP,
};
