import { useState, useCallback, useMemo } from "react";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { toast } from "react-hot-toast";
import { tripsService } from "../../../../services/tripsService";
/**
 * Enhanced hook for trip member invitation validation with comprehensive plan limits
 * Handles member limits per trip and upgrade prompts
 */
export const useTripMemberLimits = (tripId, currentMemberCount = 0, tripData = null) => {
  const {
    canPerformAction,
    enforceLimit,
    showUpgradePrompt,
    subscription,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
    CORE_LIMITS,
  } = usePlanLimits();

  const [isInviting, setIsInviting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Get current plan limits
  const planLimits = useMemo(() => {
    if (!subscription) return CORE_LIMITS.free;
    return CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;
  }, [subscription, CORE_LIMITS]);

  // Validate member invitation
  const validateMemberInvitation = useCallback(async (inviteeCount = 1, options = {}) => {
    const { showToasts = true, skipLimitCheck = false } = options;
    
    setIsValidating(true);

    try {
      // Skip validation if requested (for admin overrides)
      if (skipLimitCheck) {
        return { allowed: true, reason: null };
      }

      // Check member limit
      const memberCheck = canPerformAction("invite_member", {
        currentMembers: currentMemberCount,
        newMemberCount: inviteeCount,
      });

      if (!memberCheck.allowed) {
        if (showToasts) {
          showUpgradePrompt(memberCheck.reason, { persistent: true });
        }
        return {
          allowed: false,
          reason: memberCheck.reason,
          type: "member_limit",
          currentUsage: currentMemberCount,
          limit: planLimits.membersPerTrip,
          additionalNeeded: inviteeCount,
        };
      }

      return { allowed: true, reason: null };

    } catch (error) {
      console.error("Member invitation validation error:", error);
      if (showToasts) {
        toast.error("Failed to validate invitation. Please try again.");
      }
      return {
        allowed: false,
        reason: "Validation failed",
        type: "validation_error",
      };
    } finally {
      setIsValidating(false);
    }
  }, [canPerformAction, currentMemberCount, planLimits, showUpgradePrompt]);

  // Check if can invite more members
  const canInviteMembers = useCallback((count = 1) => {
    if (planLimits.membersPerTrip === "unlimited") return true;
    return currentMemberCount + count <= planLimits.membersPerTrip;
  }, [currentMemberCount, planLimits.membersPerTrip]);

  // Get remaining member slots
  const getRemainingMemberSlots = useCallback(() => {
    if (planLimits.membersPerTrip === "unlimited") return "unlimited";
    return Math.max(0, planLimits.membersPerTrip - currentMemberCount);
  }, [currentMemberCount, planLimits.membersPerTrip]);

  // Get member limit status
  const getMemberLimitStatus = useCallback(() => {
    if (planLimits.membersPerTrip === "unlimited") return "unlimited";
    
    const remaining = getRemainingMemberSlots();
    const percentage = (currentMemberCount / planLimits.membersPerTrip) * 100;
    
    if (remaining === 0) return "full";
    if (percentage >= 80) return "warning";
    return "normal";
  }, [currentMemberCount, planLimits.membersPerTrip, getRemainingMemberSlots]);

  // Invite a single member with validation
  const inviteMember = useCallback(async (userId, userEmail, options = {}) => {
    const { skipValidation = false, showToasts = true } = options;
    
    if (!userId && !userEmail) {
      if (showToasts) toast.error("User ID or email is required");
      return { success: false, reason: "Missing user identifier" };
    }

    setIsInviting(true);

    try {
      // Validate invitation if not skipped
      if (!skipValidation) {
        const validation = await validateMemberInvitation(1, { showToasts });
        if (!validation.allowed) {
          return { success: false, reason: validation.reason, type: validation.type };
        }
      }

      // Send invitation through trips service
      const result = await tripsService.sendTripInvite(tripId, userId, userEmail);
      
      if (showToasts) {
        toast.success(`Invitation sent successfully!`);
      }

      return { success: true, invitationId: result.invitationId };

    } catch (error) {
      console.error("Member invitation error:", error);
      const errorMessage = error.message || "Failed to send invitation";
      
      if (showToasts) {
        if (errorMessage.includes("limit")) {
          // This is a plan limit error from the service
          showUpgradePrompt(errorMessage, { persistent: true });
        } else {
          toast.error(errorMessage);
        }
      }

      return { 
        success: false, 
        reason: errorMessage,
        type: errorMessage.includes("limit") ? "member_limit" : "invitation_error"
      };
    } finally {
      setIsInviting(false);
    }
  }, [tripId, validateMemberInvitation, showUpgradePrompt]);

  // Batch invite multiple members
  const inviteMultipleMembers = useCallback(async (userList, options = {}) => {
    const { showToasts = true, continueOnError = false } = options;
    
    if (!userList || userList.length === 0) {
      if (showToasts) toast.error("No users to invite");
      return { success: false, results: [] };
    }

    // Validate batch invitation
    const validation = await validateMemberInvitation(userList.length, { showToasts });
    if (!validation.allowed) {
      return { 
        success: false, 
        reason: validation.reason, 
        type: validation.type,
        results: []
      };
    }

    setIsInviting(true);
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of userList) {
        try {
          const result = await inviteMember(user.uid, user.email, { 
            skipValidation: true, 
            showToasts: false 
          });
          
          results.push({
            user,
            success: result.success,
            reason: result.reason,
            invitationId: result.invitationId,
          });

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            if (!continueOnError) break;
          }

        } catch (error) {
          results.push({
            user,
            success: false,
            reason: error.message || "Unknown error",
          });
          errorCount++;
          if (!continueOnError) break;
        }
      }

      // Show summary toast
      if (showToasts) {
        if (successCount > 0 && errorCount === 0) {
          toast.success(`${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully!`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.success(`${successCount} invitations sent, ${errorCount} failed`);
        } else {
          toast.error(`Failed to send ${errorCount} invitation${errorCount > 1 ? 's' : ''}`);
        }
      }

      return {
        success: successCount > 0,
        successCount,
        errorCount,
        results,
      };

    } catch (error) {
      console.error("Batch invitation error:", error);
      if (showToasts) {
        toast.error("Failed to send invitations");
      }
      return { success: false, results };
    } finally {
      setIsInviting(false);
    }
  }, [validateMemberInvitation, inviteMember]);

  // Get upgrade suggestions for member limits
  const getMemberUpgradeSuggestions = useCallback(() => {
    const currentPlan = subscription?.plan || "free";
    
    const suggestions = [];

    if (currentPlan === "free") {
      suggestions.push({
        targetPlan: "premium",
        benefit: `Increase from ${CORE_LIMITS.free.membersPerTrip} to ${CORE_LIMITS.premium.membersPerTrip} members per trip`,
        price: "$9.99/month",
        highlight: "4x more members",
      });
    }

    if (currentPlan === "free" || currentPlan === "premium") {
      suggestions.push({
        targetPlan: "pro",
        benefit: "Unlimited members per trip",
        price: "$19.99/month",
        highlight: "Build large groups",
      });
    }

    return suggestions;
  }, [subscription, CORE_LIMITS]);

  // Check if approaching member limit
  const isApproachingMemberLimit = useCallback(() => {
    if (planLimits.membersPerTrip === "unlimited") return false;
    const percentage = (currentMemberCount / planLimits.membersPerTrip) * 100;
    return percentage >= 80;
  }, [currentMemberCount, planLimits.membersPerTrip]);

  // Get formatted limits for display
  const getFormattedLimits = useCallback(() => {
    return {
      members: {
        current: currentMemberCount,
        limit: planLimits.membersPerTrip,
        remaining: getRemainingMemberSlots(),
        percentage: planLimits.membersPerTrip === "unlimited" ? 0 : 
          Math.round((currentMemberCount / planLimits.membersPerTrip) * 100),
        formatted: planLimits.membersPerTrip === "unlimited" ? 
          `${currentMemberCount} members` : 
          `${currentMemberCount} / ${planLimits.membersPerTrip} members`,
      },
    };
  }, [currentMemberCount, planLimits, getRemainingMemberSlots]);

  // Get member invitation preview
  const getInvitationPreview = useCallback((inviteeCount = 1) => {
    const remaining = getRemainingMemberSlots();
    const wouldExceed = typeof remaining === "number" && inviteeCount > remaining;
    
    return {
      canInvite: !wouldExceed,
      remaining,
      wouldExceed,
      newTotal: currentMemberCount + inviteeCount,
      limit: planLimits.membersPerTrip,
      requiresUpgrade: wouldExceed,
    };
  }, [currentMemberCount, planLimits.membersPerTrip, getRemainingMemberSlots]);

  // Force member limit check (for UI components)
  const checkMemberLimit = useCallback((additionalMembers = 1) => {
    return enforceLimit("invite_member", {
      currentMembers: currentMemberCount,
      newMemberCount: additionalMembers,
    });
  }, [enforceLimit, currentMemberCount]);

  return {
    // Validation functions
    validateMemberInvitation,
    canInviteMembers,
    checkMemberLimit,
    
    // Invitation functions
    inviteMember,
    inviteMultipleMembers,
    
    // Status functions  
    getRemainingMemberSlots,
    getMemberLimitStatus,
    isApproachingMemberLimit,
    getFormattedLimits,
    getInvitationPreview,
    
    // Upgrade helpers
    getMemberUpgradeSuggestions,
    
    // State
    isInviting,
    isValidating,
    planLimits,
    
    // Plan info
    isFreePlan,
    isPremiumPlan, 
    isProPlan,
    
    // Current member count for easy access
    currentMemberCount,
    
    // Quick status checks
    canInviteMore: canInviteMembers(1),
    limitStatus: getMemberLimitStatus(),
    remainingSlots: getRemainingMemberSlots(),
  };
};