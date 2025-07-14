// client/src/shared/services/presence/PresenceService.js
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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

/**
 * Service for managing user presence (online/offline status)
 * Handles real-time presence updates across the application
 */
export class PresenceService {
  // TIMING CONFIGURATION
  static HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4 minutes (how often to send "I'm alive")
  static STALE_THRESHOLD = 6 * 60 * 1000; // 6 minutes (when to consider offline)
  static AWAY_DELAY = 0; // 0 seconds (instant away when tab loses focus)

  static listeners = new Map(); // Track active listeners for cleanup
  static heartbeatIntervals = new Map(); // Track heartbeat timers

  /**
   * Set user online status with automatic cleanup
   */
  static async setUserOnline(userId, status = "online") {
    try {
      console.log(`🟢 Setting user ${userId} as ${status}`);

      const presenceRef = doc(db, "userPresence", userId);
      await setDoc(
        presenceRef,
        {
          userId,
          isOnline: true,
          status,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Set up heartbeat to keep presence alive
      this.startHeartbeat(userId, status);

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

      // Clear any existing heartbeat
      this.stopHeartbeat(userId);

      const presenceRef = doc(db, "userPresence", userId);
      await setDoc(
        presenceRef,
        {
          userId,
          isOnline: false,
          status: "offline",
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`✅ User ${userId} set offline`);
      return true;
    } catch (error) {
      console.error(`❌ Error setting user offline:`, error);
      throw error;
    }
  }

  /**
   * Start heartbeat to keep user presence alive (UPDATED with configurable interval)
   */
  static startHeartbeat(userId, status = "online") {
    // Clear existing heartbeat first
    this.stopHeartbeat(userId);

    // Set up new heartbeat with configurable interval
    const interval = setInterval(async () => {
      try {
        if (document.visibilityState === "visible") {
          const presenceRef = doc(db, "userPresence", userId);
          await updateDoc(presenceRef, {
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isOnline: true,
            status,
          });
          console.log(`💓 Heartbeat sent for user ${userId}`);
        }
      } catch (error) {
        console.error(`❌ Heartbeat failed for user ${userId}:`, error);
        // Stop heartbeat on persistent errors
        this.stopHeartbeat(userId);
      }
    }, this.HEARTBEAT_INTERVAL); // Use configurable interval

    this.heartbeatIntervals.set(userId, interval);
    console.log(
      `💓 Started heartbeat for user ${userId} (every ${
        this.HEARTBEAT_INTERVAL / 1000 / 60
      } minutes)`
    );
  }

  /**
   * Stop heartbeat for user
   */
  static stopHeartbeat(userId) {
    const interval = this.heartbeatIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(userId);
      console.log(`💓 Stopped heartbeat for user ${userId}`);
    }
  }

  /**
   * Get user's current presence with configurable staleness check
   */
  static async getUserPresence(userId) {
    try {
      const presenceRef = doc(db, "userPresence", userId);
      const presenceSnap = await getDoc(presenceRef);

      if (presenceSnap.exists()) {
        const data = presenceSnap.data();

        // Check if presence is stale using configurable threshold
        const now = new Date();
        const lastSeen = data.lastSeen?.toDate();
        const isStale = lastSeen && now - lastSeen > this.STALE_THRESHOLD;

        return {
          userId,
          isOnline: isStale ? false : data.isOnline,
          status: isStale ? "offline" : data.status,
          lastSeen: data.lastSeen,
          updatedAt: data.updatedAt,
          isStale,
          timeSinceLastSeen: lastSeen ? now - lastSeen : null,
          timeUntilOffline: lastSeen
            ? Math.max(0, this.STALE_THRESHOLD - (now - lastSeen))
            : 0,
        };
      }

      // Default offline presence if no document exists
      return {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: null,
        updatedAt: null,
        isStale: false,
        timeSinceLastSeen: null,
        timeUntilOffline: 0,
      };
    } catch (error) {
      console.error(`❌ Error getting user presence for ${userId}:`, error);
      return {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: null,
        updatedAt: null,
        isStale: false,
        timeSinceLastSeen: null,
        timeUntilOffline: 0,
      };
    }
  }

  /**
   * Subscribe to user presence changes with real-time updates
   */
  static subscribeToUserPresence(userId, callback) {
    console.log(`👁️ Subscribing to presence for user: ${userId}`);

    const presenceRef = doc(db, "userPresence", userId);

    const unsubscribe = onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Check staleness with configurable threshold
          const now = new Date();
          const lastSeen = data.lastSeen?.toDate();
          const isStale = lastSeen && now - lastSeen > this.STALE_THRESHOLD;

          const presence = {
            userId,
            isOnline: isStale ? false : data.isOnline,
            status: isStale ? "offline" : data.status,
            lastSeen: data.lastSeen,
            updatedAt: data.updatedAt,
            isStale,
            timeSinceLastSeen: lastSeen ? now - lastSeen : null,
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
            isStale: false,
            timeSinceLastSeen: null,
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
          isStale: false,
          timeSinceLastSeen: null,
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
   * Update user status (online, away, busy)
   */
  static async updateUserStatus(userId, status) {
    try {
      console.log(`🔄 Updating user ${userId} status to: ${status}`);

      const presenceRef = doc(db, "userPresence", userId);
      await updateDoc(presenceRef, {
        status,
        isOnline: status !== "offline",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update heartbeat if online
      if (status !== "offline") {
        this.startHeartbeat(userId, status);
      } else {
        this.stopHeartbeat(userId);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error updating user status:`, error);
      throw error;
    }
  }

  /**
   * Get multiple users' presence (batch operation)
   */
  static async getMultipleUserPresence(userIds) {
    try {
      console.log(`👥 Getting presence for ${userIds.length} users`);

      if (!userIds || userIds.length === 0) {
        return {};
      }

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
          isStale: false,
          timeSinceLastSeen: null,
        };
      });

      return presenceMap;
    }
  }

  /**
   * Clean up all listeners and heartbeats
   */
  static cleanup() {
    console.log(
      `🧹 Cleaning up ${this.listeners.size} presence listeners and ${this.heartbeatIntervals.size} heartbeats`
    );

    // Clean up listeners
    for (const [userId, unsubscribe] of this.listeners) {
      unsubscribe();
    }
    this.listeners.clear();

    // Clean up heartbeats
    for (const [userId, interval] of this.heartbeatIntervals) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();
  }

  /**
   * Clean up stale presence records (optional utility)
   */
  static async cleanupStalePresence() {
    try {
      console.log(`🧹 Cleaning up stale presence records`);

      const presenceQuery = query(collection(db, "userPresence"));
      const querySnapshot = await getDocs(presenceQuery);

      const now = new Date();
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      let cleanedCount = 0;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const lastSeen = data.lastSeen?.toDate();

        if (lastSeen && now - lastSeen > staleThreshold) {
          await deleteDoc(docSnap.ref);
          cleanedCount++;
        }
      }

      console.log(`✅ Cleaned up ${cleanedCount} stale presence records`);
      return cleanedCount;
    } catch (error) {
      console.error(`❌ Error cleaning up stale presence:`, error);
      return 0;
    }
  }

  /**
   * Get timing configuration info (for debugging)
   */
  static getTimingInfo() {
    return {
      heartbeatInterval: `${this.HEARTBEAT_INTERVAL / 1000 / 60} minutes`,
      staleThreshold: `${this.STALE_THRESHOLD / 1000 / 60} minutes`,
      awayDelay: `${this.AWAY_DELAY / 1000} seconds`,
      heartbeatIntervalMs: this.HEARTBEAT_INTERVAL,
      staleThresholdMs: this.STALE_THRESHOLD,
      awayDelayMs: this.AWAY_DELAY,
    };
  }
}
