// client/src/dashboard-area/features/events/hooks/useEventInvitations.js
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getPendingInvites,
  acceptEventInvite,
  declineEventInvite,
} from "@shared/services/firebase/events";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { eventsService } from "../services/eventsService";

export const useEventInvitations = (userId) => {
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

      // Get current event count for the user
      const currentEventCount = await eventsService.getUserEventCount(userId);

      // Check if user can join more events
      const limitCheck = canPerformAction("create_event", {
        currentEventCount: currentEventCount + 1, // +1 because they're joining a new event
      });

      if (!limitCheck.allowed) {
        // Show upgrade prompt with specific messaging for invitations
        showUpgradePrompt(
          `You've reached your event limit (${limitCheck.limit} events). Upgrade to accept more invitations!`,
          {
            title: "Upgrade to Accept Invitation",
            persistent: true,
          }
        );
        return false;
      }

      // Proceed with accepting the invitation
      await acceptEventInvite(invite.id, userId);

      // Remove from local state
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invite.id));

      // Update usage statistics
      const usageInfo = getUsageInfo();
      if (usageInfo) {
        // This will be handled by the backend, but we update locally for immediate feedback
        toast.success(
          `Joined ${invite.eventName}! (${currentEventCount + 1}/${
            limitCheck.limit === "unlimited" ? "∞" : limitCheck.limit
          } events)`
        );
      } else {
        toast.success(`Joined ${invite.eventName}!`);
      }

      return true;
    } catch (error) {
      console.error("Error accepting invite:", error);

      // Check if error is related to plan limits
      if (
        error.message?.includes("limit") ||
        error.message?.includes("upgrade")
      ) {
        toast.error(error.message);
        showUpgradePrompt(error.message, {
          title: "Upgrade Required",
          persistent: true,
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
      await declineEventInvite(invite.id);

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
      const currentEventCount = await eventsService.getUserEventCount(userId);
      const limitCheck = canPerformAction("create_event", {
        currentEventCount: currentEventCount + 1,
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
