import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import subscriptionService from "@shared/services/subscriptionService";

// Helper function to get Firebase services dynamically
const getFirebaseServices = async () => {
  const [storage, db] = await Promise.all([
    import("@shared/services/firebase/config").then((m) => m.getStorage()),
    import("@shared/services/firebase/config").then((m) => m.getFirestore()),
  ]);
  return { storage, db };
};

/**
 * Upload a photo to Firebase Storage and save metadata to Firestore
 * @param {File} file - The file to upload
 * @param {string} tripId - The ID of the trip
 * @param {string} userId - The ID of the user uploading
 * @param {object} metadata - Additional metadata to store
 * @param {function} onProgress - Callback for upload progress (percent)
 * @returns {Promise<object>} - The uploaded photo data
 */
export const uploadPhoto = async (
  file,
  tripId,
  userId,
  metadata = {},
  onProgress
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get Firebase services dynamically
      const { storage, db } = await getFirebaseServices();

      // PLAN VALIDATION BEFORE UPLOAD
      const subscription = subscriptionService.getCurrentSubscription();
      const usage = subscription.usage;

      // Check storage limit using exact subscription service values
      if (subscription.features.storageBytes !== Number.MAX_SAFE_INTEGER) {
        if (
          usage.storage.used + file.size >
          subscription.features.storageBytes
        ) {
          reject(
            new Error(
              `Storage limit exceeded! You've used ${usage.storage.usedFormatted} of ${subscription.features.storage}. Upgrade your ${subscription.plan} plan for more storage.`
            )
          );
          return;
        }
      }

      // Check if file is too large (10MB limit regardless of plan)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        reject(
          new Error(
            `File too large! Maximum file size is 10MB. Your file is ${subscriptionService.formatBytes(
              file.size
            )}.`
          )
        );
        return;
      }

      const fileExtension = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storagePath = `photos/${tripId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (onProgress) {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress(percent);
          }
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          try {
            const rawURL = await getDownloadURL(uploadTask.snapshot.ref);
            const downloadURL = rawURL.replace(
              "groupify-77202.appspot.com",
              "groupify-77202.firebasestorage.app"
            );

            const photoData = {
              fileName,
              filePath: storagePath,
              downloadURL,
              uploadedBy: userId,
              tripId,
              uploadedAt: new Date().toISOString(),
              size: file.size, // CRITICAL: Store file size for usage tracking
              originalName: metadata.originalName || file.name,
              type: file.type,
              // Plan information at time of upload
              planAtUpload: subscription.plan,
              ...metadata,
            };

            // Add to both collections for proper trip organization
            const [photoDocRef, tripPhotoDocRef] = await Promise.all([
              addDoc(collection(db, "photos"), photoData),
              addDoc(collection(db, "tripPhotos"), photoData),
            ]);

            // UPDATE USAGE STATISTICS after successful upload
            subscriptionService.updateUsage({
              photos: usage.photos.used + 1,
              storage: usage.storage.used + file.size,
            });

            // Return photo data with IDs
            resolve({
              id: photoDocRef.id,
              tripPhotoId: tripPhotoDocRef.id,
              ...photoData,
            });
          } catch (err) {
            console.error("Error saving photo metadata:", err);
            reject(err);
          }
        }
      );
    } catch (error) {
      console.error("Error in uploadPhoto:", error);
      reject(error);
    }
  });
};

/**
 * Get all photos for a specific trip
 */
export const getTripPhotos = async (tripId) => {
  try {
    const { db } = await getFirebaseServices();

    const photosQuery = query(
      collection(db, "photos"),
      where("tripId", "==", tripId)
    );

    const querySnapshot = await getDocs(photosQuery);
    const photos = [];

    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return photos.sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
  } catch (error) {
    console.error("Error getting trip photos:", error);
    throw error;
  }
};

/**
 * Get all photos uploaded by a specific user
 */
export const getUserPhotos = async (userId) => {
  try {
    const { db } = await getFirebaseServices();

    const photosQuery = query(
      collection(db, "photos"),
      where("uploadedBy", "==", userId)
    );

    const querySnapshot = await getDocs(photosQuery);
    const photos = [];

    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return photos.sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
  } catch (error) {
    console.error("Error getting user photos:", error);
    throw error;
  }
};

/**
 * Validate multiple file uploads before processing
 * @param {Array} files - Array of files to validate
 * @param {string} tripId - Trip ID for context
 * @param {number} currentTripPhotoCount - Current photos in trip
 * @returns {Object} Validation result
 */
export const validateFileUploads = async (
  files,
  tripId,
  currentTripPhotoCount = 0
) => {
  try {
    const subscription = subscriptionService.getCurrentSubscription();
    const usage = subscription.usage;

    // Calculate total file size
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);

    // Check per-trip photo limit
    const photosPerTripLimit = subscription.features.photosPerTrip;
    if (photosPerTripLimit !== "unlimited") {
      if (currentTripPhotoCount + files.length > photosPerTripLimit) {
        return {
          allowed: false,
          reason: `Trip photo limit exceeded! Your ${subscription.plan} plan allows ${photosPerTripLimit} photos per trip. You currently have ${currentTripPhotoCount} photos.`,
          type: "trip_photo_limit",
          currentUsage: currentTripPhotoCount,
          limit: photosPerTripLimit,
        };
      }
    }

    // Check storage limit
    if (subscription.features.storageBytes !== Number.MAX_SAFE_INTEGER) {
      if (
        usage.storage.used + totalFileSize >
        subscription.features.storageBytes
      ) {
        return {
          allowed: false,
          reason: `Storage limit exceeded! You've used ${
            usage.storage.usedFormatted
          } of ${
            subscription.features.storage
          }. These files need ${subscriptionService.formatBytes(
            totalFileSize
          )} more space.`,
          type: "storage_limit",
          currentUsage: usage.storage.used,
          limit: subscription.features.storageBytes,
          additionalNeeded: totalFileSize,
        };
      }
    }

    // Check individual file sizes
    const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      return {
        allowed: false,
        reason: `${
          oversizedFiles.length
        } file(s) exceed the 10MB size limit: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`,
        type: "file_size_limit",
        oversizedFiles: oversizedFiles.map((f) => ({
          name: f.name,
          size: subscriptionService.formatBytes(f.size),
        })),
      };
    }

    // Check file types
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      return {
        allowed: false,
        reason: `${invalidFiles.length} file(s) are not images: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}`,
        type: "file_type_invalid",
        invalidFiles: invalidFiles.map((f) => ({ name: f.name, type: f.type })),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error validating file uploads:", error);
    return {
      allowed: false,
      reason: "Failed to validate uploads. Please try again.",
      type: "validation_error",
    };
  }
};

/**
 * Batch upload multiple photos with progress tracking
 * @param {Array} files - Array of files to upload
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID
 * @param {function} onProgress - Progress callback
 * @param {function} onFileComplete - Individual file completion callback
 * @returns {Promise<Array>} Array of uploaded photo data
 */
export const batchUploadPhotos = async (
  files,
  tripId,
  userId,
  onProgress,
  onFileComplete
) => {
  const uploadedPhotos = [];
  const errors = [];

  try {
    // Pre-validate all files
    const validation = await validateFileUploads(files, tripId);
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const uploadedPhoto = await uploadPhoto(
          file,
          tripId,
          userId,
          {
            originalName: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            batchIndex: i,
            batchTotal: files.length,
          },
          (percent) => {
            // Calculate overall progress
            const overallProgress = Math.round(
              ((i + percent / 100) / files.length) * 100
            );
            if (onProgress) onProgress(overallProgress);
          }
        );

        uploadedPhotos.push(uploadedPhoto);

        if (onFileComplete) {
          onFileComplete(uploadedPhoto, i + 1, files.length);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      console.warn("Some files failed to upload:", errors);
      // Still return successful uploads
    }

    return uploadedPhotos;
  } catch (error) {
    console.error("Error in batch upload:", error);
    throw error;
  }
};

/**
 * Calculate storage usage for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Storage usage data
 */
export const calculateUserStorageUsage = async (userId) => {
  try {
    const userPhotos = await getUserPhotos(userId);

    const totalSize = userPhotos.reduce((sum, photo) => {
      return sum + (photo.size || 0);
    }, 0);

    const photoCount = userPhotos.length;

    return {
      totalSize,
      totalSizeFormatted: subscriptionService.formatBytes(totalSize),
      photoCount,
      photos: userPhotos.map((photo) => ({
        id: photo.id,
        fileName: photo.fileName || photo.originalName,
        size: photo.size || 0,
        sizeFormatted: subscriptionService.formatBytes(photo.size || 0),
        uploadedAt: photo.uploadedAt,
        tripId: photo.tripId,
      })),
    };
  } catch (error) {
    console.error("Error calculating storage usage:", error);
    throw error;
  }
};

/**
 * Delete photo and update usage statistics
 * @param {string} photoId - Photo ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const deletePhoto = async (photoId, userId) => {
  try {
    const { db } = await getFirebaseServices();

    // Get photo data before deletion
    const photoQuery = query(
      collection(db, "photos"),
      where("id", "==", photoId),
      where("uploadedBy", "==", userId)
    );

    const photoSnapshot = await getDocs(photoQuery);
    if (photoSnapshot.empty) {
      throw new Error("Photo not found or access denied");
    }

    const photoData = photoSnapshot.docs[0].data();
    const photoSize = photoData.size || 0;

    // Delete from both collections
    await Promise.all([
      deleteDoc(doc(db, "photos", photoId)),
      deleteDoc(doc(db, "tripPhotos", photoData.tripPhotoId)),
    ]);

    // Update usage statistics
    const subscription = subscriptionService.getCurrentSubscription();
    const usage = subscription.usage;

    subscriptionService.updateUsage({
      photos: Math.max(0, usage.photos.used - 1),
      storage: Math.max(0, usage.storage.used - photoSize),
    });

    return true;
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};
