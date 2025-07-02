/**
 * Hook for managing trip invitations to friends
 * Handles sending invites and checking existing invitation status
 */

import { useState } from "react";
import { toast } from "react-hot-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { sendTripInvite } from "@shared/services/firebase/trips";

export const useTripInvitations = (tripId, currentUser) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleInviteFriend = async (friend) => {
    try {
      setIsLoading(true);

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

      await sendTripInvite(tripId, currentUser.uid, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      toast.error("Failed to send invitation.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleInviteFriend,
  };
};
