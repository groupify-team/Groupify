import { useState, useCallback, useMemo } from "react";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { toast } from "react-hot-toast";
import { eventsService } from "../../../services/eventsService";

/** S
 * Enhanced hook for photo upload validation with comprehensive plan limits
 * Handles per-event photo limits, storage limits, and upgrade prompts
 */
export const usePhotoUploadLimits = (eventId, currentPhotoCount = 0) => {
  const {
    canPerformAction,
    enforceLimit,
    getUsageInfo,
    showUpgradePrompt,
    subscription,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
    CORE_LIMITS,
  } = usePlanLimits();

  const [uploadProgress, setUploadProgress] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Get current plan limits
  const planLimits = useMemo(() => {
    if (!subscription) return CORE_LIMITS.free;
    return CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;
  }, [subscription, CORE_LIMITS]);

  // Calculate photo upload validation
  const validatePhotoUpload = useCallback(
    async (files, options = {}) => {
      const { skipStorageCheck = false, showToasts = true } = options;

      if (!files || files.length === 0) {
        return { allowed: false, reason: "No files selected", files: [] };
      }

      setIsValidating(true);

      try {
        // Calculate total file size
        const totalFileSize = Array.from(files).reduce(
          (sum, file) => sum + file.size,
          0
        );
        const newPhotoCount = files.length;

        // Check per-event photo limit
        const eventPhotoCheck = canPerformAction("upload_photos", {
          currentEventPhotos: currentPhotoCount,
          newPhotoCount: newPhotoCount,
        });

        if (!eventPhotoCheck.allowed) {
          if (showToasts) {
            showUpgradePrompt(eventPhotoCheck.reason, { persistent: true });
          }
          return {
            allowed: false,
            reason: eventPhotoCheck.reason,
            type: "event_photo_limit",
            currentUsage: currentPhotoCount,
            limit: planLimits.photosPerEvent,
            files: [],
          };
        }

        // Check storage limit (if not skipped)
        if (!skipStorageCheck) {
          const storageCheck = canPerformAction("upload_storage", {
            fileSize: totalFileSize,
          });

          if (!storageCheck.allowed) {
            if (showToasts) {
              showUpgradePrompt(storageCheck.reason, { persistent: true });
            }
            return {
              allowed: false,
              reason: storageCheck.reason,
              type: "storage_limit",
              currentUsage: storageCheck.currentUsage,
              limit: storageCheck.limit,
              additionalNeeded: totalFileSize,
              files: [],
            };
          }
        }

        // Validate individual files
        const validatedFiles = [];
        const rejectedFiles = [];

        for (const file of files) {
          const validation = validateSingleFile(file);
          if (validation.valid) {
            validatedFiles.push({
              file,
              id: `${Date.now()}-${Math.random()}`,
              size: file.size,
              name: file.name,
              type: file.type,
            });
          } else {
            rejectedFiles.push({
              file,
              reason: validation.reason,
            });
          }
        }

        // Show rejected files warning
        if (rejectedFiles.length > 0 && showToasts) {
          const reasons = [...new Set(rejectedFiles.map((f) => f.reason))];
          toast.error(
            `${rejectedFiles.length} files rejected: ${reasons.join(", ")}`
          );
        }

        return {
          allowed: validatedFiles.length > 0,
          reason: validatedFiles.length > 0 ? null : "No valid files to upload",
          files: validatedFiles,
          rejectedFiles,
          totalSize: validatedFiles.reduce((sum, f) => sum + f.size, 0),
          validCount: validatedFiles.length,
        };
      } catch (error) {
        console.error("Photo upload validation error:", error);
        if (showToasts) {
          toast.error("Failed to validate upload. Please try again.");
        }
        return {
          allowed: false,
          reason: "Validation failed",
          type: "validation_error",
          files: [],
        };
      } finally {
        setIsValidating(false);
      }
    },
    [canPerformAction, currentPhotoCount, planLimits, showUpgradePrompt]
  );

  // Validate single file
  const validateSingleFile = useCallback((file) => {
    // File type validation
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        reason: "Unsupported file type. Please use JPEG, PNG, GIF, or WebP.",
      };
    }

    // File size validation (50MB max per file)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return {
        valid: false,
        reason: "File too large. Maximum size is 50MB per photo.",
      };
    }

    // File name validation
    if (file.name.length > 255) {
      return {
        valid: false,
        reason: "File name too long. Maximum 255 characters.",
      };
    }

    return { valid: true };
  }, []);

  // Check if can upload more photos
  const canUploadPhotos = useCallback(
    (count = 1) => {
      if (planLimits.photosPerEvent === "unlimited") return true;
      return currentPhotoCount + count <= planLimits.photosPerEvent;
    },
    [currentPhotoCount, planLimits.photosPerEvent]
  );

  // Get remaining photo slots
  const getRemainingPhotoSlots = useCallback(() => {
    if (planLimits.photosPerEvent === "unlimited") return "unlimited";
    return Math.max(0, planLimits.photosPerEvent - currentPhotoCount);
  }, [currentPhotoCount, planLimits.photosPerEvent]);

  // Get photo limit status
  const getPhotoLimitStatus = useCallback(() => {
    if (planLimits.photosPerEvent === "unlimited") return "unlimited";

    const remaining = getRemainingPhotoSlots();
    const percentage = (currentPhotoCount / planLimits.photosPerEvent) * 100;

    if (remaining === 0) return "full";
    if (percentage >= 80) return "warning";
    return "normal";
  }, [currentPhotoCount, planLimits.photosPerEvent, getRemainingPhotoSlots]);

  // Track upload progress for a file
  const trackUploadProgress = useCallback((fileId, progress) => {
    setUploadProgress((prev) => ({
      ...prev,
      [fileId]: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  // Remove upload progress tracking
  const removeUploadProgress = useCallback((fileId) => {
    setUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  }, []);

  // Get upgrade suggestions for photo limits
  const getPhotoUpgradeSuggestions = useCallback(() => {
    const currentPlan = subscription?.plan || "free";

    const suggestions = [];

    if (currentPlan === "free") {
      suggestions.push({
        targetPlan: "premium",
        benefit: `Increase from ${CORE_LIMITS.free.photosPerEvent} to ${CORE_LIMITS.premium.photosPerEvent} photos per event`,
        price: "$9.99/month",
        highlight: "6x more photos",
      });
    }

    if (currentPlan === "free" || currentPlan === "premium") {
      suggestions.push({
        targetPlan: "pro",
        benefit: "Unlimited photos per event",
        price: "$19.99/month",
        highlight: "Never worry about limits",
      });
    }

    return suggestions;
  }, [subscription, CORE_LIMITS]);

  // Check if approaching photo limit
  const isApproachingPhotoLimit = useCallback(() => {
    if (planLimits.photosPerEvent === "unlimited") return false;
    const percentage = (currentPhotoCount / planLimits.photosPerEvent) * 100;
    return percentage >= 80;
  }, [currentPhotoCount, planLimits.photosPerEvent]);

  // Get formatted limits for display
  const getFormattedLimits = useCallback(() => {
    const usageInfo = getUsageInfo();
    if (!usageInfo) return null;

    return {
      photos: {
        current: currentPhotoCount,
        limit: planLimits.photosPerEvent,
        remaining: getRemainingPhotoSlots(),
        percentage:
          planLimits.photosPerEvent === "unlimited"
            ? 0
            : Math.round((currentPhotoCount / planLimits.photosPerEvent) * 100),
        formatted:
          planLimits.photosPerEvent === "unlimited"
            ? `${currentPhotoCount} photos`
            : `${currentPhotoCount} / ${planLimits.photosPerEvent} photos`,
      },
      storage: usageInfo.storage,
    };
  }, [currentPhotoCount, planLimits, getRemainingPhotoSlots, getUsageInfo]);

  return {
    // Validation functions
    validatePhotoUpload,
    validateSingleFile,
    canUploadPhotos,

    // Status functions
    getRemainingPhotoSlots,
    getPhotoLimitStatus,
    isApproachingPhotoLimit,
    getFormattedLimits,

    // Progress tracking
    uploadProgress,
    trackUploadProgress,
    removeUploadProgress,

    // Upgrade helpers
    getPhotoUpgradeSuggestions,

    // State
    isValidating,
    planLimits,

    // Plan info
    isFreePlan,
    isPremiumPlan,
    isProPlan,

    // Current photo count for easy access
    currentPhotoCount,

    // Quick status checks
    canUploadMore: canUploadPhotos(1),
    limitStatus: getPhotoLimitStatus(),
    remainingSlots: getRemainingPhotoSlots(),
  };
};
