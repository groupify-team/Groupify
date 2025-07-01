import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const UserProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  currentUserId,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  friends = [],
  pendingRequests = []
}) => {
  console.log("🔍 UserProfileModal Debug:", {
    isOpen,
    user,
    currentUserId,
    friends,
    pendingRequests
  });

  if (!isOpen || !user) {
    console.log("🔍 Modal not showing - isOpen:", isOpen, "user:", user);
    return null;
  }

  const isFriend = friends.includes(user.uid);
  const isPending = pendingRequests.some(req => 
    (req.from === currentUserId && req.to === user.uid) ||
    (req.from === user.uid && req.to === currentUserId)
  );

  console.log("🔍 Modal relationship status:", { isFriend, isPending });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-slate-700">
        {/* Header with Close Button */}
        <div className="relative p-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 pb-6">
          {/* Profile Image */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 mx-auto">
                <img
                  src={
                    user.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover bg-slate-700"
                />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {user.displayName || "Unknown User"}
            </h2>
            <p className="text-slate-400 text-sm break-all mb-3">
              {user.email}
            </p>
            
            {/* User Stats */}
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-slate-400 text-xs">📍</span>
                </div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">TRIPS</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-slate-400 text-xs">👥</span>
                </div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">FRIENDS</div>
              </div>
            </div>
          </div>

          {/* Relationship Status Button */}
          <div className="mb-4">
            {isFriend ? (
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <span className="text-lg">⭐</span>
                Friends
              </button>
            ) : isPending ? (
              <button className="w-full bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <span className="text-lg">⏳</span>
                Request Pending
              </button>
            ) : currentUserId !== user.uid ? (
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <span className="text-lg">⭐</span>
                Add Friend
              </button>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {currentUserId !== user.uid && (
              <>
                {isFriend ? (
                  <button
                    onClick={() => onRemoveFriend?.(user.uid)}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200"
                  >
                    Remove Friend
                  </button>
                ) : isPending ? (
                  <button
                    onClick={() => onCancelRequest?.(user.uid)}
                    className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors duration-200"
                  >
                    Cancel Request
                  </button>
                ) : (
                  <button
                    onClick={() => onAddFriend?.(user.uid)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200"
                  >
                    Send Friend Request
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;