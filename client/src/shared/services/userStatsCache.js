import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

import { PresenceService } from "@shared/services/presence/PresenceService";

class UserStatsCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;

    if (typeof window !== "undefined") {
      window.userStatsCache = this;
    }
  }

  async getUserStats(userId) {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (this.pendingRequests.has(userId)) {
      return this.pendingRequests.get(userId);
    }
    const requestPromise = this._fetchUserStats(userId);
    this.pendingRequests.set(userId, requestPromise);
    try {
      const stats = await requestPromise;
      this.cache.set(userId, {
        data: stats,
        timestamp: Date.now(),
      });
      return stats;
    } finally {
      this.pendingRequests.delete(userId);
    }
  }

  async _fetchUserStats(userId) {
    try {
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      let friendsCount = 0;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        friendsCount = (userData.friends || []).length;
      }

      const eventsQuery = query(
        collection(db, "events"),
        where("members", "array-contains", userId)
      );
      const eventsSnap = await getDocs(eventsQuery);
      const eventsCount = eventsSnap.size;
      const presence = await PresenceService.getUserPresence(userId);

      return {
        friendsCount,
        eventsCount,
        presence,
        loading: false,
        error: false,
      };
    } catch (error) {
      console.error("❌ Error fetching user stats:", error);
      return {
        friendsCount: 0,
        eventsCount: 0,
        presence: {
          userId,
          isOnline: false,
          status: "offline",
          lastSeen: null,
          updatedAt: null,
        },
        loading: false,
        error: true,
      };
    }
  }

  invalidateUser(userId) {
    this.cache.delete(userId);
  }

  clearOldCache() {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(userId);
      }
    }
  }
}

export const userStatsCache = new UserStatsCache();

setInterval(() => {
  userStatsCache.clearOldCache();
}, 10 * 60 * 1000);
