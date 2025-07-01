// dashboard-area/features/friends/components/AddFriendModal.jsx
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AddFriend from "./AddFriend";

const AddFriendModal = ({ 
  isOpen, 
  onClose, 
  onUserSelect, 
  onAddFriendDirect,
  preservedInput = "",
  preservedUser = null 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Add New Friend
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Search by email address to connect with friends
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          <AddFriend
            onUserSelect={onUserSelect}
            onAddFriendDirect={onAddFriendDirect}
            preservedInput={preservedInput}
            preservedUser={preservedUser}
          />
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;