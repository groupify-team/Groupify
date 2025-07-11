// client/src/dashboard-area/features/events/hooks/useEventInvitations.js
import { useState } from "react";
import { toast } from "@shared/utils/toast";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { useEventContext } from "@shared/contexts/EventContext"; // NEW: Use EventContext
import { eventsService } from "../services/eventsService";

export const useEventInvitations = (userId) => {
  const [processingInvite, setProcessingInvite] = useState(null);
  const { canPerformAction, showUpgradePrompt, getUsageInfo } = usePlanLimits();

  // NEW: Get real-time data from EventContext instead of local state
  const {
    eventInvitations: pendingInvites,
    loading,
    acceptEventInvitation,
    rejectEventInvitation,
  } = useEventContext();

  console.log("🎬 useEventInvitations: Real-time invitations:", pendingInvites);

  // Accept invitation with plan validation (now uses EventContext)
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

      // Use EventContext function instead of direct Firebase call
      await acceptEventInvitation(invite.id, invite.eventId);

      // Update usage statistics
      const usageInfo = getUsageInfo();
      if (usageInfo) {
        // This will be handled by the backend, but we update locally for immediate feedback
        toast.success(
          `Joined ${invite.eventTitle}! (${currentEventCount + 1}/${
            limitCheck.limit === "unlimited" ? "∞" : limitCheck.limit
          } events)`
        );
      } else {
        toast.success(`Joined ${invite.eventTitle}!`);
      }

      return true;
    } catch (error) {
      console.error("❌ useEventInvitations: Error accepting invite:", error);

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

  // Decline invitation (now uses EventContext)
  const declineInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);

      // Use EventContext function instead of direct Firebase call
      await rejectEventInvitation(invite.id);

      toast.success("Invitation declined");
      return true;
    } catch (error) {
      console.error("❌ useEventInvitations: Error declining invite:", error);
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
      console.error(
        "❌ useEventInvitations: Error checking invitation acceptance ability:",
        error
      );
      return false;
    }
  };

  return {
    pendingInvites, // Now comes from EventContext (real-time)
    loading, // Now comes from EventContext
    processingInvite,
    acceptInvite, // Updated to use EventContext
    declineInvite, // Updated to use EventContext
    refreshInvites: () => {
      // No need to refresh - EventContext handles real-time updates
      console.log(
        "ℹ️ useEventInvitations: Refresh not needed - using real-time data from EventContext"
      );
    },
    canAcceptMoreInvitations,
  };
};
