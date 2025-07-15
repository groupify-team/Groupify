/**
 * Unified service for user-related operations
 * Handles friends, requests, and user data management
 */

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
export class UserService {
  static async getUserProfile(userId) {
    try {
      if (!userId) {
        console.error("❌ getUserProfile: No userId provided");
        return null;
      }
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const profile = {
          uid: userId,
          id: userId,
          ...userData,
        };
        return profile;
      }
      console.warn(`⚠️ User profile not found for: ${userId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting user profile for ${userId}:`, error);
      throw error;
    }
  }

  static async getUserProfiles(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
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
      return validProfiles;
    } catch (error) {
      console.error("❌ Error getting user profiles:", error);
      throw error;
    }
  }

  static async sendFriendRequest(fromUserId, toUserId) {
    try {
      if (fromUserId === toUserId) {
        console.warn("⚠️ User cannot send friend request to themselves");
        throw new Error("You cannot send a friend request to yourself");
      }
      const existingRequest = await this.getExistingFriendRequest(
        fromUserId,
        toUserId
      );
      if (existingRequest) {
        console.warn("⚠️ Friend request already exists");
        throw new Error("Friend request already exists");
      }

      const areAlreadyFriends = await this.areUsersFriends(
        fromUserId,
        toUserId
      );
      if (areAlreadyFriends) {
        console.warn("⚠️ Users are already friends");
        throw new Error("Users are already friends");
      }

      const requestRef = await addDoc(collection(db, "friendRequests"), {
        from: fromUserId,
        to: toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      return requestRef.id;
    } catch (error) {
      console.error("❌ Error sending friend request:", error);
      throw error;
    }
  }

  static async acceptFriendRequest(requestId, currentUserId) {
    try {
      if (!requestId || typeof requestId !== "string") {
        console.error("❌ Invalid requestId:", requestId);
        throw new Error("Invalid request ID provided");
      }

      if (!currentUserId || typeof currentUserId !== "string") {
        console.error("❌ Invalid currentUserId:", currentUserId);
        throw new Error("Invalid current user ID provided");
      }

      const requestDoc = await getDoc(doc(db, "friendRequests", requestId));

      if (!requestDoc.exists()) {
        console.error("❌ Friend request document not found:", requestId);

        const q = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUserId),
          where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {});

        throw new Error("Friend request not found");
      }
      const requestData = requestDoc.data();
      if (requestData.to !== currentUserId) {
        console.error("❌ Unauthorized to accept this request");
        throw new Error("Unauthorized to accept this request");
      }
      const fromUserId = requestData.from;
      const toUserId = requestData.to;
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
      await deleteDoc(doc(db, "friendRequests", requestId));
      userStatsCache.invalidateUser(fromUserId);
      userStatsCache.invalidateUser(toUserId);
      return true;
    } catch (error) {
      console.error("❌ Error accepting friend request:", error);
      throw error;
    }
  }

  static async rejectFriendRequest(requestId, currentUserId) {
    try {
      const requestDoc = await getDoc(doc(db, "friendRequests", requestId));
      if (!requestDoc.exists()) {
        console.error("❌ Friend request not found:", requestId);
        throw new Error("Friend request not found");
      }
      const requestData = requestDoc.data();
      if (requestData.to !== currentUserId) {
        console.error("❌ Unauthorized to reject this request");
        throw new Error("Unauthorized to reject this request");
      }
      await deleteDoc(doc(db, "friendRequests", requestId));
      return true;
    } catch (error) {
      console.error("❌ Error rejecting friend request:", error);
      throw error;
    }
  }

  static async cancelFriendRequest(fromUserId, toUserId) {
    try {
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

      await deleteDoc(requestDoc.ref);
      return true;
    } catch (error) {
      console.error("❌ Error canceling friend request:", error);
      throw error;
    }
  }

  static async removeFriend(userId1, userId2) {
    try {
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

      userStatsCache.invalidateUser(userId1);
      userStatsCache.invalidateUser(userId2);

      return true;
    } catch (error) {
      console.error("❌ Error removing friend:", error);
      throw error;
    }
  }

  static async getUserFriends(userId) {
    try {
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

      if (friendIds.length === 0) {
        return [];
      }

      const friendProfiles = [];
      for (const friendId of friendIds) {
        try {
          const friendProfile = await this.getUserProfile(friendId);
          if (friendProfile) {
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

      return friendProfiles;
    } catch (error) {
      console.error("❌ Error getting user friends:", error);
      throw error;
    }
  }

  static async getUserFriendRequests(userId) {
    try {
      if (!userId) {
        console.error("❌ getUserFriendRequests called with no userId");
        return [];
      }

      const q = query(
        collection(db, "friendRequests"),
        where("to", "==", userId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const requests = [];
      for (const requestDoc of querySnapshot.docs) {
        const requestData = requestDoc.data();
        const documentId = requestDoc.id;

        try {
          const senderProfile = await this.getUserProfile(requestData.from);

          if (senderProfile) {
            requests.push({
              id: documentId,
              ...requestData,
              uid: senderProfile.uid || senderProfile.id,
              displayName: senderProfile.displayName,
              email: senderProfile.email,
              photoURL: senderProfile.photoURL,
            });
          } else {
            console.warn(
              `⚠️ Sender profile not found for request: ${documentId}`
            );
            requests.push({
              id: documentId,
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
      return requests;
    } catch (error) {
      console.error("❌ Error getting user friend requests:", error);
      throw error;
    }
  }

  static async getPendingFriendRequests(userId) {
    return await this.getUserFriendRequests(userId);
  }

  static async areUsersFriends(userId1, userId2) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId1));
      if (!userDoc.exists()) {
        console.warn(`⚠️ User ${userId1} not found`);
        return false;
      }

      const friends = userDoc.data().friends || [];
      const areFriends = friends.includes(userId2);

      return areFriends;
    } catch (error) {
      console.error("❌ Error checking friendship:", error);
      return false;
    }
  }

  static async getExistingFriendRequest(fromUserId, toUserId) {
    try {
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const exists = !querySnapshot.empty;

      return exists ? querySnapshot.docs[0] : null;
    } catch (error) {
      console.error("❌ Error getting existing friend request:", error);
      return null;
    }
  }

  static async searchUsers(searchTerm, currentUserId, limit = 10) {
    try {
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
              id: doc.id,
              ...userData,
            });
          }
        }
      });

      const results = users.slice(0, limit);
      return results;
    } catch (error) {
      console.error("❌ Error searching users:", error);
      throw error;
    }
  }

  static async findUsersByEmail(email) {
    try {
      const users = await this.searchUsers(email, "", 50);
      const exactMatches = users.filter(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );

      const partialMatches = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(email.toLowerCase()) &&
          user.email?.toLowerCase() !== email.toLowerCase()
      );

      const results = [...exactMatches, ...partialMatches];
      return results;
    } catch (error) {
      console.error("❌ Error finding users by email:", error);
      throw error;
    }
  }
}
