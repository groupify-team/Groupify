import { useState } from "react";
import { toast } from "@shared/utils/toast";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { useEventContext } from "@shared/contexts/EventContext";
import { eventsService } from "../services/eventsService";

export const useEventInvitations = (userId) => {
  const [processingInvite, setProcessingInvite] = useState(null);
  const { canPerformAction, showUpgradePrompt, getUsageInfo } = usePlanLimits();

  const {
    eventInvitations: pendingInvites,
    loading,
    acceptEventInvitation,
    rejectEventInvitation,
  } = useEventContext();

  const acceptInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);
      const currentEventCount = await eventsService.getUserEventCount(userId);
      const limitCheck = canPerformAction("create_event", {
        currentEventCount: currentEventCount + 1,
      });

      if (!limitCheck.allowed) {
        showUpgradePrompt(
          `You've reached your event limit (${limitCheck.limit} events). Upgrade to accept more invitations!`,
          {
            title: "Upgrade to Accept Invitation",
            persistent: true,
          }
        );
        return false;
      }
      await acceptEventInvitation(invite.id, invite.eventId);
      const usageInfo = getUsageInfo();
      if (usageInfo) {
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

  const declineInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);
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
    pendingInvites,
    loading,
    processingInvite,
    acceptInvite,
    declineInvite,
    refreshInvites: () => {},
    canAcceptMoreInvitations,
  };
};
