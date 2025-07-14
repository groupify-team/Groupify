import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

/**
 * Service for managing user presence (online/offline status)
 */
export class PresenceService {
  static listeners = new Map(); // Track active listeners

  /**
   * Set user online status
   */
  static async setUserOnline(userId, status = "online") {
    try {
      console.log(`🟢 Setting user ${userId} as ${status}`);

      const presenceRef = doc(db, "userPresence", userId);
      await setDoc(presenceRef, {
        userId,
        isOnline: true,
        status,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ User ${userId} set to ${status}`);
      return true;
    } catch (error) {
      console.error(`❌ Error setting user online:`, error);
      throw error;
    }
  }

  /**
   * Set user offline status
   */
  static async setUserOffline(userId) {
    try {
      console.log(`🔴 Setting user ${userId} offline`);

      const presenceRef = doc(db, "userPresence", userId);
      await setDoc(presenceRef, {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ User ${userId} set offline`);
      return true;
    } catch (error) {
      console.error(`❌ Error setting user offline:`, error);
      throw error;
    }
  }

  /**
   * Get user's current presence
   */
  static async getUserPresence(userId) {
    try {
      const presenceRef = doc(db, "userPresence", userId);
      const presenceSnap = await getDoc(presenceRef);

      if (presenceSnap.exists()) {
        const data = presenceSnap.data();

        // Check if presence is stale (older than 5 minutes)
        const now = new Date();
        const lastSeen = data.lastSeen?.toDate();
        const isStale = lastSeen && now - lastSeen > 5 * 60 * 1000;

        return {
          userId,
          isOnline: isStale ? false : data.isOnline,
          status: isStale ? "offline" : data.status,
          lastSeen: data.lastSeen,
          updatedAt: data.updatedAt,
        };
      }

      // Default offline presence if no document exists
      return {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: null,
        updatedAt: null,
      };
    } catch (error) {
      console.error(`❌ Error getting user presence for ${userId}:`, error);
      return {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: null,
        updatedAt: null,
      };
    }
  }

  /**
   * Subscribe to user presence changes
   */
  static subscribeToUserPresence(userId, callback) {
    console.log(`👁️ Subscribing to presence for user: ${userId}`);

    const presenceRef = doc(db, "userPresence", userId);

    const unsubscribe = onSnapshot(
      presenceRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();

          // Check staleness
          const now = new Date();
          const lastSeen = data.lastSeen?.toDate();
          const isStale = lastSeen && now - lastSeen > 5 * 60 * 1000;

          const presence = {
            userId,
            isOnline: isStale ? false : data.isOnline,
            status: isStale ? "offline" : data.status,
            lastSeen: data.lastSeen,
            updatedAt: data.updatedAt,
          };

          callback(presence);
        } else {
          // No presence document exists
          callback({
            userId,
            isOnline: false,
            status: "offline",
            lastSeen: null,
            updatedAt: null,
          });
        }
      },
      (error) => {
        console.error(
          `❌ Error in presence subscription for ${userId}:`,
          error
        );
        // Call callback with offline status on error
        callback({
          userId,
          isOnline: false,
          status: "offline",
          lastSeen: null,
          updatedAt: null,
        });
      }
    );

    // Store the unsubscribe function
    this.listeners.set(userId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Unsubscribe from user presence
   */
  static unsubscribeFromUserPresence(userId) {
    const unsubscribe = this.listeners.get(userId);
    if (unsubscribe) {
      console.log(`👁️ Unsubscribing from presence for user: ${userId}`);
      unsubscribe();
      this.listeners.delete(userId);
    }
  }

  /**
   * Clean up all listeners
   */
  static cleanup() {
    console.log(`🧹 Cleaning up ${this.listeners.size} presence listeners`);
    for (const [userId, unsubscribe] of this.listeners) {
      unsubscribe();
    }
    this.listeners.clear();
  }

  /**
   * Get multiple users' presence (batch)
   */
  static async getMultipleUserPresence(userIds) {
    try {
      console.log(`👥 Getting presence for ${userIds.length} users`);

      const presencePromises = userIds.map((userId) =>
        this.getUserPresence(userId)
      );

      const presenceList = await Promise.all(presencePromises);

      // Convert to object for easier lookup
      const presenceMap = {};
      presenceList.forEach((presence) => {
        presenceMap[presence.userId] = presence;
      });

      return presenceMap;
    } catch (error) {
      console.error(`❌ Error getting multiple user presence:`, error);

      // Return offline status for all users on error
      const presenceMap = {};
      userIds.forEach((userId) => {
        presenceMap[userId] = {
          userId,
          isOnline: false,
          status: "offline",
          lastSeen: null,
          updatedAt: null,
        };
      });

      return presenceMap;
    }
  }

  /**
   * Update user status (online, away, busy)
   */
  static async updateUserStatus(userId, status) {
    try {
      console.log(`🔄 Updating user ${userId} status to: ${status}`);

      const presenceRef = doc(db, "userPresence", userId);
      const currentPresence = await this.getUserPresence(userId);

      await setDoc(presenceRef, {
        ...currentPresence,
        status,
        isOnline: status !== "offline",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error(`❌ Error updating user status:`, error);
      throw error;
    }
  }
}
