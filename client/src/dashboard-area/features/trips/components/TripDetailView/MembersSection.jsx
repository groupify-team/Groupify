// components/TripDetailView/MembersSection.jsx
import React from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import TripMembersList from "../TripMembersList"; // 🆕 ADD THIS IMPORT

const MembersSection = ({
  members = [],
  trip,
  currentUser,
  isAdmin,
  onMemberClick,
}) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Trip Members
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                {members.length}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              View member profiles
            </p>
          </div>
        </div>

        {/* 🔄 REPLACE ALL THE MEMBERS LIST CODE WITH THIS: */}
        <TripMembersList
          members={members}
          trip={trip}
          currentUser={currentUser}
          onMemberClick={onMemberClick}
          showHeader={false}
        />
      </div>
    </div>
  );
};

export default MembersSection;
