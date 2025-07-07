import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

// Convenience hook that combines auth and subscription data
export function useAuthAndSubscription() {
  const auth = useAuth();
  const subscription = useSubscription();

  return {
    // Auth data
    ...auth,

    // Subscription data
    userPlan: subscription.userPlan,
    planLoading: subscription.planLoading,
    updateUserPlan: subscription.updateUserPlan,

    // Combined helpers
    isFreePlan: subscription.isFreePlan,
    isPremiumPlan: subscription.isPremiumPlan,
    isProPlan: subscription.isProPlan,
    planFeatures: subscription.planFeatures,
    planUsage: subscription.planUsage,
    hasActiveSubscription: subscription.hasActiveSubscription,
  };
}

export default useAuthAndSubscription;
