// hooks/useInviteFriends.js
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { getFriends } from "@shared/services/firebase/users";
import { sendTripInvite } from "@shared/services/firebase/trips";

export const useInviteFriends = (currentUser, tripId, excludedUserIds = []) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

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
          toast.error("Failed to load friends");
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
          friend.displayName?.toLowerCase().includes(term) ||
          friend.email?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, friends]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Handle friend invitation with all the logic
  const handleInviteFriend = async (friend) => {
    if (!tripId || !currentUser?.uid) {
      toast.error("Missing trip or user information");
      return;
    }

    try {
      setIsInviting(true);

      // Check if invitation already exists
      const q = query(
        collection(db, "tripInvites"),
        where("tripId", "==", tripId),
        where("inviteeUid", "==", friend.uid),
        where("status", "==", "pending")
      );

      const existing = await getDocs(q);

      if (!existing.empty) {
        toast(`${friend.displayName} already has a pending invite.`, {
          style: {
            borderRadius: "10px",
            background: "#fdf6e3",
            color: "#333",
            border: "1px solid #f59e0b",
          },
          icon: "⚠️",
        });
        return;
      }

      // Send the invitation
      await sendTripInvite(tripId, currentUser.uid, friend.uid);

      // Remove friend from available list (they're now invited)
      setFriends((prev) => prev.filter((f) => f.uid !== friend.uid));

      // Clear search if this was the only result
      if (
        filteredFriends.length === 1 &&
        filteredFriends[0].uid === friend.uid
      ) {
        clearSearch();
      }

      toast.success(`Invitation sent to ${friend.displayName}!`);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return {
    // State
    friends,
    searchTerm,
    filteredFriends,
    isLoading,
    isInviting,

    // Actions
    setSearchTerm,
    clearSearch,
    handleInviteFriend,
  };
};
