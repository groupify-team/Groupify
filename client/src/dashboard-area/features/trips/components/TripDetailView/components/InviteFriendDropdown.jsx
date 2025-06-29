// components/InviteFriendDropdown.jsx
import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getFriends } from "../../../services/firebase/users";

// 🧩 Component for inviting friends to a trip, with exclusion support
const InviteFriendDropdown = ({
  currentUser,
  onSelect,
  excludedUserIds = [],
}) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 📥 Load and filter friends (excluding trip members)
  useEffect(() => {
    const fetchFriends = async () => {
      if (currentUser?.uid) {
        setIsLoading(true);
        try {
          const results = await getFriends(currentUser.uid);
          const filtered = results.filter(
            (friend) => !excludedUserIds.includes(friend.uid)
          );
          setFriends(filtered);
        } catch (error) {
          console.error("Error fetching friends:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFriends();
  }, [currentUser, excludedUserIds]);

  // 🔍 Filter by search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredFriends(
      friends.filter(
        (friend) =>
          friend.displayName.toLowerCase().includes(term) ||
          friend.email.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, friends]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 🧾 Render search input and filtered friend list
  return (
    <div className="w-full space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        </div>
        <input
          type="text"
          placeholder="Search friends by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-8 py-2 sm:pl-10 sm:pr-10 sm:py-3 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors" />
          </button>
        )}
      </div>

      {/* Results */}
      {searchTerm.trim().length > 0 && (
        <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Searching...
              </p>
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <div className="p-3 border-b border-emerald-200/30 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <UsersIcon className="w-3 h-3" />
                  <span>
                    {filteredFriends.length} friend
                    {filteredFriends.length !== 1 ? "s" : ""} found
                  </span>
                </div>
              </div>

              <div className="divide-y divide-emerald-200/20 dark:divide-emerald-700/20">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    onClick={() => onSelect(friend)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-200 dark:border-emerald-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium text-xs border border-emerald-200 dark:border-emerald-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors">
                          {getInitials(friend.displayName)}
                        </div>
                      )}
                    </div>

                    {/* Friend Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate text-sm">
                        {friend.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {friend.email}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
                      <UserPlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                No friends found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try searching with a different name
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {searchTerm.trim().length === 0 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Start typing to search
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Type a friend's name or email to find them
          </p>
        </div>
      )}

      {/* Friends Count Info */}
      {friends.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-emerald-200/30 dark:border-emerald-700/30">
          <span>
            {friends.length} friend{friends.length !== 1 ? "s" : ""} available
          </span>
          {excludedUserIds.length > 0 && (
            <span className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
              {excludedUserIds.length} in trip
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default InviteFriendDropdown;
