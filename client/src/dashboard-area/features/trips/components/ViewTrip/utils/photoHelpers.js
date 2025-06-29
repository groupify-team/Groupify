import { MAX_PHOTOS_PER_TRIP } from "@shared/services/firebase/trips";

/**
 * Fix photo URL by replacing old domain with new Firebase storage domain
 */
export const fixPhotoUrl = (url) => {
  return url.replace(
    "groupify-77202.appspot.com",
    "groupify-77202.firebasestorage.app"
  );
};

/**
 * Check if photos can be uploaded (under limit)
 */
export const checkPhotoLimit = (currentPhotoCount) => {
  return currentPhotoCount < MAX_PHOTOS_PER_TRIP;
};

/**
 * Get remaining photo slots
 */
export const getRemainingPhotoSlots = (currentPhotoCount) => {
  return Math.max(0, MAX_PHOTOS_PER_TRIP - currentPhotoCount);
};

/**
 * Get photo limit status for UI feedback
 */
export const getPhotoLimitStatus = (currentPhotoCount) => {
  const remaining = getRemainingPhotoSlots(currentPhotoCount);
  if (remaining === 0) return "full";
  if (remaining <= 5) return "warning";
  return "normal";
};

/**
 * Calculate photo usage percentage
 */
export const getPhotoUsagePercentage = (currentPhotoCount) => {
  return Math.round((currentPhotoCount / MAX_PHOTOS_PER_TRIP) * 100);
};

/**
 * Validate uploaded photos against limit
 */
export const validatePhotoUpload = (currentPhotoCount, newPhotosCount) => {
  const totalAfterUpload = currentPhotoCount + newPhotosCount;

  if (totalAfterUpload <= MAX_PHOTOS_PER_TRIP) {
    return {
      isValid: true,
      allowedCount: newPhotosCount,
      rejectedCount: 0,
      message: `${newPhotosCount} photos uploaded successfully!`,
    };
  }

  const allowedCount = Math.max(0, MAX_PHOTOS_PER_TRIP - currentPhotoCount);
  const rejectedCount = newPhotosCount - allowedCount;

  return {
    isValid: false,
    allowedCount,
    rejectedCount,
    message: `Photo limit exceeded! Only ${allowedCount} photos were uploaded. ${rejectedCount} photos were rejected.`,
  };
};

/**
 * Get user initials for avatar fallback
 */
export const getInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate photo grid responsive classes
 */
export const getPhotoGridClasses = (size = "medium") => {
  const sizeClasses = {
    small:
      "grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10",
    medium: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
    large: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  };

  return `grid ${sizeClasses[size]} gap-2 sm:gap-3`;
};

/**
 * Calculate photo statistics
 */
export const calculatePhotoStats = (photos, memberCount) => {
  if (photos.length === 0) {
    return {
      totalPhotos: 0,
      daysActive: 0,
      avgPerMember: 0,
      oldestPhotoDate: null,
      newestPhotoDate: null,
    };
  }

  const dates = photos.map((p) => new Date(p.uploadedAt).getTime());
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  const daysActive = Math.ceil(
    (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24)
  );

  return {
    totalPhotos: photos.length,
    daysActive,
    avgPerMember:
      Math.round((photos.length / Math.max(memberCount, 1)) * 10) / 10,
    oldestPhotoDate: oldestDate,
    newestPhotoDate: newestDate,
  };
};

/**
 * Sort photos by date (newest first)
 */
export const sortPhotosByDate = (photos, order = "desc") => {
  return [...photos].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Filter photos by date range
 */
export const filterPhotosByDateRange = (photos, startDate, endDate) => {
  return photos.filter((photo) => {
    const photoDate = new Date(photo.uploadedAt);
    return photoDate >= startDate && photoDate <= endDate;
  });
};

/**
 * Get photo file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
