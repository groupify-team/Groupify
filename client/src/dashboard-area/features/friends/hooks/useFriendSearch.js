import { useState, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { FriendsService } from "../services/friendsService";

export const useFriendSearch = () => {
  const { currentUser } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Search for users to add as friends
  const searchUsers = useCallback(
    async (term) => {
      if (!currentUser?.uid) return;

      setSearchTerm(term);

      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        setError(null);

        const results = await FriendsService.searchUsersToAddAsFriends(
          term,
          currentUser.uid
        );
        setSearchResults(results);
      } catch (err) {
        console.error("Error searching users:", err);
        setError(err.message);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [currentUser?.uid]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    searchTerm,
    searching,
    error,
    searchUsers,
    clearSearch,
  };
};
