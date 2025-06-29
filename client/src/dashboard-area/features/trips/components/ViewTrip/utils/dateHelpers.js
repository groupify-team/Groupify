/**
 * Format date for display in different contexts
 */
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return null;

  const date = new Date(dateString);

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "relative":
      return getRelativeTimeString(date);
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Get "X days ago" format
 */
export const getDaysAgo = (dateString) => {
  const daysDiff = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff < 7) return `${daysDiff} days ago`;
  if (daysDiff < 30) {
    const weeks = Math.floor(daysDiff / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (daysDiff < 365) {
    const months = Math.floor(daysDiff / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  const years = Math.floor(daysDiff / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

/**
 * Get relative time string (more detailed)
 */
export const getRelativeTimeString = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  return getDaysAgo(date.toISOString());
};

/**
 * Format trip date range
 */
export const formatTripDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return "";

  if (startDate && !endDate) {
    return `Starting ${formatDate(startDate, "short")}`;
  }

  if (!startDate && endDate) {
    return `Ending ${formatDate(endDate, "short")}`;
  }

  const start = formatDate(startDate, "short");
  const end = formatDate(endDate, "short");

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if date is today
 */
export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if date is this week
 */
export const isThisWeek = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(
    today.setDate(today.getDate() - today.getDay() + 6)
  );

  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Get trip duration in days
 */
export const getTripDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Format duration in human readable format
 */
export const formatDuration = (days) => {
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} week${weeks > 1 ? "s" : ""}`;
    }
    return `${weeks} week${weeks > 1 ? "s" : ""} ${remainingDays} day${
      remainingDays > 1 ? "s" : ""
    }`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""}`;
};

/**
 * Get photo upload time formatting
 */
export const formatPhotoUploadTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) return "Just uploaded";
  if (diffHours < 24) return `${diffHours}h ago`;

  return formatDate(dateString, "short") || "";
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true; // Allow empty dates
  return new Date(startDate) <= new Date(endDate);
};
