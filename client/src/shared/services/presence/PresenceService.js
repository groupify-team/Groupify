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
  static HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4 minutes (how often to send "I'm alive")
  static STALE_THRESHOLD = 6 * 60 * 1000; // 6 minutes (when to consider offline)
  static AWAY_DELAY = 0; // 0 seconds (instant away when tab loses focus)
  static listeners = new Map(); // Track active listeners for cleanup
  static heartbeatIntervals = new Map(); // Track heartbeat timers

  static async setUserOnline(userId, status = "online") {
    try {
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

      this.startHeartbeat(userId, status);
      return true;
    } catch (error) {
      console.error(`❌ Error setting user online:`, error);
      throw error;
    }
  }

  static async setUserOffline(userId) {
    try {
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
      return true;
    } catch (error) {
      console.error(`❌ Error setting user offline:`, error);
      throw error;
    }
  }

  static startHeartbeat(userId, status = "online") {
    this.stopHeartbeat(userId);
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
        }
      } catch (error) {
        console.error(`❌ Heartbeat failed for user ${userId}:`, error);
        this.stopHeartbeat(userId);
      }
    }, this.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(userId, interval);
  }

  static stopHeartbeat(userId) {
    const interval = this.heartbeatIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(userId);
    }
  }

  static async getUserPresence(userId) {
    try {
      const presenceRef = doc(db, "userPresence", userId);
      const presenceSnap = await getDoc(presenceRef);
      if (presenceSnap.exists()) {
        const data = presenceSnap.data();
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

  static subscribeToUserPresence(userId, callback) {
    const presenceRef = doc(db, "userPresence", userId);
    const unsubscribe = onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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
    this.listeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  static unsubscribeFromUserPresence(userId) {
    const unsubscribe = this.listeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(userId);
    }
  }

  static async updateUserStatus(userId, status) {
    try {
      const presenceRef = doc(db, "userPresence", userId);
      await updateDoc(presenceRef, {
        status,
        isOnline: status !== "offline",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

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

  static async getMultipleUserPresence(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return {};
      }

      const presencePromises = userIds.map((userId) =>
        this.getUserPresence(userId)
      );
      const presenceList = await Promise.all(presencePromises);
      const presenceMap = {};
      presenceList.forEach((presence) => {
        presenceMap[presence.userId] = presence;
      });

      return presenceMap;
    } catch (error) {
      console.error(`❌ Error getting multiple user presence:`, error);
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

  static cleanup() {
    for (const [userId, unsubscribe] of this.listeners) {
      unsubscribe();
    }
    this.listeners.clear();
    for (const [userId, interval] of this.heartbeatIntervals) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();
  }

  static async cleanupStalePresence() {
    try {
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
      return cleanedCount;
    } catch (error) {
      console.error(`❌ Error cleaning up stale presence:`, error);
      return 0;
    }
  }

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
