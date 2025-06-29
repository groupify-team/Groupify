import React from "react";

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
  if (!isOpen || !user) return null;

  const isFriend = friends.includes(user.uid);
  const isPending = pendingRequests.some(req => 
    (req.from === currentUserId && req.to === user.uid) ||
    (req.from === user.uid && req.to === currentUserId)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-xl font-medium">
              {(user.displayName || user.email || "U")[0].toUpperCase()}
            </span>
          </div>
          <h3 className="font-medium">{user.displayName || "Unknown User"}</h3>
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>

        <div className="flex gap-2">
          {currentUserId !== user.uid && (
            <>
              {isFriend ? (
                <button
                  onClick={() => onRemoveFriend?.(user.uid)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove Friend
                </button>
              ) : isPending ? (
                <button
                  onClick={() => onCancelRequest?.(user.uid)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  onClick={() => onAddFriend?.(user.uid)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Friend
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
