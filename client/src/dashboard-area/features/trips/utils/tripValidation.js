/**
 * Trip and photo upload validation utilities
 * Handles form validation, file type checking, and data sanitization
 */

import { TRIP_CONSTANTS } from "./tripConstants";

export const validateTripForm = (formData) => {
  const errors = {};

  // Name validation
  if (!formData.name?.trim()) {
    errors.name = "Trip name is required";
  } else if (formData.name.length > TRIP_CONSTANTS.MAX_TRIP_NAME_LENGTH) {
    errors.name = `Trip name must be less than ${TRIP_CONSTANTS.MAX_TRIP_NAME_LENGTH} characters`;
  }

  // Description validation
  if (
    formData.description &&
    formData.description.length > TRIP_CONSTANTS.MAX_DESCRIPTION_LENGTH
  ) {
    errors.description = `Description must be less than ${TRIP_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`;
  }

  // Location validation
  if (
    formData.location &&
    formData.location.length > TRIP_CONSTANTS.MAX_LOCATION_LENGTH
  ) {
    errors.location = `Location must be less than ${TRIP_CONSTANTS.MAX_LOCATION_LENGTH} characters`;
  }

  // Date validation
  if (formData.startDate && formData.endDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate > endDate) {
      errors.dates = "End date must be after start date";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePhotoUpload = (files, currentPhotoCount) => {
  const errors = [];

  if (!files || files.length === 0) {
    return { isValid: false, errors: ["No files selected"] };
  }

  // Check total count after upload
  if (currentPhotoCount + files.length > TRIP_CONSTANTS.MAX_PHOTOS_PER_TRIP) {
    errors.push(
      `Cannot upload ${files.length} photos. Would exceed limit of ${TRIP_CONSTANTS.MAX_PHOTOS_PER_TRIP} photos per trip.`
    );
  }

  // Check individual file types and sizes
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  files.forEach((file, index) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File ${
          index + 1
        }: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`
      );
    }

    if (file.size > maxSize) {
      errors.push(`File ${index + 1}: File too large. Maximum size is 10MB.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
