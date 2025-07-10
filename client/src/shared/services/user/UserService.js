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
      console.log(`🔍 UserService.getUserProfile called for: ${userId}`);

      if (!userId) {
        console.error("❌ getUserProfile: No userId provided");
        return null;
      }

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const profile = {
          uid: userId, // Ensure uid is always included
          id: userId, // Add id as well for compatibility
          ...userData,
        };
        console.log(
          `✅ Profile loaded for ${userId}:`,
          profile.displayName || profile.email
        );
        return profile;
      }

      console.warn(`⚠️ User profile not found for: ${userId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple user profiles
   */
  static async getUserProfiles(userIds) {
    try {
      console.log(`🔍 UserService.getUserProfiles called for:`, userIds);

      if (!userIds || userIds.length === 0) {
        console.log("📭 No user IDs provided to getUserProfiles");
        return [];
      }

      const profiles = await Promise.all(
        userIds.map(async (uid) => {
          try {
            return await this.getUserProfile(uid);
          } catch (error) {
            console.error(`❌ Failed to get profile for ${uid}:`, error);
            return null;
          }
        })
      );

      const validProfiles = profiles.filter((profile) => profile !== null);
      console.log(
        `✅ Loaded ${validProfiles.length}/${userIds.length} profiles`
      );
      return validProfiles;
    } catch (error) {
      console.error("❌ Error getting user profiles:", error);
      throw error;
    }
  }

  /**
   * Send friend request
   */

  static async sendFriendRequest(fromUserId, toUserId) {
    try {
      console.log(`🤝 Sending friend request: ${fromUserId} -> ${toUserId}`);

      // Check if user is trying to send request to themselves
      if (fromUserId === toUserId) {
        console.warn("⚠️ User cannot send friend request to themselves");
        throw new Error("You cannot send a friend request to yourself");
      }

      // Check if request already exists
      const existingRequest = await this.getExistingFriendRequest(
        fromUserId,
        toUserId
      );
      if (existingRequest) {
        console.warn("⚠️ Friend request already exists");
        throw new Error("Friend request already exists");
      }

      // Check if already friends
      const areAlreadyFriends = await this.areUsersFriends(
        fromUserId,
        toUserId
      );
      if (areAlreadyFriends) {
        console.warn("⚠️ Users are already friends");
        throw new Error("Users are already friends");
      }

      // Create friend request
      const requestRef = await addDoc(collection(db, "friendRequests"), {
        from: fromUserId,
        to: toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      console.log(`✅ Friend request created with ID: ${requestRef.id}`);
      return requestRef.id;
    } catch (error) {
      console.error("❌ Error sending friend request:", error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(requestId, currentUserId) {
  try {
    console.log(`✅ Accepting friend request: ${requestId} by ${currentUserId}`);
    console.log(`🔍 RequestId type: ${typeof requestId}, value: "${requestId}"`);
    console.log(`🔍 CurrentUserId type: ${typeof currentUserId}, value: "${currentUserId}"`);

    // Validate inputs
    if (!requestId || typeof requestId !== 'string') {
      console.error("❌ Invalid requestId:", requestId);
      throw new Error("Invalid request ID provided");
    }

    if (!currentUserId || typeof currentUserId !== 'string') {
      console.error("❌ Invalid currentUserId:", currentUserId);
      throw new Error("Invalid current user ID provided");
    }

    // Get the friend request document
    console.log(`🔍 Looking for document with ID: ${requestId}`);
    const requestDoc = await getDoc(doc(db, "friendRequests", requestId));
    
    if (!requestDoc.exists()) {
      console.error("❌ Friend request document not found:", requestId);
      
      // Let's also search for any requests involving this user to debug
      console.log("🔍 Searching for any requests to current user...");
      const q = query(
        collection(db, "friendRequests"),
        where("to", "==", currentUserId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      console.log(`🔍 Found ${querySnapshot.size} pending requests for user ${currentUserId}:`);
      
      querySnapshot.forEach((doc) => {
        console.log(`   - Doc ID: ${doc.id}, Data:`, doc.data());
      });
      
      throw new Error("Friend request not found");
    }

    const requestData = requestDoc.data();
    console.log("📋 Request data:", requestData);

    // Verify the current user is the recipient
    if (requestData.to !== currentUserId) {
      console.error("❌ Unauthorized to accept this request");
      console.log(`🔍 Request 'to' field: ${requestData.to}, current user: ${currentUserId}`);
      throw new Error("Unauthorized to accept this request");
    }

    const fromUserId = requestData.from;
    const toUserId = requestData.to;

    console.log(`🤝 Creating friendship between ${fromUserId} and ${toUserId}`);

    // Add each user to the other's friends list
    await Promise.all([
      updateDoc(doc(db, "users", fromUserId), {
        friends: arrayUnion(toUserId),
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, "users", toUserId), {
        friends: arrayUnion(fromUserId),
        updatedAt: serverTimestamp(),
      }),
    ]);

    // Delete the friend request
    await deleteDoc(doc(db, "friendRequests", requestId));

    // Invalidate user stats cache
    userStatsCache.invalidateUser(fromUserId);
    userStatsCache.invalidateUser(toUserId);

    console.log(`✅ Friend request accepted successfully`);
    return true;
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    throw error;
  }
}

  /**
   * Reject friend request
   */
  static async rejectFriendRequest(requestId, currentUserId) {
    try {
      console.log(
        `❌ Rejecting friend request: ${requestId} by ${currentUserId}`
      );

      // Get the friend request
      const requestDoc = await getDoc(doc(db, "friendRequests", requestId));
      if (!requestDoc.exists()) {
        console.error("❌ Friend request not found:", requestId);
        throw new Error("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify the current user is the recipient
      if (requestData.to !== currentUserId) {
        console.error("❌ Unauthorized to reject this request");
        throw new Error("Unauthorized to reject this request");
      }

      // Delete the friend request
      await deleteDoc(doc(db, "friendRequests", requestId));

      console.log(`✅ Friend request rejected successfully`);
      return true;
    } catch (error) {
      console.error("❌ Error rejecting friend request:", error);
      throw error;
    }
  }

  /**
   * Cancel friend request
   */
  static async cancelFriendRequest(fromUserId, toUserId) {
    try {
      console.log(`🚫 Canceling friend request: ${fromUserId} -> ${toUserId}`);

      // Find the request
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("⚠️ Friend request not found to cancel");
        throw new Error("Friend request not found");
      }

      const requestDoc = querySnapshot.docs[0];

      // Delete the friend request
      await deleteDoc(requestDoc.ref);

      console.log(`✅ Friend request cancelled successfully`);
      return true;
    } catch (error) {
      console.error("❌ Error canceling friend request:", error);
      throw error;
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(userId1, userId2) {
    try {
      console.log(`💔 Removing friendship: ${userId1} <-> ${userId2}`);

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

      console.log(`✅ Friendship removed successfully`);
      return true;
    } catch (error) {
      console.error("❌ Error removing friend:", error);
      throw error;
    }
  }

  /**
   * Get user's friends
   */
  static async getUserFriends(userId) {
    try {
      console.log(`👥 UserService.getUserFriends called for user: ${userId}`);

      if (!userId) {
        console.error("❌ getUserFriends called with no userId");
        return [];
      }

      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        console.warn(`⚠️ User document for ${userId} not found`);
        return [];
      }

      const userData = userDoc.data();
      const friendIds = userData.friends || [];
      console.log(
        `📋 Found ${friendIds.length} friend IDs for user ${userId}:`,
        friendIds
      );

      if (friendIds.length === 0) {
        console.log(`📭 No friends found for user ${userId}`);
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
            console.warn(`⚠️ Friend profile not found for: ${friendId}`);
          }
        } catch (error) {
          console.error(`❌ Error loading friend profile ${friendId}:`, error);
        }
      }

      console.log(
        `✅ Loaded ${friendProfiles.length} friend profiles successfully`
      );
      return friendProfiles;
    } catch (error) {
      console.error("❌ Error getting user friends:", error);
      throw error;
    }
  }

  /**
   * Get user's friend requests
   */
  // In your UserService.js, replace the getUserFriendRequests function:

  static async getUserFriendRequests(userId) {
    try {
      console.log(`📨 Getting friend requests for user: ${userId}`);

      if (!userId) {
        console.error("❌ getUserFriendRequests called with no userId");
        return [];
      }

      // Query friend requests where user is the recipient
      const q = query(
        collection(db, "friendRequests"),
        where("to", "==", userId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      console.log(`📋 Found ${querySnapshot.size} pending friend requests`);

      const requests = [];
      for (const requestDoc of querySnapshot.docs) {
        const requestData = requestDoc.data();
        const documentId = requestDoc.id; // ← Store the REAL document ID

        try {
          // Get the sender's profile
          const senderProfile = await this.getUserProfile(requestData.from);

          if (senderProfile) {
            requests.push({
              id: documentId,         // ← Use the document ID, not user ID
              ...requestData,         // ← Request data (from, to, status, etc.)
              // Merge sender profile but rename conflicting fields
              uid: senderProfile.uid || senderProfile.id,
              displayName: senderProfile.displayName,
              email: senderProfile.email,
              photoURL: senderProfile.photoURL,
              // Don't include senderProfile.id to avoid overwriting documentId
            });
          } else {
            console.warn(
              `⚠️ Sender profile not found for request: ${documentId}`
            );
            // Still include the request with basic info
            requests.push({
              id: documentId,        // ← Use the document ID
              ...requestData,
              displayName: "Unknown User",
              email: "",
            });
          }
        } catch (error) {
          console.error(
            `❌ Error loading sender profile for request ${documentId}:`,
            error
          );
        }
      }

      console.log(`✅ Loaded ${requests.length} friend requests with profiles`);
      return requests;
    } catch (error) {
      console.error("❌ Error getting user friend requests:", error);
      throw error;
    }
  }
  /**
   * Get pending friend requests for a user (alias for getUserFriendRequests)
   */
  static async getPendingFriendRequests(userId) {
    return await this.getUserFriendRequests(userId);
  }

  /**
   * Check if users are friends
   */
  static async areUsersFriends(userId1, userId2) {
    try {
      console.log(`🤔 Checking if users are friends: ${userId1} & ${userId2}`);

      const userDoc = await getDoc(doc(db, "users", userId1));
      if (!userDoc.exists()) {
        console.warn(`⚠️ User ${userId1} not found`);
        return false;
      }

      const friends = userDoc.data().friends || [];
      const areFriends = friends.includes(userId2);

      console.log(
        `${areFriends ? "✅" : "❌"} Users ${
          areFriends ? "are" : "are not"
        } friends`
      );
      return areFriends;
    } catch (error) {
      console.error("❌ Error checking friendship:", error);
      return false;
    }
  }

  /**
   * Get existing friend request
   */
  static async getExistingFriendRequest(fromUserId, toUserId) {
    try {
      console.log(
        `🔍 Checking for existing request: ${fromUserId} -> ${toUserId}`
      );

      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const exists = !querySnapshot.empty;

      console.log(
        `${exists ? "⚠️" : "✅"} ${
          exists ? "Found existing" : "No existing"
        } request`
      );
      return exists ? querySnapshot.docs[0] : null;
    } catch (error) {
      console.error("❌ Error getting existing friend request:", error);
      return null;
    }
  }

  /**
   * Search users
   */
    static async searchUsers(searchTerm, currentUserId, limit = 10) {
    try {
      console.log(`🔍 Searching users with term: "${searchTerm}"`);

      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);

      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Filter out current user AND check if user has displayName
        if (doc.id !== currentUserId && userData.displayName) {
          const displayName = userData.displayName.toLowerCase();
          const email = userData.email?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          if (displayName.includes(term) || email.includes(term)) {
            users.push({
              uid: doc.id,
              id: doc.id,
              ...userData,
            });
          }
        }
      });

      const results = users.slice(0, limit);
      console.log(`✅ Found ${results.length} users matching "${searchTerm}"`);
      return results;
    } catch (error) {
      console.error("❌ Error searching users:", error);
      throw error;
    }
  }

  /**
   * Find users by email
   */
  static async findUsersByEmail(email) {
    try {
      console.log(`📧 Finding users by email: "${email}"`);

      // Search for users with matching email
      const users = await this.searchUsers(email, "", 50); // Higher limit for email search
      const exactMatches = users.filter(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );

      const partialMatches = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(email.toLowerCase()) &&
          user.email?.toLowerCase() !== email.toLowerCase()
      );

      const results = [...exactMatches, ...partialMatches];
      console.log(`✅ Found ${results.length} users with email "${email}"`);
      return results;
    } catch (error) {
      console.error("❌ Error finding users by email:", error);
      throw error;
    }
  }
}
