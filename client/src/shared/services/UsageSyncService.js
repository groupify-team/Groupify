import subscriptionService from "@shared/services/subscriptionService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { getEventPhotos } from "@shared/services/firebase/storage";

class UsageSyncService {
  constructor() {
    this.isInitialized = false;
    this.syncPromise = null;
    this.listeners = new Set();
    this.lastSyncTime = null;
    this.syncCooldown = 5000; // 5 seconds minimum between syncs
  }

  async syncUsageWithFirebase(userId) {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    // Prevent excessive syncing
    if (this.lastSyncTime && (Date.now() - this.lastSyncTime) < this.syncCooldown) {
      console.log("🔄 UsageSyncService: Sync cooldown active, skipping");
      return { synced: false, reason: "cooldown" };
    }

    this.syncPromise = this._performSync(userId);
    const result = await this.syncPromise;
    this.syncPromise = null;
    this.lastSyncTime = Date.now();
    return result;
  }

  async _performSync(userId) {
    try {
      console.log("🔄 UsageSyncService: Starting sync for user:", userId);
      
      // Get actual counts from Firebase
      const actualCounts = await this._getActualUsageFromFirebase(userId);
      console.log("📊 UsageSyncService: Actual Firebase counts:", actualCounts);
      
      // Get current localStorage usage
      const currentUsage = subscriptionService.getStoredUsage();
      console.log("📊 UsageSyncService: Current localStorage usage:", currentUsage);
      
      // Compare and sync if different
      if (this._hasDiscrepancy(currentUsage, actualCounts)) {
        console.log("⚠️ UsageSyncService: Discrepancy found, syncing...");
        const correctedUsage = subscriptionService.syncUsageWithActualData(actualCounts);
        this._notifyListeners('usageSynced', { corrected: correctedUsage, actual: actualCounts });
        return { synced: true, corrected: correctedUsage };
      }
      
      console.log("✅ UsageSyncService: Usage already in sync");
      return { synced: false, counts: actualCounts };
      
    } catch (error) {
      console.error("❌ UsageSyncService: Sync failed:", error);
      throw error;
    }
  }

  async _getActualUsageFromFirebase(userId) {
    try {
      // Direct Firebase query to avoid circular import
      const eventsQuery = query(
        collection(db, "events"),
        where("members", "array-contains", userId)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      let totalPhotos = 0;
      let totalStorage = 0;
      
      // Get photo counts for each event (with error handling)
      for (const event of events) {
        try {
          const photos = await getEventPhotos(event.id);
          totalPhotos += photos.length;
          totalStorage += photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
        } catch (error) {
          // Handle Firebase storage permission errors gracefully
          if (error.code === 'storage/unauthorized') {
            console.warn(`Storage access denied for event ${event.id}, using stored photo count`);
            totalPhotos += event.photoCount || 0;
          } else {
            console.warn(`Failed to get photos for event ${event.id}:`, error);
          }
        }
      }
      
      return {
        events: events.length,
        photos: totalPhotos,
        storage: totalStorage,
      };
    } catch (error) {
      console.error("❌ UsageSyncService: Failed to get actual usage:", error);
      throw error;
    }
  }

  _hasDiscrepancy(current, actual) {
    return (
      current.events !== actual.events ||
      current.photos !== actual.photos ||
      Math.abs(current.storage - actual.storage) > 1024 // 1KB tolerance
    );
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (error) {
        console.error("UsageSyncService listener error:", error);
      }
    });
  }

  async initializeSync(userId) {
    if (this.isInitialized) return;
    
    try {
      await this.syncUsageWithFirebase(userId);
      this.isInitialized = true;
      console.log("✅ UsageSyncService: Initialized successfully");
    } catch (error) {
      console.error("❌ UsageSyncService: Initialization failed:", error);
    }
  }

  // Add method to force sync (bypass cooldown)
  async forceSyncUsageWithFirebase(userId) {
    this.lastSyncTime = null; // Reset cooldown
    return this.syncUsageWithFirebase(userId);
  }
}

// Create and export the service instance
const usageSyncService = new UsageSyncService();

export { usageSyncService };
export default usageSyncService;
