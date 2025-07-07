import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getPendingInvites,
  acceptTripInvite,
  declineTripInvite,
} from "@shared/services/firebase/trips";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { tripsService } from "../services/tripsService";

export const useTripInvitations = (userId) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState(null);
  const { canPerformAction, showUpgradePrompt, getUsageInfo } = usePlanLimits();

  // Load pending invitations
  const loadPendingInvites = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const invites = await getPendingInvites(userId);
      setPendingInvites(invites);
    } catch (error) {
      console.error("Error loading pending invites:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation with plan validation
  const acceptInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);

      // Get current trip count for the user
      const currentTripCount = await tripsService.getUserTripCount(userId);
      
      // Check if user can join more trips
      const limitCheck = canPerformAction("create_trip", { 
        currentTripCount: currentTripCount + 1 // +1 because they're joining a new trip
      });

      if (!limitCheck.allowed) {
        // Show upgrade prompt with specific messaging for invitations
        showUpgradePrompt(
          `You've reached your trip limit (${limitCheck.limit} trips). Upgrade to accept more invitations!`,
          {
            title: "Upgrade to Accept Invitation",
            persistent: true
          }
        );
        return false;
      }

      // Proceed with accepting the invitation
      await acceptTripInvite(invite.id, userId);

      // Remove from local state
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
      
      // Update usage statistics
      const usageInfo = getUsageInfo();
      if (usageInfo) {
        // This will be handled by the backend, but we update locally for immediate feedback
        toast.success(`Joined ${invite.tripName}! (${currentTripCount + 1}/${limitCheck.limit === "unlimited" ? "∞" : limitCheck.limit} trips)`);
      } else {
        toast.success(`Joined ${invite.tripName}!`);
      }

      return true;
    } catch (error) {
      console.error("Error accepting invite:", error);
      
      // Check if error is related to plan limits
      if (error.message?.includes("limit") || error.message?.includes("upgrade")) {
        toast.error(error.message);
        showUpgradePrompt(error.message, {
          title: "Upgrade Required",
          persistent: true
        });
      } else {
        toast.error("Failed to accept invitation");
      }
      return false;
    } finally {
      setProcessingInvite(null);
    }
  };

  // Decline invitation (unchanged)
  const declineInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);
      await declineTripInvite(invite.id);

      // Remove from local state
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
      toast.success("Invitation declined");
      return true;
    } catch (error) {
      console.error("Error declining invite:", error);
      toast.error("Failed to decline invitation");
      return false;
    } finally {
      setProcessingInvite(null);
    }
  };

  // Check if user can accept more invitations
  const canAcceptMoreInvitations = async () => {
    try {
      const currentTripCount = await tripsService.getUserTripCount(userId);
      const limitCheck = canPerformAction("create_trip", { 
        currentTripCount: currentTripCount + 1 
      });
      return limitCheck.allowed;
    } catch (error) {
      console.error("Error checking invitation acceptance ability:", error);
      return false;
    }
  };

  // Load invites when userId changes
  useEffect(() => {
    if (userId) {
      loadPendingInvites();
    }
  }, [userId]);

  return {
    pendingInvites,
    loading,
    processingInvite,
    acceptInvite,
    declineInvite,
    refreshInvites: loadPendingInvites,
    canAcceptMoreInvitations, // New helper function
  };
};