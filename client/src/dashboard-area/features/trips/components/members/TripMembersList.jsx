import React from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const TripMembersList = ({
  tripId,
  trip,
  tripMembers,
  currentUser,
  isAdmin,
  onMemberClick,
}) => {
  const checkFriendStatus = async (myUid, otherUid) => {
    // TODO: Implement friend status checking
    return "none";
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Trip Members
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                {tripMembers.length}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              View member profiles
            </p>
          </div>
        </div>

        {tripMembers.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No members found
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-700 scrollbar-track-transparent">
            {[...tripMembers]
              .sort((a, b) => {
                if (a.uid === currentUser.uid) return -1;
                if (b.uid === currentUser.uid) return 1;
                if (a.uid === trip.createdBy) return -1;
                if (b.uid === trip.createdBy) return 1;
                return (a.displayName || a.email || "").localeCompare(
                  b.displayName || b.email || ""
                );
              })
              .map((member) => (
                <div
                  key={member.uid}
                  className="group/member flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-orange-900/20 hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/30 dark:hover:to-orange-900/40 transition-all duration-300 cursor-pointer border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm"
                  onClick={async () => {
                    const status = await checkFriendStatus(
                      currentUser.uid,
                      member.uid
                    );
                    const isPendingNow = status === "pending";
                    onMemberClick({
                      ...member,
                      __isFriend: false, // TODO: implement friend checking
                      __isPending: isPendingNow,
                    });
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          member.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt="Avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                      />
                      {member.uid === currentUser.uid && (
                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate text-xs sm:text-sm">
                        {member.displayName || member.email || member.uid}
                        {member.uid === currentUser.uid && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex-shrink-0">
                    {member.uid === trip.createdBy ? (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                        Creator
                      </span>
                    ) : trip.admins?.includes(member.uid) ? (
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                        Admin
                      </span>
                    ) : (
                      <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded-full">
                        Member
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripMembersList;
