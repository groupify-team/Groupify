/**
 * Firebase subscription service - handles user subscription plans
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Get a user's current subscription plan
 * @param {string} userId - The user ID to check
 * @returns {Object} The subscription plan information
 */
export const getUserSubscriptionPlan = async (userId) => {
  try {
    // Get the user's subscription document
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    // Return the subscription info, or default to free plan
    return (
      userData.subscription || {
        type: "free",
        startDate: serverTimestamp(),
        status: "active",
      }
    );
  } catch (error) {
    console.error("Error getting subscription plan:", error);
    return null;
  }
};

/**
 * Update a user's subscription plan
 * @param {string} userId - The user ID to update
 * @param {Object} subscriptionData - The new subscription details
 */
export const updateUserSubscriptionPlan = async (userId, subscriptionData) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      subscription: {
        ...subscriptionData,
        updatedAt: serverTimestamp(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    throw error;
  }
};

/**
 * Check if a user has reached their plan limits
 * @param {string} userId - The user ID to check
 * @param {string} limitType - The type of limit to check ('events', 'members', 'storage', etc.)
 * @returns {Object} Limit information including current usage and maximum
 */
export const checkUserPlanLimits = async (userId, limitType) => {
  const plan = await getUserSubscriptionPlan(userId);

  // Define limits for different plan types
  const limits = {
    free: {
      events: 3,
      members: 10,
      storage: 100, // MB
    },
    premium: {
      events: 10,
      members: 50,
      storage: 500, // MB
    },
    pro: {
      events: 25,
      members: 100,
      storage: 2000, // MB
    },
    enterprise: {
      events: 100,
      members: 500,
      storage: 10000, // MB
    },
  };

  const planType = plan?.type || "free";
  const maxLimit = limits[planType][limitType] || 0;

  // Fetch current usage from user document
  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.data();

  const currentUsage = userData?.usage?.[limitType] || 0;

  return {
    currentUsage,
    maxLimit,
    isLimitReached: currentUsage >= maxLimit,
    percentageUsed:
      maxLimit > 0
        ? Math.min(100, Math.round((currentUsage / maxLimit) * 100))
        : 100,
  };
};
