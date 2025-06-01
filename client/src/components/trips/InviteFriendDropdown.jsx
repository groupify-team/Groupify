import React, { useState, useEffect } from 'react';
import { getFriends } from '../../services/firebase/users';

// 🧩 Component for inviting friends to a trip, with exclusion support
const InviteFriendDropdown = ({ currentUser, onSelect, excludedUserIds = [] }) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);

  // 📥 Load and filter friends (excluding trip members)
  useEffect(() => {
    const fetchFriends = async () => {
      if (currentUser?.uid) {
        const results = await getFriends(currentUser.uid);
        const filtered = results.filter(friend => !excludedUserIds.includes(friend.uid));
        setFriends(filtered);
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

  // 🧾 Render search input and filtered friend list
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Search friend by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2 w-full border px-3 py-2 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {searchTerm.trim().length > 0 && (
        <div className="border rounded-md bg-white max-h-64 overflow-y-auto shadow-sm">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.uid}
                onClick={() => onSelect(friend)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100"
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-700">
                  {friend.photoURL ? (
                    <img
                      src={friend.photoURL}
                      alt={friend.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{friend.displayName[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{friend.displayName}</p>
                  <p className="text-xs text-gray-500">{friend.email}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="p-3 text-sm text-gray-400">No matching friends found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InviteFriendDropdown;
