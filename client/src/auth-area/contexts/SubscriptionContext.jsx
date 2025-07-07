import React, { useState, useEffect, useMemo, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../shared/services/firebase/config";
import { useAuth } from "../hooks/useAuth";
import subscriptionService from "../../shared/services/subscriptionService";
import { SubscriptionContext } from "./SubscriptionContext";

export function SubscriptionProvider({ children }) {
  const { currentUser } = useAuth();
  const [userPlan, setUserPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Initialize user plan when user changes
  const initializeUserPlan = useCallback(async (user) => {
    if (!user) {
      setUserPlan(null);
      return;
    }

    try {
      setPlanLoading(true);

      // Get user profile from Firestore to check for plan info
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let firestorePlan = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        firestorePlan = userData.subscription || userData.plan;
      }

      // Get current subscription from subscription service
      let currentSubscription = subscriptionService.getCurrentSubscription();

      // If user has plan data in Firestore, sync it with subscription service
      if (firestorePlan && firestorePlan !== currentSubscription.plan) {
        console.log("Syncing plan data from Firestore:", firestorePlan);

        const planUpdate = {
          plan: firestorePlan.plan || firestorePlan,
          billing: firestorePlan.billing || "monthly",
          status: firestorePlan.status || "active",
          purchaseDate: firestorePlan.purchaseDate || new Date().toISOString(),
          metadata: {
            ...firestorePlan.metadata,
            syncedFromFirestore: true,
            syncedAt: new Date().toISOString(),
          },
        };

        currentSubscription =
          subscriptionService.updateSubscription(planUpdate);
      }

      // Initialize usage tracking for new users
      if (
        currentSubscription.plan === "free" &&
        !subscriptionService.getStoredUsage().initialized
      ) {
        subscriptionService.updateUsage({
          initialized: true,
          trips: 0,
          photos: 0,
          storage: 0,
          albums: 0,
        });
      }

      setUserPlan(currentSubscription);

      console.log("User plan initialized:", {
        plan: currentSubscription.plan,
        status: currentSubscription.status,
        features: currentSubscription.features,
      });
    } catch (error) {
      console.error("Error initializing user plan:", error);
      // Fallback to default free plan
      const defaultPlan = subscriptionService.getDefaultSubscription();
      setUserPlan(defaultPlan);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const updateUserPlan = useCallback(
    async (planData) => {
      try {
        if (!currentUser) {
          throw new Error("No authenticated user");
        }

        // Update Firestore
        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            subscription: planData,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Update subscription service
        const updatedSubscription =
          subscriptionService.updateSubscription(planData);
        setUserPlan(updatedSubscription);

        return updatedSubscription;
      } catch (error) {
        console.error("Error updating user plan:", error);
        throw error;
      }
    },
    [currentUser]
  );

  // Initialize plan when user changes
  useEffect(() => {
    initializeUserPlan(currentUser);
  }, [currentUser, initializeUserPlan]);

  // Subscribe to subscription service updates
  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (event === "subscriptionUpdated" && currentUser) {
        console.log("Subscription updated via service:", data);
        setUserPlan(data);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      userPlan,
      planLoading,
      updateUserPlan,
      initializeUserPlan,

      // Plan-related helpers
      isFreePlan: userPlan?.plan === "free",
      isPremiumPlan: userPlan?.plan === "premium",
      isProPlan: userPlan?.plan === "pro",
      planFeatures: userPlan?.features,
      planUsage: userPlan?.usage,

      // Subscription state helpers
      hasActiveSubscription: userPlan?.status === "active",
      subscriptionStatus: userPlan?.status,
      billingCycle: userPlan?.billing,
    }),
    [userPlan, planLoading, updateUserPlan, initializeUserPlan]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
