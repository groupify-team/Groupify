/**
 * Hook for checking and validating event member limits
 * Based on user's subscription plan
 */

import { useState, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { getUserSubscriptionPlan } from "@shared/services/firebase/subscription";

export const useEventMemberLimits = (eventId, currentMemberCount) => {
  const { user } = useAuth();
  const [memberLimit, setMemberLimit] = useState(100); // Default high value
  const [isLoading, setIsLoading] = useState(true);
  const [canAddMoreMembers, setCanAddMoreMembers] = useState(true);
  const [percentageUsed, setPercentageUsed] = useState(0);

  // Load user's subscription plan and check limits
  useEffect(() => {
    const checkMemberLimits = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        // Get user's subscription plan
        const plan = await getUserSubscriptionPlan(user.uid);

        // Determine member limit based on plan
        let limit = 10; // Free plan default

        if (plan) {
          switch (plan.type) {
            case "premium":
              limit = 50;
              break;
            case "pro":
              limit = 100;
              break;
            case "enterprise":
              limit = 500;
              break;
            default:
              limit = 10; // Free plan
          }
        }

        setMemberLimit(limit);
        setCanAddMoreMembers(currentMemberCount < limit);
        setPercentageUsed(Math.round((currentMemberCount / limit) * 100));
      } catch (error) {
        console.error("Error checking member limits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMemberLimits();
  }, [user?.uid, eventId, currentMemberCount]);

  return {
    memberLimit,
    canAddMoreMembers,
    percentageUsed,
    isLoading,
  };
};
