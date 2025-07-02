/**
 * General trip utilities and helper functions
 * Handles trip status, date formatting, member sorting, and form validation
 */

export const formatTripDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

export const getTripStatus = (trip) => {
  if (!trip.startDate) return { status: "draft", color: "gray" };

  const now = new Date();
  const startDate = new Date(trip.startDate);
  const endDate = trip.endDate ? new Date(trip.endDate) : startDate;

  if (endDate < now) return { status: "completed", color: "green" };
  if (startDate > now) return { status: "upcoming", color: "blue" };
  return { status: "ongoing", color: "purple" };
};

export const isUserTripAdmin = (trip, userId) => {
  return trip?.admins?.includes(userId) || trip?.createdBy === userId;
};

export const isUserTripMember = (trip, userId) => {
  return trip?.members?.includes(userId);
};

// Photo utility functions
export const checkPhotoLimit = (currentCount, maxPhotos) => {
  return currentCount < maxPhotos;
};

export const getRemainingPhotoSlots = (currentCount, maxPhotos) => {
  return Math.max(0, maxPhotos - currentCount);
};

export const getPhotoLimitStatus = (currentCount, maxPhotos) => {
  const remaining = getRemainingPhotoSlots(currentCount, maxPhotos);
  if (remaining === 0) return "full";
  if (remaining <= 5) return "warning";
  return "normal";
};

// Member utility functions
export const sortTripMembers = (members, currentUserId, creatorId) => {
  return [...members].sort((a, b) => {
    if (a.uid === currentUserId) return -1;
    if (b.uid === currentUserId) return 1;
    if (a.uid === creatorId) return -1;
    if (b.uid === creatorId) return 1;
    return (a.displayName || a.email || "").localeCompare(
      b.displayName || b.email || ""
    );
  });
};

export const getMemberRole = (member, trip) => {
  if (member.uid === trip.createdBy) {
    return { role: "creator", label: "Creator", color: "purple" };
  }
  if (trip.admins?.includes(member.uid)) {
    return { role: "admin", label: "Admin", color: "blue" };
  }
  return { role: "member", label: "Member", color: "gray" };
};

// Date validation
export const validateDates = (startDate, endDate) => {
  if (!startDate && !endDate) return { valid: true };
  if (!startDate || !endDate) return { valid: true };

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      valid: false,
      error: "End date must be after start date",
    };
  }

  return { valid: true };
};

// Trip statistics
export const getTripStats = (trip, photos, members) => {
  const stats = {
    totalPhotos: photos?.length || 0,
    totalMembers: members?.length || 0,
    daysActive: 0,
    avgPhotosPerMember: 0,
  };

  // Calculate days active
  if (photos && photos.length > 0) {
    const oldestPhoto = Math.min(
      ...photos.map((p) => new Date(p.uploadedAt).getTime())
    );
    stats.daysActive = Math.ceil(
      (Date.now() - oldestPhoto) / (1000 * 60 * 60 * 24)
    );
  }

  // Calculate average photos per member
  if (stats.totalMembers > 0) {
    stats.avgPhotosPerMember =
      Math.round((stats.totalPhotos / stats.totalMembers) * 10) / 10;
  }

  return stats;
};

// Image URL helpers
export const fixImageUrl = (url) => {
  if (!url) return url;
  return url.replace(
    "groupify-77202.appspot.com",
    "groupify-77202.firebasestorage.app"
  );
};

// Form validation
export const validateTripForm = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) {
    errors.name = "Trip name is required";
  }

  const dateValidation = validateDates(formData.startDate, formData.endDate);
  if (!dateValidation.valid) {
    errors.dates = dateValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Navigation helpers
export const getPhotoNavigation = (photos, currentPhotoId) => {
  const currentIndex = photos.findIndex((p) => p.id === currentPhotoId);

  return {
    currentIndex,
    total: photos.length,
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex < photos.length - 1,
    previousPhoto:
      currentIndex > 0 ? photos[currentIndex - 1] : photos[photos.length - 1],
    nextPhoto:
      currentIndex < photos.length - 1 ? photos[currentIndex + 1] : photos[0],
  };
};
