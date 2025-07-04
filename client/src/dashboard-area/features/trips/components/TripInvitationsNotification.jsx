import React, { useState } from "react";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useTripInvitations } from "@/dashboard-area/features/trips/hooks/useTripInvitations";

const TripInvitationsNotification = ({ currentUser }) => {
  const {
    pendingInvites,
    loading,
    processingInvite,
    acceptInvite,
    declineInvite,
  } = useTripInvitations(currentUser?.uid);

  const [isExpanded, setIsExpanded] = useState(true);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-200 dark:border-blue-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">
            Loading invitations...
          </span>
        </div>
      </div>
    );
  }

  if (pendingInvites.length === 0) {
    return null; // Don't show anything if no invites
  }

  return (
    <div className="bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/30 dark:to-purple-900/30 backdrop-blur-lg rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 mb-6 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingInvites.length}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              Trip Invitations
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {pendingInvites.length} pending invitation
              {pendingInvites.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      {/* Invitations List */}
      {isExpanded && (
        <div className="border-t border-blue-200/50 dark:border-blue-800/50">
          <div className="max-h-96 overflow-y-auto">
            {pendingInvites.map((invite, index) => (
              <div
                key={invite.id}
                className={`p-4 ${
                  index !== pendingInvites.length - 1
                    ? "border-b border-blue-200/30 dark:border-blue-800/30"
                    : ""
                } hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors`}
              >
                {/* Trip Info */}
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                    {invite.tripName || "Unknown Trip"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      <span className="truncate">Location TBD</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>Coming soon</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      <span>Multiple members</span>
                    </div>
                  </div>
                </div>

                {/* Inviter Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {invite.inviterName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Invited by {invite.inviterName || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invite.createdAt
                        ? new Date(
                            invite.createdAt.toDate()
                          ).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => acceptInvite(invite)}
                    disabled={processingInvite === invite.id}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none"
                  >
                    {processingInvite === invite.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm">Joining...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span className="text-sm">Accept</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => declineInvite(invite)}
                    disabled={processingInvite === invite.id}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none"
                  >
                    {processingInvite === invite.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm">Processing...</span>
                      </>
                    ) : (
                      <>
                        <XMarkIcon className="w-4 h-4" />
                        <span className="text-sm">Decline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripInvitationsNotification;
