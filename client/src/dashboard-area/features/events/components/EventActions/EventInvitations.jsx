import React, { useState, useEffect } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { useEventContext } from "@shared/contexts/EventContext";
import { eventsService } from "@dashboard/features/events/services/eventsService";
import toast from "react-hot-toast";

const EventInvitations = ({ userId }) => {
  const [canAcceptMore, setCanAcceptMore] = useState(true);
  const [currentEventCount, setCurrentEventCount] = useState(0);
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const { getUsageInfo, showUpgradePrompt } = usePlanLimits();
  const {
    eventInvitations,
    acceptEventInvitation,
    rejectEventInvitation,
    loading,
  } = useEventContext();

  useEffect(() => {
    const checkEventStatus = async () => {
      if (userId) {
        try {
          const eventCount = await eventsService.getUserEventCount(userId);
          setCurrentEventCount(eventCount);
          const usageInfo = getUsageInfo();

          if (usageInfo?.events) {
            const { limit } = usageInfo.events;
            const canAccept = limit === "unlimited" || eventCount < limit;
            setCanAcceptMore(canAccept);
          }
        } catch (error) {
          console.error("Error checking event status:", error);
        }
      }
    };
    checkEventStatus();
  }, [userId, getUsageInfo]);

  const handleAcceptInvitation = async (invitation) => {
    if (!canAcceptMore) {
      const usageInfo = getUsageInfo();
      showUpgradePrompt(
        `You've reached your event limit (${
          usageInfo?.events?.limit || 5
        } events). Upgrade your plan to accept more invitations!`,
        {
          title: "Upgrade to Accept Invitation",
          persistent: true,
        }
      );
      return;
    }

    try {
      setProcessingInvitation(invitation.id);
      await acceptEventInvitation(invitation.id, invitation.eventId);
      const newEventCount = currentEventCount + 1;
      setCurrentEventCount(newEventCount);
      const usageInfo = getUsageInfo();
      if (usageInfo?.events) {
        const { limit } = usageInfo.events;
        setCanAcceptMore(limit === "unlimited" || newEventCount < limit);
      }

      toast.success(`Joined "${invitation.eventTitle}"! 🎉`);
      return true;
    } catch (error) {
      console.error("❌ EventInvitations: Error accepting invitation:", error);
      toast.error("Failed to accept invitation. Please try again.");
      return false;
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    try {
      setProcessingInvitation(invitation.id);
      await rejectEventInvitation(invitation.id);
      toast.success("Invitation declined");
      return true;
    } catch (error) {
      console.error("❌ EventInvitations: Error declining invitation:", error);
      toast.error("Failed to decline invitation. Please try again.");
      return false;
    } finally {
      setProcessingInvitation(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (eventInvitations.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <BellIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Event Invitations ({eventInvitations.length})
        </h3>
      </div>

      {/* Plan limit warning */}
      {!canAcceptMore && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Event limit reached</p>
              <p className="text-amber-700">
                You've reached your plan's event limit ({currentEventCount}/5
                events). Upgrade to accept more invitations.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {eventInvitations.map((invitation) => {
          const buttonDisabled =
            !canAcceptMore || processingInvitation === invitation.id;
          return (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
            >
              <div className="flex-1 flex items-center gap-3">
                {/* Sender Avatar */}
                <img
                  src={
                    invitation.senderPhotoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt={invitation.senderName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white">
                    {invitation.eventTitle}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    From {invitation.senderName}
                  </p>
                  {invitation.eventDescription && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                      {invitation.eventDescription}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvitation(invitation)}
                  disabled={buttonDisabled}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    !buttonDisabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  title={
                    !canAcceptMore
                      ? `Event limit reached (${currentEventCount}/5) - upgrade to accept`
                      : "Accept invitation"
                  }
                >
                  {processingInvitation === invitation.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineInvitation(invitation)}
                  disabled={processingInvitation === invitation.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  {processingInvitation === invitation.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircleIcon className="w-4 h-4" />
                  )}
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventInvitations;
