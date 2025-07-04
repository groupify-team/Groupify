// subscriptionService.js - Enhanced with Plan Enforcement
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { db } from "./firebase/config";
import { getUserTripCount, getTripPhotoCount } from "./firebase/trips";

// Plan definitions with detailed limits
export const planLimits = {
  free: {
    id: 'free',
    name: 'Free',
    maxTrips: 5,
    maxPhotosPerTrip: 30,
    maxStorageGB: 2,
    maxAlbums: 3,
    maxFaceProfiles: 1,
    faceRecognition: false,
    advancedSearch: false,
    bulkDownload: false,
    apiAccess: false,
    priority: 1
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    maxTrips: 50,
    maxPhotosPerTrip: 500,
    maxStorageGB: 50,
    maxAlbums: 25,
    maxFaceProfiles: 10,
    faceRecognition: true,
    advancedSearch: true,
    bulkDownload: true,
    apiAccess: false,
    priority: 2
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    maxTrips: -1, // unlimited
    maxPhotosPerTrip: -1,
    maxStorageGB: 500,
    maxAlbums: -1,
    maxFaceProfiles: -1,
    faceRecognition: true,
    advancedSearch: true,
    bulkDownload: true,
    apiAccess: true,
    priority: 3
  }
};

// Get user's current subscription plan
export const getUserSubscriptionPlan = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.subscriptionPlan || 'free';
    }
    return 'free';
  } catch (error) {
    console.error('Error getting user subscription plan:', error);
    return 'free';
  }
};

// Get user's detailed subscription info
export const getUserSubscriptionInfo = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const planId = userData.subscriptionPlan || 'free';
      
      return {
        planId,
        planDetails: planLimits[planId],
        subscriptionStatus: userData.subscriptionStatus || 'active',
        subscriptionStart: userData.subscriptionStart || null,
        subscriptionEnd: userData.subscriptionEnd || null,
        trialEnd: userData.trialEnd || null,
        isTrialActive: userData.trialEnd ? new Date(userData.trialEnd) > new Date() : false
      };
    }
    
    return {
      planId: 'free',
      planDetails: planLimits.free,
      subscriptionStatus: 'active',
      subscriptionStart: null,
      subscriptionEnd: null,
      trialEnd: null,
      isTrialActive: false
    };
  } catch (error) {
    console.error('Error getting user subscription info:', error);
    return {
      planId: 'free',
      planDetails: planLimits.free,
      subscriptionStatus: 'active'
    };
  }
};

// Calculate user's storage usage
export const getUserStorageUsage = async (userId) => {
  try {
    const photosQuery = query(
      collection(db, "photos"),
      where("uploadedBy", "==", userId)
    );
    
    const snapshot = await getDocs(photosQuery);
    let totalBytes = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalBytes += data.size || 0;
    });
    
    return totalBytes;
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
};

// Get user's current usage statistics
export const getUserUsageStats = async (userId) => {
  try {
    const [tripCount, storageBytes, subscriptionInfo] = await Promise.all([
      getUserTripCount(userId),
      getUserStorageUsage(userId),
      getUserSubscriptionInfo(userId)
    ]);
    
    // Get photo counts for all trips
    const tripsQuery = query(
      collection(db, "trips"),
      where("createdBy", "==", userId)
    );
    const tripsSnapshot = await getDocs(tripsQuery);
    
    let totalPhotos = 0;
    const tripPhotoCounts = {};
    
    for (const tripDoc of tripsSnapshot.docs) {
      const photoCount = await getTripPhotoCount(tripDoc.id);
      tripPhotoCounts[tripDoc.id] = photoCount;
      totalPhotos += photoCount;
    }
    
    // Get album count (if you have albums feature)
    const albumsQuery = query(
      collection(db, "albums"),
      where("createdBy", "==", userId)
    );
    const albumsSnapshot = await getDocs(albumsQuery);
    const albumCount = albumsSnapshot.size;
    
    // Get face profiles count (if you have face recognition)
    const faceProfilesQuery = query(
      collection(db, "faceProfiles"),
      where("userId", "==", userId)
    );
    const faceProfilesSnapshot = await getDocs(faceProfilesQuery);
    const faceProfileCount = faceProfilesSnapshot.size;
    
    const storageGB = storageBytes / (1024 * 1024 * 1024);
    const limits = subscriptionInfo.planDetails;
    
    return {
      planId: subscriptionInfo.planId,
      planName: subscriptionInfo.planDetails.name,
      limits,
      usage: {
        trips: {
          current: tripCount,
          limit: limits.maxTrips,
          percentage: limits.maxTrips === -1 ? 0 : Math.round((tripCount / limits.maxTrips) * 100),
          remaining: limits.maxTrips === -1 ? Infinity : Math.max(0, limits.maxTrips - tripCount)
        },
        storage: {
          currentGB: Number(storageGB.toFixed(2)),
          limitGB: limits.maxStorageGB,
          currentBytes: storageBytes,
          percentage: Math.round((storageGB / limits.maxStorageGB) * 100),
          remainingGB: Number((limits.maxStorageGB - storageGB).toFixed(2))
        },
        photos: {
          total: totalPhotos,
          byTrip: tripPhotoCounts
        },
        albums: {
          current: albumCount,
          limit: limits.maxAlbums,
          percentage: limits.maxAlbums === -1 ? 0 : Math.round((albumCount / limits.maxAlbums) * 100),
          remaining: limits.maxAlbums === -1 ? Infinity : Math.max(0, limits.maxAlbums - albumCount)
        },
        faceProfiles: {
          current: faceProfileCount,
          limit: limits.maxFaceProfiles,
          percentage: limits.maxFaceProfiles === -1 ? 0 : Math.round((faceProfileCount / limits.maxFaceProfiles) * 100),
          remaining: limits.maxFaceProfiles === -1 ? Infinity : Math.max(0, limits.maxFaceProfiles - faceProfileCount)
        }
      },
      subscriptionInfo
    };
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    throw error;
  }
};

// Enhanced validation functions with detailed responses
export const validatePlanLimits = {
  // Validate trip creation
  async canCreateTrip(userId, customPlan = null) {
    try {
      const userPlan = customPlan || await getUserSubscriptionPlan(userId);
      const limits = planLimits[userPlan];
      
      if (limits.maxTrips === -1) {
        return { 
          allowed: true,
          unlimited: true,
          planName: limits.name
        };
      }
      
      const currentCount = await getUserTripCount(userId);
      const allowed = currentCount < limits.maxTrips;
      const remaining = Math.max(0, limits.maxTrips - currentCount);
      
      return {
        allowed,
        current: currentCount,
        limit: limits.maxTrips,
        remaining,
        percentage: Math.round((currentCount / limits.maxTrips) * 100),
        planName: limits.name,
        message: allowed ? null : 
          `Trip limit reached! Your ${limits.name} plan allows ${limits.maxTrips} trips. Upgrade to create more trips.`,
        upgradeMessage: remaining <= 1 ? 
          `You're almost at your trip limit (${currentCount}/${limits.maxTrips}). Consider upgrading.` : null
      };
    } catch (error) {
      console.error('Error validating trip creation:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate trip limit. Please try again.',
        error: true
      };
    }
  },

  // Validate photo upload for a specific trip
  async canUploadPhotos(tripId, photoCount, userId, customPlan = null) {
    try {
      const userPlan = customPlan || await getUserSubscriptionPlan(userId);
      const limits = planLimits[userPlan];
      
      if (limits.maxPhotosPerTrip === -1) {
        return { 
          allowed: true,
          unlimited: true,
          planName: limits.name
        };
      }
      
      const currentCount = await getTripPhotoCount(tripId);
      const wouldExceed = (currentCount + photoCount) > limits.maxPhotosPerTrip;
      const allowedCount = Math.max(0, limits.maxPhotosPerTrip - currentCount);
      const remaining = Math.max(0, limits.maxPhotosPerTrip - currentCount);
      
      return {
        allowed: !wouldExceed,
        current: currentCount,
        limit: limits.maxPhotosPerTrip,
        requesting: photoCount,
        allowedCount,
        remaining,
        percentage: Math.round((currentCount / limits.maxPhotosPerTrip) * 100),
        planName: limits.name,
        message: wouldExceed ? 
          `Photo limit reached! Your ${limits.name} plan allows ${limits.maxPhotosPerTrip} photos per trip. You can upload ${allowedCount} more photos to this trip.` : 
          null,
        upgradeMessage: remaining <= 5 ? 
          `You're almost at your photo limit for this trip (${currentCount}/${limits.maxPhotosPerTrip}). Consider upgrading.` : null
      };
    } catch (error) {
      console.error('Error validating photo upload:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate photo limit. Please try again.',
        error: true
      };
    }
  },

  // Validate storage usage
  async canUploadFileSize(userId, fileSizeBytes, customPlan = null) {
    try {
      const userPlan = customPlan || await getUserSubscriptionPlan(userId);
      const limits = planLimits[userPlan];
      const limitBytes = limits.maxStorageGB * 1024 * 1024 * 1024;
      
      const currentUsage = await getUserStorageUsage(userId);
      const wouldExceed = (currentUsage + fileSizeBytes) > limitBytes;
      const remainingBytes = Math.max(0, limitBytes - currentUsage);
      
      const currentUsageGB = currentUsage / (1024 * 1024 * 1024);
      const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
      const remainingGB = remainingBytes / (1024 * 1024 * 1024);
      
      return {
        allowed: !wouldExceed,
        currentUsageGB: Number(currentUsageGB.toFixed(2)),
        limitGB: limits.maxStorageGB,
        fileSizeGB: Number(fileSizeGB.toFixed(2)),
        remainingGB: Number(remainingGB.toFixed(2)),
        percentage: Math.round((currentUsageGB / limits.maxStorageGB) * 100),
        planName: limits.name,
        message: wouldExceed ? 
          `Storage limit exceeded! Your ${limits.name} plan includes ${limits.maxStorageGB}GB. You have ${remainingGB.toFixed(2)}GB remaining. Upgrade for more storage.` : 
          null,
        upgradeMessage: remainingGB < 0.5 ? 
          `You're running low on storage (${currentUsageGB.toFixed(1)}GB/${limits.maxStorageGB}GB used). Consider upgrading.` : null
      };
    } catch (error) {
      console.error('Error validating storage:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate storage limit. Please try again.',
        error: true
      };
    }
  },

  // Validate multiple file uploads at once
  async canUploadMultipleFiles(tripId, files, userId, customPlan = null) {
    try {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const photoCount = files.length;
      
      const [photoValidation, storageValidation] = await Promise.all([
        this.canUploadPhotos(tripId, photoCount, userId, customPlan),
        this.canUploadFileSize(userId, totalSize, customPlan)
      ]);
      
      const allowed = photoValidation.allowed && storageValidation.allowed;
      const messages = [];
      
      if (!photoValidation.allowed) messages.push(photoValidation.message);
      if (!storageValidation.allowed) messages.push(storageValidation.message);
      
      return {
        allowed,
        photoValidation,
        storageValidation,
        totalFiles: photoCount,
        totalSizeGB: Number((totalSize / (1024 * 1024 * 1024)).toFixed(2)),
        message: messages.length > 0 ? messages.join(' ') : null
      };
    } catch (error) {
      console.error('Error validating multiple file upload:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate upload. Please try again.',
        error: true
      };
    }
  },

  // Validate album creation
  async canCreateAlbum(userId, customPlan = null) {
    try {
      const userPlan = customPlan || await getUserSubscriptionPlan(userId);
      const limits = planLimits[userPlan];
      
      if (limits.maxAlbums === -1) {
        return { 
          allowed: true,
          unlimited: true,
          planName: limits.name
        };
      }
      
      const albumsQuery = query(
        collection(db, "albums"),
        where("createdBy", "==", userId)
      );
      const albumsSnapshot = await getDocs(albumsQuery);
      const currentCount = albumsSnapshot.size;
      
      const allowed = currentCount < limits.maxAlbums;
      const remaining = Math.max(0, limits.maxAlbums - currentCount);
      
      return {
        allowed,
        current: currentCount,
        limit: limits.maxAlbums,
        remaining,
        percentage: Math.round((currentCount / limits.maxAlbums) * 100),
        planName: limits.name,
        message: allowed ? null : 
          `Album limit reached! Your ${limits.name} plan allows ${limits.maxAlbums} albums. Upgrade to create more albums.`,
        upgradeMessage: remaining <= 1 ? 
          `You're almost at your album limit (${currentCount}/${limits.maxAlbums}). Consider upgrading.` : null
      };
    } catch (error) {
      console.error('Error validating album creation:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate album limit. Please try again.',
        error: true
      };
    }
  },

  // Validate face profile creation
  async canCreateFaceProfile(userId, customPlan = null) {
    try {
      const userPlan = customPlan || await getUserSubscriptionPlan(userId);
      const limits = planLimits[userPlan];
      
      if (!limits.faceRecognition) {
        return {
          allowed: false,
          featureNotAvailable: true,
          planName: limits.name,
          message: `Face recognition is not available in your ${limits.name} plan. Upgrade to Premium or Pro to use this feature.`
        };
      }
      
      if (limits.maxFaceProfiles === -1) {
        return { 
          allowed: true,
          unlimited: true,
          planName: limits.name
        };
      }
      
      const faceProfilesQuery = query(
        collection(db, "faceProfiles"),
        where("userId", "==", userId)
      );
      const faceProfilesSnapshot = await getDocs(faceProfilesQuery);
      const currentCount = faceProfilesSnapshot.size;
      
      const allowed = currentCount < limits.maxFaceProfiles;
      const remaining = Math.max(0, limits.maxFaceProfiles - currentCount);
      
      return {
        allowed,
        current: currentCount,
        limit: limits.maxFaceProfiles,
        remaining,
        percentage: Math.round((currentCount / limits.maxFaceProfiles) * 100),
        planName: limits.name,
        message: allowed ? null : 
          `Face profile limit reached! Your ${limits.name} plan allows ${limits.maxFaceProfiles} face profiles. Upgrade to create more profiles.`,
        upgradeMessage: remaining <= 1 ? 
          `You're almost at your face profile limit (${currentCount}/${limits.maxFaceProfiles}). Consider upgrading.` : null
      };
    } catch (error) {
      console.error('Error validating face profile creation:', error);
      return { 
        allowed: false, 
        message: 'Unable to validate face profile limit. Please try again.',
        error: true
      };
    }
  }
};

// Update user's subscription plan
export const updateUserSubscriptionPlan = async (userId, planId, subscriptionData = {}) => {
  try {
    const updateData = {
      subscriptionPlan: planId,
      subscriptionStatus: subscriptionData.status || 'active',
      updatedAt: new Date().toISOString(),
      ...subscriptionData
    };
    
    await updateDoc(doc(db, "users", userId), updateData);
    
    // Log subscription change
    await addDoc(collection(db, "subscriptionLogs"), {
      userId,
      action: 'plan_updated',
      fromPlan: subscriptionData.previousPlan || 'unknown',
      toPlan: planId,
      timestamp: serverTimestamp(),
      metadata: subscriptionData
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user subscription plan:', error);
    throw error;
  }
};

// Check if user has access to a specific feature
export const hasFeatureAccess = async (userId, feature) => {
  try {
    const userPlan = await getUserSubscriptionPlan(userId);
    const limits = planLimits[userPlan];
    
    const featureMap = {
      'face_recognition': limits.faceRecognition,
      'advanced_search': limits.advancedSearch,
      'bulk_download': limits.bulkDownload,
      'api_access': limits.apiAccess
    };
    
    return {
      hasAccess: featureMap[feature] || false,
      planName: limits.name,
      planId: userPlan,
      feature
    };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { hasAccess: false, error: true };
  }
};

// Usage tracking functions
export const trackUsage = {
  async recordPhotoUpload(userId, tripId, fileSize, metadata = {}) {
    try {
      await addDoc(collection(db, "usageTracking"), {
        userId,
        tripId,
        action: 'photo_upload',
        fileSize,
        timestamp: serverTimestamp(),
        metadata
      });
    } catch (error) {
      console.error('Error recording photo upload usage:', error);
    }
  },
  
  async recordTripCreation(userId, tripId, metadata = {}) {
    try {
      await addDoc(collection(db, "usageTracking"), {
        userId,
        tripId,
        action: 'trip_creation',
        timestamp: serverTimestamp(),
        metadata
      });
    } catch (error) {
      console.error('Error recording trip creation usage:', error);
    }
  }
};

// Export all plan limits for reference
export { planLimits };

// Default export for backwards compatibility
export default {
  planLimits,
  getUserSubscriptionPlan,
  getUserSubscriptionInfo,
  getUserStorageUsage,
  getUserUsageStats,
  validatePlanLimits,
  updateUserSubscriptionPlan,
  hasFeatureAccess,
  trackUsage
};