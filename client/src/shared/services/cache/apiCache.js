/**
 * Advanced API Response Cache with TTL and smart invalidation
 * This will dramatically reduce Firebase calls for frequently accessed data
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.ttl = {
      events: 5 * 60 * 1000, // 5 minutes
      photos: 3 * 60 * 1000, // 3 minutes
      users: 10 * 60 * 1000, // 10 minutes
      default: 2 * 60 * 1000, // 2 minutes
    };

    // Make cache globally accessible for logout cleanup
    if (typeof window !== "undefined") {
      window.apiCache = this;
    }
  }

  // Generate cache key
  generateKey(type, id, params = {}) {
    const paramString =
      Object.keys(params).length > 0 ? JSON.stringify(params) : "";
    return `${type}:${id}${paramString}`;
  }

  // Check if cache entry is still valid
  isValid(entry) {
    return entry && Date.now() - entry.timestamp < entry.ttl;
  }

  // Get from cache
  get(type, id, params = {}) {
    const key = this.generateKey(type, id, params);
    const entry = this.cache.get(key);

    if (this.isValid(entry)) {
      console.log(`🚀 Cache HIT for ${key}`);
      return entry.data;
    }

    if (entry) {
      console.log(`🕐 Cache EXPIRED for ${key}`);
      this.cache.delete(key);
    }

    return null;
  }

  // Set cache entry
  set(type, id, data, params = {}) {
    const key = this.generateKey(type, id, params);
    const ttl = this.ttl[type] || this.ttl.default;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`💾 Cache SET for ${key} (TTL: ${ttl}ms)`);
  }

  // Invalidate specific cache entries
  invalidate(type, id, params = {}) {
    const key = this.generateKey(type, id, params);
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`🗑️ Cache INVALIDATED for ${key}`);
    }
  }

  // Invalidate all entries of a type
  invalidateType(type) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `🗑️ Cache INVALIDATED all ${type} entries (${keysToDelete.length} items)`
    );
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    console.log("🧹 Cache CLEARED");
  }

  // Clear user-specific cache entries
  clearUserData(userId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      // Clear user-specific entries - be more comprehensive
      if (
        key.includes(`users:${userId}`) ||
        key.includes(`${userId}:`) ||
        key.includes(`events:${userId}`) ||
        key.includes(`photos:${userId}`) ||
        key.includes(`friends:${userId}`) ||
        key.includes(`user_${userId}`)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `🧹 Cache CLEARED for user ${userId} (${keysToDelete.length} items)`
    );
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      types: this.getTypeStats(),
    };
  }

  getTypeStats() {
    const stats = {};
    for (const [key] of this.cache) {
      const type = key.split(":")[0];
      stats[type] = (stats[type] || 0) + 1;
    }
    return stats;
  }
}

// Create singleton instance
const apiCache = new ApiCache();

// Export helper functions
export const getCachedData = (type, id, params) =>
  apiCache.get(type, id, params);
export const setCachedData = (type, id, data, params) =>
  apiCache.set(type, id, data, params);
export const invalidateCache = (type, id, params) =>
  apiCache.invalidate(type, id, params);
export const invalidateCacheType = (type) => apiCache.invalidateType(type);
export const clearCache = () => apiCache.clear();
export const clearUserData = (userId) => apiCache.clearUserData(userId);
export const getCacheStats = () => apiCache.getStats();

export default apiCache;
