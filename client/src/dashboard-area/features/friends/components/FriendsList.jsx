// FriendsList.jsx - extracted from FriendsMain for clarity and reusability
import React from "react";
import { EnhancedUserCard } from "@shared/components/user";

const FriendsList = ({ friends, handleViewProfile }) => {
  if (friends.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-200/60 dark:border-slate-600/60 p-12 text-center">
        <div className="w-16 h-16 bg-gray-200/50 dark:bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-500 dark:text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87V4m0 0a4 4 0 00-8 0v16m8-16a4 4 0 018 0v16"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          No friends yet
        </h3>
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          Start connecting with people to share your travel memories
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {friends.map((friend) => {
        console.log("Rendering friend:", friend);
        return (
          <EnhancedUserCard
            key={friend.uid}
            user={friend}
            onClick={() => {
              console.log("Friend card clicked:", friend);
              handleViewProfile(friend);
            }}
            context="friend"
            showStatus={true}
            status="online"
            className="relative"
          />
        );
      })}
    </div>
  );
};

export default FriendsList;
