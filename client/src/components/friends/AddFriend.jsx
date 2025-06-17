import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  findUsersByEmail,
  getUserProfile,
} from "../../services/firebase/users";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AtSymbolIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const AddFriend = ({ onUserSelect }) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    setStatus(null);
    setFoundUser(null);

    try {
      if (!input.trim()) {
        setStatus({ type: "error", message: "Please enter an email address." });
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.trim())) {
        setStatus({
          type: "error",
          message: "Please enter a valid email address.",
        });
        setLoading(false);
        return;
      }

      const users = await findUsersByEmail(input.trim());
      const targetUser = users.find((u) => u.uid !== currentUser.uid);

      if (!targetUser) {
        setStatus({
          type: "error",
          message:
            "User not found. Make sure they have an account with this email.",
        });
        setLoading(false);
        return;
      }

      if (targetUser.uid === currentUser.uid) {
        setStatus({
          type: "error",
          message: "You cannot add yourself as a friend.",
        });
        setLoading(false);
        return;
      }

      // Show found user
      setFoundUser(targetUser);
      setStatus({
        type: "success",
        message: `Found user: ${targetUser.displayName || targetUser.email}`,
      });
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = () => {
    if (foundUser && onUserSelect) {
      onUserSelect(foundUser.uid);
      setInput("");
      setFoundUser(null);
      setStatus({
        type: "success",
        message: "Friend request sent successfully!",
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      if (foundUser) {
        handleAddFriend();
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
          <UserPlusIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Add New Friend
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search by email address
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AtSymbolIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter email address (e.g., friend@example.com)"
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-white/60 dark:bg-gray-700/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg disabled:opacity-50"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {loading && (
              <div className="w-5 h-5 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {/* Search/Add Button */}
        <button
          onClick={foundUser ? handleAddFriend : handleSearch}
          disabled={loading || !input.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Searching...
            </>
          ) : foundUser ? (
            <>
              <UserPlusIcon className="w-5 h-5" />
              Send Friend Request
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5" />
              Find User
            </>
          )}
        </button>
      </div>

      {/* Found User Card */}
      {foundUser && (
        <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-lg border border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  foundUser.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="User avatar"
                className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-gray-600 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                {foundUser.displayName || "User"}
              </h4>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                {foundUser.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Ready to connect!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl backdrop-blur-lg shadow-lg transition-all duration-300 ${
            status.type === "error"
              ? "bg-red-50/90 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : "bg-green-50/90 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
          }`}
        >
          {status.type === "error" ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{status.message}</span>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-lg border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">💡</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-sm mb-2">
              Tips for adding friends:
            </h4>
            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
              <li>• Make sure they have registered with this email</li>
              <li>• Check for typos in the email address</li>
              <li>• They'll receive a friend request notification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
