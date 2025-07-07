import React, { useState, useEffect } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usePlanLimits } from '@shared/hooks/usePlanLimits';
import { tripsService } from '@dashboard/features/trips/services/tripsService';

const TripInvitations = ({ invitations, onAction, userId }) => {
  const [canAcceptMore, setCanAcceptMore] = useState(true);
  const [currentTripCount, setCurrentTripCount] = useState(0);
  const { getUsageInfo, showUpgradePrompt } = usePlanLimits();

  // Check user's current trip status
  useEffect(() => {
    const checkTripStatus = async () => {
      if (userId) {
        try {
          const tripCount = await tripsService.getUserTripCount(userId);
          setCurrentTripCount(tripCount);
          
          const usageInfo = getUsageInfo();
          if (usageInfo?.trips) {
            const { limit } = usageInfo.trips;
            setCanAcceptMore(limit === "unlimited" || tripCount < limit);
          }
        } catch (error) {
          console.error("Error checking trip status:", error);
        }
      }
    };

    checkTripStatus();
  }, [userId, getUsageInfo]);

  const handleAction = async (action, invitation) => {
    if (action === 'accept' && !canAcceptMore) {
      const usageInfo = getUsageInfo();
      showUpgradePrompt(
        `You've reached your trip limit (${usageInfo?.trips?.limit || 5} trips). Upgrade your plan to accept more invitations!`,
        {
          title: "Upgrade to Accept Invitation",
          persistent: true
        }
      );
      return;
    }

    // Call the parent's onAction handler
    const success = await onAction(action, invitation);
    
    // Update local state if invitation was accepted successfully
    if (success && action === 'accept') {
      setCurrentTripCount(prev => prev + 1);
      
      // Recheck if user can accept more invitations
      const usageInfo = getUsageInfo();
      if (usageInfo?.trips) {
        const { limit } = usageInfo.trips;
        setCanAcceptMore(limit === "unlimited" || (currentTripCount + 1) < limit);
      }
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <BellIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Trip Invitations ({invitations.length})
        </h3>
      </div>

      {/* Plan limit warning */}
      {!canAcceptMore && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Trip Limit Reached</p>
              <p className="text-amber-700">
                You've reached your plan's trip limit. Upgrade to accept more invitations.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{invitation.tripName}</p>
              <p className="text-sm text-gray-600">From {invitation.inviterName}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept', invitation)}
                disabled={!canAcceptMore}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  canAcceptMore
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!canAcceptMore ? "Trip limit reached - upgrade to accept" : "Accept invitation"}
              >
                <CheckCircleIcon className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleAction('decline', invitation)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <XCircleIcon className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripInvitations;