// FriendRequestsList.jsx - Fixed version with debug logging
import React from "react";
import {
  UsersIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { EnhancedUserCard } from "@shared/components/user";

const FriendRequestsList = ({
  pendingRequests,
  showFriendRequests,
  setShowFriendRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) => {
  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-slate-600/60 mb-6">
      <button
        onClick={() => setShowFriendRequests(!showFriendRequests)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/60 dark:hover:bg-slate-700/60 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Friend Requests
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              {pendingRequests.length} pending
            </p>
          </div>
        </div>
        {showFriendRequests ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
        )}
      </button>
      
      {showFriendRequests && (
        <div className="border-t border-gray-200/60 dark:border-slate-600/60 p-4 space-y-3">
          {pendingRequests.map((request) => {
            console.log("🔍 Request object:", request); // Debug log
            
            return (
              <div
                key={request.id}
                className="bg-gray-100/80 dark:bg-slate-600/80 border border-gray-300/60 dark:border-slate-500/60 rounded-lg p-3"
              >
                <EnhancedUserCard
                  user={request} // Use request directly since UserService includes user data in the request
                  context="request"
                  size="small"
                  className="!bg-transparent !border-none !p-0"
                  actions={
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log("🔍 Accepting request with ID:", request.id);
                          handleAcceptRequest(request.id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          console.log("🔍 Rejecting request with ID:", request.id);
                          handleRejectRequest(request.id);
                        }}
                        className="bg-gray-600 hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsList;