// Create this file: client/src/shared/services/userStatsCache.js

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

class UserStatsCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Make cache globally accessible for logout cleanup
    if (typeof window !== "undefined") {
      window.userStatsCache = this;
    }
  }

  async getUserStats(userId) {
    // Check if we have cached data that's still fresh
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Using cached stats for user ${userId}`);
      return cached.data;
    }

    // Check if we're already fetching this user's data
    if (this.pendingRequests.has(userId)) {
      console.log(`⏳ Waiting for pending request for user ${userId}`);
      return this.pendingRequests.get(userId);
    }

    // Create new request
    console.log(`🔄 Fetching fresh stats for user ${userId}`);
    const requestPromise = this._fetchUserStats(userId);
    this.pendingRequests.set(userId, requestPromise);

    try {
      const stats = await requestPromise;

      // Cache the result
      this.cache.set(userId, {
        data: stats,
        timestamp: Date.now(),
      });

      console.log(`✅ Cached stats for user ${userId}:`, stats);
      return stats;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(userId);
    }
  }

  async _fetchUserStats(userId) {
    try {
      // Fetch user document for friends count
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      let friendsCount = 0;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        friendsCount = (userData.friends || []).length;
      }

      // Fetch events count
      const eventsQuery = query(
        collection(db, "events"),
        where("members", "array-contains", userId)
      );
      const eventsSnap = await getDocs(eventsQuery);
      const eventsCount = eventsSnap.size;

      return {
        friendsCount,
        eventsCount,
        loading: false,
        error: false,
      };
    } catch (error) {
      console.error("❌ Error fetching user stats:", error);
      return {
        friendsCount: 0,
        eventsCount: 0,
        loading: false,
        error: true,
      };
    }
  }

  // Method to invalidate cache when we know data has changed
  invalidateUser(userId) {
    console.log(`🗑️ Invalidating cache for user ${userId}`);
    this.cache.delete(userId);
  }

  // Method to clear old cache entries
  clearOldCache() {
    const now = Date.now();
    let cleared = 0;
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(userId);
        cleared++;
      }
    }
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} old cache entries`);
    }
  }

  // Get cache info for debugging
  getCacheInfo() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([userId, cached]) => ({
        userId,
        age: Date.now() - cached.timestamp,
        data: cached.data,
      })),
    };
  }
}

// Export singleton instance
export const userStatsCache = new UserStatsCache();

// Clean up old cache every 10 minutes
setInterval(() => {
  userStatsCache.clearOldCache();
}, 10 * 60 * 1000);

// Log cache info every 30 seconds (for debugging - remove in production)
if (import.meta.env.DEV) {
  setInterval(() => {
    const info = userStatsCache.getCacheInfo();
    if (info.size > 0) {
      console.log("📊 Cache info:", info);
    }
  }, 30 * 1000);
}
