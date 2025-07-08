import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { userStatsCache } from "@shared/services/userStatsCache";

/**
 * Unified service for user-related operations
 * Handles friends, requests, and user data management
 */
export class UserService {
  /**
   * Get user profile data
   */
  static async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: userId, // Ensure uid is always included
          id: userId, // Add id as well for compatibility
          ...userData,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Get multiple user profiles
   */
  static async getUserProfiles(userIds) {
    try {
      const profiles = await Promise.all(
        userIds.map((uid) => this.getUserProfile(uid))
      );
      return profiles.filter((profile) => profile !== null);
    } catch (error) {
      console.error("Error getting user profiles:", error);
      throw error;
    }
  }

  /**
   * Send friend request
   */
  static async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Check if request already exists
      const existingRequest = await this.getExistingFriendRequest(
        fromUserId,
        toUserId
      );
      if (existingRequest) {
        throw new Error("Friend request already exists");
      }

      // Check if already friends
      const areAlreadyFriends = await this.areUsersFriends(
        fromUserId,
        toUserId
      );
      if (areAlreadyFriends) {
        throw new Error("Users are already friends");
      }

      // Create friend request
      const requestRef = await addDoc(collection(db, "friendRequests"), {
        from: fromUserId,
        to: toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update recipient's friend requests array
      await updateDoc(doc(db, "users", toUserId), {
        friendRequests: arrayUnion({
          from: fromUserId,
          id: requestRef.id,
          createdAt: serverTimestamp(),
        }),
      });

      return requestRef.id;
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(requestId, currentUserId) {
    try {
      // Get the friend request
      const requestDoc = await getDoc(doc(db, "friendRequests", requestId));
      if (!requestDoc.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify the current user is the recipient
      if (requestData.to !== currentUserId) {
        throw new Error("Unauthorized to accept this request");
      }

      const fromUserId = requestData.from;
      const toUserId = requestData.to;

      // Add each user to the other's friends list
      await Promise.all([
        updateDoc(doc(db, "users", fromUserId), {
          friends: arrayUnion(toUserId),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", toUserId), {
          friends: arrayUnion(fromUserId),
          friendRequests: arrayRemove({
            from: fromUserId,
            id: requestId,
            createdAt: requestData.createdAt,
          }),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", requestId));

      // Invalidate user stats cache
      userStatsCache.invalidateUser(fromUserId);
      userStatsCache.invalidateUser(toUserId);

      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  }

  /**
   * Reject friend request
   */
  static async rejectFriendRequest(requestId, currentUserId) {
    try {
      // Get the friend request
      const requestDoc = await getDoc(doc(db, "friendRequests", requestId));
      if (!requestDoc.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify the current user is the recipient
      if (requestData.to !== currentUserId) {
        throw new Error("Unauthorized to reject this request");
      }

      // Remove from recipient's friend requests array
      await updateDoc(doc(db, "users", currentUserId), {
        friendRequests: arrayRemove({
          from: requestData.from,
          id: requestId,
          createdAt: requestData.createdAt,
        }),
        updatedAt: serverTimestamp(),
      });

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", requestId));

      return true;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  }

  /**
   * Cancel friend request
   */
  static async cancelFriendRequest(fromUserId, toUserId) {
    try {
      // Find the request
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Friend request not found");
      }

      const requestDoc = querySnapshot.docs[0];
      const requestData = requestDoc.data();

      // Remove from recipient's friend requests array
      await updateDoc(doc(db, "users", toUserId), {
        friendRequests: arrayRemove({
          from: fromUserId,
          id: requestDoc.id,
          createdAt: requestData.createdAt,
        }),
        updatedAt: serverTimestamp(),
      });

      // Delete the friend request
      await deleteDoc(requestDoc.ref);

      return true;
    } catch (error) {
      console.error("Error canceling friend request:", error);
      throw error;
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(userId1, userId2) {
    try {
      // Remove each user from the other's friends list
      await Promise.all([
        updateDoc(doc(db, "users", userId1), {
          friends: arrayRemove(userId2),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", userId2), {
          friends: arrayRemove(userId1),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // Invalidate user stats cache
      userStatsCache.invalidateUser(userId1);
      userStatsCache.invalidateUser(userId2);

      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  }

  /**
   * Get user's friends
   */
  static async getUserFriends(userId) {
    try {
      console.log(`UserService.getUserFriends called for user: ${userId}`);

      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        console.warn(`User document for ${userId} not found`);
        return [];
      }

      const userData = userDoc.data();
      const friendIds = userData.friends || [];
      console.log(
        `Found ${friendIds.length} friend IDs for user ${userId}:`,
        friendIds
      );

      if (friendIds.length === 0) {
        return [];
      }

      // Get full user profiles for all friends with proper error handling
      const friendProfiles = [];
      for (const friendId of friendIds) {
        try {
          const friendProfile = await this.getUserProfile(friendId);
          if (friendProfile) {
            // Ensure compatibility with different uid field names
            friendProfiles.push({
              ...friendProfile,
              uid: friendProfile.uid || friendProfile.id || friendId,
              id: friendProfile.id || friendProfile.uid || friendId,
            });
          } else {
            console.warn(`Friend profile not found for: ${friendId}`);
          }
        } catch (error) {
          console.error(`Error loading friend profile ${friendId}:`, error);
        }
      }

      console.log(
        `Loaded ${friendProfiles.length} friend profiles successfully`
      );
      return friendProfiles;
    } catch (error) {
      console.error("Error getting user friends:", error);
      throw error;
    }
  }

  /**
   * Get user's friend requests
   */
  static async getUserFriendRequests(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        return [];
      }

      const requests = userDoc.data().friendRequests || [];

      // Get profiles for the request senders
      const requestsWithProfiles = await Promise.all(
        requests.map(async (request) => {
          const profile = await this.getUserProfile(request.from);
          return {
            ...request,
            ...profile,
          };
        })
      );

      return requestsWithProfiles;
    } catch (error) {
      console.error("Error getting user friend requests:", error);
      throw error;
    }
  }

  /**
   * Get pending friend requests for a user
   */
  static async getPendingFriendRequests(userId) {
    return await this.getUserFriendRequests(userId);
  }

  /**
   * Check if users are friends
   */
  static async areUsersFriends(userId1, userId2) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId1));
      if (!userDoc.exists()) {
        return false;
      }

      const friends = userDoc.data().friends || [];
      return friends.includes(userId2);
    } catch (error) {
      console.error("Error checking friendship:", error);
      return false;
    }
  }

  /**
   * Get existing friend request
   */
  static async getExistingFriendRequest(fromUserId, toUserId) {
    try {
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.empty ? null : querySnapshot.docs[0];
    } catch (error) {
      console.error("Error getting existing friend request:", error);
      return null;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(searchTerm, currentUserId, limit = 10) {
    try {
      // This is a simplified search - in production you'd want to use
      // a more sophisticated search solution like Algolia or Elasticsearch
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);

      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUserId && userData.displayName) {
          const displayName = userData.displayName.toLowerCase();
          const email = userData.email?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          if (displayName.includes(term) || email.includes(term)) {
            users.push({
              uid: doc.id,
              ...userData,
            });
          }
        }
      });

      return users.slice(0, limit);
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  /**
   * Find users by email
   */
  static async findUsersByEmail(email) {
    try {
      // This would typically use a more sophisticated search
      // For now, we'll use a simple query
      const users = await this.searchUsers(email, "", 10);
      return users.filter((user) =>
        user.email?.toLowerCase().includes(email.toLowerCase())
      );
    } catch (error) {
      console.error("Error finding users by email:", error);
      throw error;
    }
  }
}
