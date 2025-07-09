// FriendsList.jsx - updated with better design
import React from "react";
import { UserCard } from "@shared/components/user";
import { EyeIcon, UsersIcon, HeartIcon } from "@heroicons/react/24/outline";

const FriendsList = ({ friends = [], handleViewProfile }) => {
  console.log("FriendsList props:", {
    friendsCount: friends?.length,
    friends,
  });

  // Empty state
  if (!friends || friends.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-gray-200/60 dark:border-slate-600/60 p-8 text-center shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <UsersIcon className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No friends yet
        </h3>
        <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Start connecting with people to share your memories and experiences
          together
        </p>
        <div className="flex flex-col gap-3 text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">💡</span>
            <span>Use the search above to find friends by email</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🎉</span>
            <span>Send friend requests to connect</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-gray-200/60 dark:border-slate-600/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <HeartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Friends
              </h2>
              <p className="text-gray-600 dark:text-slate-400">
                People you're connected with
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="font-bold text-lg">{friends.length}</span>
            <span className="text-sm ml-1">
              friend{friends.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend) => {
          console.log("Rendering friend:", friend);

          // Ensure friend has proper ID
          const friendId = friend.uid || friend.id;
          if (!friendId) {
            console.warn("Friend without proper ID:", friend);
            return null;
          }

          return (
            <div key={friendId} className="relative group">
              {/* Enhanced Friend Card */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div
                  className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl border border-gray-200/60 dark:border-slate-600/60 p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group-hover:scale-[1.02]"
                  onClick={() => {
                    console.log("Friend card clicked:", friend);
                    handleViewProfile(friend);
                  }}
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={
                          friend.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt={`${friend.displayName || friend.email}'s avatar`}
                        className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-slate-600 shadow-lg"
                      />
                      {/* Online Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>

                    {/* View Profile Button */}
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(friend);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded-xl shadow-lg transform hover:scale-110 transition-all duration-200"
                        title="View Profile"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Friend Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                      {friend.displayName || "Unknown User"}
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 text-sm truncate">
                      {friend.email}
                    </p>

                    {/* Friend Since */}
                    <div className="flex items-center gap-2 pt-2">
                      <HeartIcon className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        Friends since 2024
                      </span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FriendsList;
