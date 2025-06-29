// components/TripMembersList.jsx - With PropTypes
import React from "react";
import PropTypes from "prop-types";
import {
  UserIcon,
  CrownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const TripMembersList = ({
  members = [],
  trip,
  currentUser,
  onMemberClick,
  showHeader = true,
}) => {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberRole = (member) => {
    if (member.uid === trip?.createdBy) {
      return {
        role: "creator",
        label: "Creator",
        icon: CrownIcon,
        color: "text-purple-600",
      };
    }
    if (trip?.admins?.includes(member.uid)) {
      return {
        role: "admin",
        label: "Admin",
        icon: ShieldCheckIcon,
        color: "text-blue-600",
      };
    }
    return {
      role: "member",
      label: "Member",
      icon: UserIcon,
      color: "text-gray-600",
    };
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No members found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            Trip Members ({members.length})
          </h3>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => {
          const memberRole = getMemberRole(member);
          const RoleIcon = memberRole.icon;

          return (
            <div
              key={member.uid}
              onClick={() => onMemberClick?.(member)}
              className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200 cursor-pointer group border border-orange-200/30 dark:border-orange-800/30"
            >
              {/* Avatar */}
              <div className="relative">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-200 dark:border-orange-700 group-hover:border-orange-400 dark:group-hover:border-orange-500 transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-medium text-sm border-2 border-orange-200 dark:border-orange-700 group-hover:border-orange-400 dark:group-hover:border-orange-500 transition-colors">
                    {getInitials(member.displayName || member.email)}
                  </div>
                )}

                {/* Role badge */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-orange-200 dark:border-orange-700 ${memberRole.color}`}
                >
                  <RoleIcon className="w-3 h-3" />
                </div>
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {member.displayName || "Unknown User"}
                  </p>
                  {member.uid === currentUser?.uid && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {member.email}
                  </p>
                  <span className={`text-xs font-medium ${memberRole.color}`}>
                    {memberRole.label}
                  </span>
                </div>
              </div>

              {/* Action indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 🔥 ADD: PropTypes for better development experience
TripMembersList.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      email: PropTypes.string.isRequired,
      photoURL: PropTypes.string,
    })
  ),
  trip: PropTypes.shape({
    id: PropTypes.string.isRequired,
    createdBy: PropTypes.string.isRequired,
    admins: PropTypes.arrayOf(PropTypes.string),
    members: PropTypes.arrayOf(PropTypes.string),
  }),
  currentUser: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }),
  onMemberClick: PropTypes.func,
  showHeader: PropTypes.bool,
};

TripMembersList.defaultProps = {
  members: [],
  showHeader: true,
  onMemberClick: null,
};

export default TripMembersList;
