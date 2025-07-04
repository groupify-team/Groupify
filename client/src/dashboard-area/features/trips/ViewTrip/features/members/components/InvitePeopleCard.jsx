import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import InviteFriendDropdown from "./InviteFriendDropdown";

const InvitePeopleCard = ({
  currentUser,
  tripId,
  tripMembers = [],
  onFriendClick = null, // ADD THIS LINE
}) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-center sm:justify-start">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
              Invite People
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Add friends to the trip
            </p>
          </div>
        </div>

        {/* Friend Invitation Component */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-200/30 dark:border-emerald-800/30">
          <InviteFriendDropdown
            currentUser={currentUser}
            tripId={tripId}
            excludedUserIds={tripMembers}
            onFriendClick={onFriendClick}
          />
        </div>
      </div>
    </div>
  );
};

export default InvitePeopleCard;
