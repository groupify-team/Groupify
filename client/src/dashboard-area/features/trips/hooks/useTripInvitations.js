// client/src/dashboard-area/features/trips/hooks/useTripInvitations.js
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getPendingInvites,
  acceptTripInvite,
  declineTripInvite,
} from "@shared/services/firebase/trips";

export const useTripInvitations = (userId) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState(null);

  // Load pending invitations
  const loadPendingInvites = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const invites = await getPendingInvites(userId);
      setPendingInvites(invites);
    } catch (error) {
      console.error("Error loading pending invites:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);
      await acceptTripInvite(invite.id, userId);

      // Remove from local state
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
      toast.success(`Joined ${invite.tripName}!`);
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessingInvite(null);
    }
  };

  // Decline invitation
  const declineInvite = async (invite) => {
    try {
      setProcessingInvite(invite.id);
      await declineTripInvite(invite.id);

      // Remove from local state
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
      toast.success("Invitation declined");
    } catch (error) {
      console.error("Error declining invite:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setProcessingInvite(null);
    }
  };

  // Load invites when userId changes
  useEffect(() => {
    if (userId) {
      loadPendingInvites();
    }
  }, [userId]);

  return {
    pendingInvites,
    loading,
    processingInvite,
    acceptInvite,
    declineInvite,
    refreshInvites: loadPendingInvites,
  };
};
