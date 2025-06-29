// hooks/useTripMembers.js (Complete implementation)
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { updateTrip } from "../../../services/firebase/trips";
import { getUserProfile } from "../../../services/firebase/users";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../services/firebase/config";

export const useTripMembers = (trip, setTrip) => {
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Load member profiles when trip changes
  useEffect(() => {
    if (trip && trip.members && trip.members.length > 0) {
      loadMemberProfiles();
    } else {
      setMembers([]);
    }
  }, [trip?.members]);

  const loadMemberProfiles = async () => {
    try {
      const memberProfiles = await Promise.all(
        trip.members.map((uid) => getUserProfile(uid))
      );
      setMembers(memberProfiles);
    } catch (error) {
      console.error("Error loading member profiles:", error);
      toast.error("Failed to load member profiles");
    }
  };

  const checkFriendStatus = async (myUid, otherUid) => {
    try {
      const ref = doc(db, "friendRequests", `${myUid}_${otherUid}`);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.status === "pending" ? "pending" : "none";
      }
      return "none";
    } catch (error) {
      console.error("Error checking friend status:", error);
      return "none";
    }
  };

  const handleMemberClick = async (member, currentUserId, friends) => {
    try {
      const isFriendNow = friends.includes(member.uid);
      const status = await checkFriendStatus(currentUserId, member.uid);
      const isPendingNow = status === "pending";

      setSelectedUser({
        ...member,
        __isFriend: isFriendNow,
        __isPending: isPendingNow,
      });
      setShowUserModal(true);
    } catch (error) {
      console.error("Error handling member click:", error);
    }
  };

  const promoteToAdmin = async (uid) => {
    try {
      // Check if user is already an admin
      if (trip.admins?.includes(uid)) {
        toast.info("User is already an admin");
        return;
      }

      const updatedTrip = {
        ...trip,
        admins: [...(trip.admins || []), uid],
      };

      await updateTrip(trip.id, updatedTrip);
      setTrip(updatedTrip);

      // Update local member state to reflect admin status
      setMembers((prev) =>
        prev.map((member) =>
          member.uid === uid ? { ...member, isAdmin: true } : member
        )
      );

      toast.success("User promoted to admin successfully");
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast.error("Failed to promote user to admin");
    }
  };

  const demoteFromAdmin = async (uid) => {
    try {
      // Check if this is the last admin
      const isLastAdmin = trip.admins?.length === 1 && trip.admins[0] === uid;

      if (isLastAdmin) {
        toast.error(
          "Cannot demote the last admin. Either delete the trip or assign another admin first."
        );
        return;
      }

      // Check if trying to demote the creator
      if (uid === trip.createdBy) {
        toast.error("Cannot demote the trip creator from admin status.");
        return;
      }

      const updatedTrip = {
        ...trip,
        admins: trip.admins?.filter((id) => id !== uid),
      };

      await updateTrip(trip.id, updatedTrip);
      setTrip(updatedTrip);

      // Update local member state to reflect non-admin status
      setMembers((prev) =>
        prev.map((member) =>
          member.uid === uid ? { ...member, isAdmin: false } : member
        )
      );

      toast.success("User demoted from admin successfully");
    } catch (error) {
      console.error("Error demoting from admin:", error);
      toast.error("Failed to demote user from admin");
    }
  };

  const removeFromTrip = async (uid) => {
    try {
      const userToRemove = members.find((m) => m.uid === uid);

      // Check if trying to remove the trip creator
      if (uid === trip.createdBy) {
        toast.error(
          "Cannot remove the trip creator. Transfer ownership first or delete the trip."
        );
        return;
      }

      // Check if this would leave no admins
      const remainingAdmins = trip.admins?.filter((id) => id !== uid) || [];
      if (remainingAdmins.length === 0 && trip.admins?.includes(uid)) {
        toast.error(
          "Cannot remove the last admin. Promote another member to admin first."
        );
        return;
      }

      const updatedMembers = trip.members?.filter((id) => id !== uid);
      const updatedAdmins = trip.admins?.filter((id) => id !== uid);

      const updatedTrip = {
        ...trip,
        members: updatedMembers,
        admins: updatedAdmins,
      };

      await updateTrip(trip.id, updatedTrip);
      setTrip(updatedTrip);

      // Update local members state
      setMembers((prev) => prev.filter((member) => member.uid !== uid));

      toast.success(
        `${userToRemove?.displayName || uid} was removed from the trip`
      );

      // Close the modal and clear selected user
      setSelectedUser(null);
      setShowUserModal(false);
    } catch (error) {
      console.error("Failed to remove user from trip:", error);
      toast.error("Failed to remove user from trip");
    }
  };

  const addMember = async (newMemberUid) => {
    try {
      // Check if user is already a member
      if (trip.members?.includes(newMemberUid)) {
        toast.info("User is already a member of this trip");
        return;
      }

      const updatedMembers = [...(trip.members || []), newMemberUid];
      const updatedTrip = {
        ...trip,
        members: updatedMembers,
      };

      await updateTrip(trip.id, updatedTrip);
      setTrip(updatedTrip);

      // Load the new member's profile and add to local state
      const newMemberProfile = await getUserProfile(newMemberUid);
      setMembers((prev) => [...prev, newMemberProfile]);

      toast.success("Member added to trip successfully");
    } catch (error) {
      console.error("Error adding member to trip:", error);
      toast.error("Failed to add member to trip");
    }
  };

  const updateMember = (memberId, updates) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.uid === memberId ? { ...member, ...updates } : member
      )
    );
  };

  const cancelFriendRequest = async (currentUserId, targetUid) => {
    try {
      const ref = doc(db, "friendRequests", `${currentUserId}_${targetUid}`);
      await deleteDoc(ref);

      // Update the selected user state
      if (selectedUser && selectedUser.uid === targetUid) {
        setSelectedUser((prev) => ({
          ...prev,
          __isPending: false,
        }));
      }

      toast.success("Friend request cancelled");
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  // Helper functions
  const isUserAdmin = (userId) => {
    return trip?.admins?.includes(userId) || trip?.createdBy === userId;
  };

  const isUserMember = (userId) => {
    return trip?.members?.includes(userId);
  };

  const isUserCreator = (userId) => {
    return trip?.createdBy === userId;
  };

  const getMemberRole = (member) => {
    if (member.uid === trip?.createdBy) {
      return {
        role: "creator",
        label: "Creator",
        color: "purple",
        icon: "CrownIcon",
        canPromote: false,
        canDemote: false,
        canRemove: false,
      };
    }
    if (trip?.admins?.includes(member.uid)) {
      return {
        role: "admin",
        label: "Admin",
        color: "blue",
        icon: "ShieldCheckIcon",
        canPromote: false,
        canDemote: true,
        canRemove: true,
      };
    }
    return {
      role: "member",
      label: "Member",
      color: "gray",
      icon: "UserIcon",
      canPromote: true,
      canDemote: false,
      canRemove: true,
    };
  };

  const sortMembers = (currentUserId) => {
    return [...members].sort((a, b) => {
      // Current user first
      if (a.uid === currentUserId) return -1;
      if (b.uid === currentUserId) return 1;

      // Creator second
      if (a.uid === trip?.createdBy) return -1;
      if (b.uid === trip?.createdBy) return 1;

      // Admins third
      const aIsAdmin = trip?.admins?.includes(a.uid);
      const bIsAdmin = trip?.admins?.includes(b.uid);
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // Alphabetical by display name or email
      return (a.displayName || a.email || "").localeCompare(
        b.displayName || b.email || ""
      );
    });
  };

  const getAdminCount = () => {
    return trip?.admins?.length || 0;
  };

  const getMemberCount = () => {
    return trip?.members?.length || 0;
  };

  const canCurrentUserManage = (currentUserId, targetUserId) => {
    // Creator can manage everyone except themselves
    if (trip?.createdBy === currentUserId && targetUserId !== currentUserId) {
      return true;
    }

    // Admins can manage regular members, but not other admins or creator
    if (trip?.admins?.includes(currentUserId)) {
      const targetIsAdmin = trip?.admins?.includes(targetUserId);
      const targetIsCreator = trip?.createdBy === targetUserId;
      return (
        !targetIsAdmin && !targetIsCreator && targetUserId !== currentUserId
      );
    }

    return false;
  };

  return {
    // State
    members,
    selectedUser,
    showUserModal,

    // Setters
    setMembers,
    setSelectedUser,
    setShowUserModal,

    // Actions
    handleMemberClick,
    promoteToAdmin,
    demoteFromAdmin,
    removeFromTrip,
    addMember,
    updateMember,
    loadMemberProfiles,
    cancelFriendRequest,

    // Helpers
    isUserAdmin,
    isUserMember,
    isUserCreator,
    getMemberRole,
    sortMembers,
    getAdminCount,
    getMemberCount,
    canCurrentUserManage,
  };
};
