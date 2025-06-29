// components/TripDetailView/TripSidebar.jsx
import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import MembersSection from "./MembersSection";
import InviteFriendDropdown from "./InviteFriendDropdown";

const TripSidebar = ({
  tripMembers,
  trip,
  currentUser,
  isAdmin,
  friends,
  mobileActiveTab,
  onMemberClick,
  onInviteFriend,
}) => {
  return (
    <div
      className={`xl:col-span-1 space-y-6 ${
        mobileActiveTab === "members" ? "block" : "hidden xl:block"
      }`}
    >
      {/* Members Section */}
      <MembersSection
        members={tripMembers}
        trip={trip}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onMemberClick={onMemberClick}
      />

      {/* Invite People Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <PlusIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Invite People
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Add friends to the trip
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-200/30 dark:border-emerald-800/30">
            <InviteFriendDropdown
              currentUser={currentUser}
              onSelect={onInviteFriend}
              excludedUserIds={trip.members}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSidebar;
