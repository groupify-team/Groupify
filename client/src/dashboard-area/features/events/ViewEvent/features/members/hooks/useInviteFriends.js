/**
 * Hook for friend search and invitation within event context
 * Handles friend filtering, search functionality, and event invitations
 */

import { useState, useEffect } from "react";
import { toast } from "@shared/utils/toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { getFriends } from "@shared/services/firebase/users";
import { sendEventInvite } from "@shared/services/firebase/events";

export const useInviteFriends = (
  currentUser,
  eventId,
  excludedUserIds = []
) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

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
          console.error("useInviteFriends: Error fetching friends:", error);
          toast.error("Failed to load friends");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFriends();
  }, [currentUser, excludedUserIds]);

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

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleInviteFriend = async (friend) => {
    if (!eventId || !currentUser?.uid) {
      console.error("❌ Missing event or user information:", {
        eventId,
        currentUser: currentUser?.uid,
      });
      toast.error("Missing event or user information");
      return;
    }

    try {
      setIsInviting(true);
      const q = query(
        collection(db, "eventInvites"),
        where("eventId", "==", eventId),
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
          duration: 4000,
        });
        return;
      }

      try {
        await sendEventInvite(eventId, currentUser.uid, friend.uid);
      } catch (inviteError) {
        console.error("Detailed invite error:", inviteError);
        if (inviteError.code === "permission-denied") {
          toast.error(
            "You don't have permission to send invites to this event.",
            { duration: 5000 }
          );
        } else if (inviteError.code === "not-found") {
          toast.error("Event not found or friend doesn't exist.", {
            duration: 5000,
          });
        } else if (inviteError.message?.includes("limit")) {
          toast.error(inviteError.message, { duration: 6000 });
        } else {
          toast.error(`Failed to send invitation: ${inviteError.message}`, {
            duration: 5000,
          });
        }
        return;
      }
      setFriends((prev) => prev.filter((f) => f.uid !== friend.uid));
      if (
        filteredFriends.length === 1 &&
        filteredFriends[0].uid === friend.uid
      ) {
        clearSearch();
      }
      toast.success(`🎉 Invitation sent to ${friend.displayName}!`, {
        duration: 4000,
        style: {
          borderRadius: "10px",
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #22c55e",
        },
      });
    } catch (error) {
      console.error("Error sending event invite:", error);

      if (error.code === "permission-denied") {
        toast.error(
          "Permission denied. You may not have permission to send invites.",
          { duration: 5000 }
        );
      } else if (error.code === "not-found") {
        toast.error("Event not found or user doesn't exist.", {
          duration: 5000,
        });
      } else if (error.message?.includes("limit")) {
        toast.error(error.message, { duration: 6000 });
      } else {
        toast.error("Failed to send invitation. Please try again.", {
          duration: 5000,
        });
      }
    } finally {
      setIsInviting(false);
    }
  };

  return {
    friends,
    searchTerm,
    filteredFriends,
    isLoading,
    isInviting,
    setSearchTerm,
    clearSearch,
    handleInviteFriend,
  };
};
