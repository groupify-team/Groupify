// dashboard-area/features/friends/services/friendsService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../shared/services/firebase/config';
import { PrivacyService } from '../../../../shared/services/privacyService';

export class FriendsService {
  /**
   * Send a friend request
   * @param {string} fromUserId - User sending the request
   * @param {string} toUserId - User receiving the request
   * @returns {Promise<string>} Request ID
   */
  static async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Check if target user allows being found
      const canBeFound = await PrivacyService.canUserBeFound(toUserId, fromUserId);
      if (!canBeFound) {
        throw new Error('User cannot be found');
      }

      // Check if request already exists
      const existingRequest = await this.getExistingRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Friend request already exists');
      }

      // Check if already friends
      const areAlreadyFriends = await this.areUsersFriends(fromUserId, toUserId);
      if (areAlreadyFriends) {
        throw new Error('Users are already friends');
      }

      // Create friend request
      const requestRef = await addDoc(collection(db, 'friendRequests'), {
        from: fromUserId,
        to: toUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      return requestRef.id;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   * @param {string} requestId - Friend request ID
   * @param {string} currentUserId - User accepting the request
   * @returns {Promise<boolean>} Success status
   */
  static async acceptFriendRequest(requestId, currentUserId) {
    try {
      // Get the friend request
      const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();
      
      // Verify the current user is the recipient
      if (requestData.to !== currentUserId) {
        throw new Error('Unauthorized to accept this request');
      }

      const fromUserId = requestData.from;
      const toUserId = requestData.to;

      // Add each user to the other's friends list
      await Promise.all([
        updateDoc(doc(db, 'users', fromUserId), {
          friends: arrayUnion(toUserId),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'users', toUserId), {
          friends: arrayUnion(fromUserId),
          updatedAt: serverTimestamp(),
        }),
      ]);

      // Delete the friend request
      await deleteDoc(doc(db, 'friendRequests', requestId));

      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   * @param {string} requestId - Friend request ID
   * @param {string} currentUserId - User declining the request
   * @returns {Promise<boolean>} Success status
   */
  static async declineFriendRequest(requestId, currentUserId) {
    try {
      // Get the friend request
      const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();
      
      // Verify the current user is the recipient
      if (requestData.to !== currentUserId) {
        throw new Error('Unauthorized to decline this request');
      }

      // Simply delete the friend request
      await deleteDoc(doc(db, 'friendRequests', requestId));

      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Remove a friend
   * @param {string} currentUserId - Current user ID
   * @param {string} friendUserId - Friend to remove
   * @returns {Promise<boolean>} Success status
   */
  static async removeFriend(currentUserId, friendUserId) {
    try {
      // Remove each user from the other's friends list
      await Promise.all([
        updateDoc(doc(db, 'users', currentUserId), {
          friends: arrayRemove(friendUserId),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'users', friendUserId), {
          friends: arrayRemove(currentUserId),
          updatedAt: serverTimestamp(),
        }),
      ]);

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  /**
   * Get user's friends list with their data
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of friend objects
   */
  static async getUserFriends(userId) {
    try {
      // Get user document to get friends array
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }

      const friendIds = userDoc.data().friends || [];
      if (friendIds.length === 0) {
        return [];
      }

      // Get friend details
      const friends = [];
      for (const friendId of friendIds) {
        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            friends.push({
              id: friendId,
              ...friendDoc.data(),
            });
          }
        } catch (error) {
          console.warn(`Could not fetch friend ${friendId}:`, error);
        }
      }

      return friends;
    } catch (error) {
      console.error('Error getting user friends:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Object with sent and received requests
   */
  static async getPendingRequests(userId) {
    try {
      // Get requests sent by user
      const sentQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      // Get requests received by user
      const receivedQuery = query(
        collection(db, 'friendRequests'),
        where('to', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery),
      ]);

      // Process sent requests
      const sentRequests = [];
      for (const doc of sentSnapshot.docs) {
        const requestData = doc.data();
        try {
          const toUserDoc = await getDoc(doc(db, 'users', requestData.to));
          if (toUserDoc.exists()) {
            sentRequests.push({
              id: doc.id,
              ...requestData,
              toUser: toUserDoc.data(),
            });
          }
        } catch (error) {
          console.warn(`Could not fetch user data for sent request ${doc.id}`);
        }
      }

      // Process received requests
      const receivedRequests = [];
      for (const doc of receivedSnapshot.docs) {
        const requestData = doc.data();
        try {
          const fromUserDoc = await getDoc(doc(db, 'users', requestData.from));
          if (fromUserDoc.exists()) {
            receivedRequests.push({
              id: doc.id,
              ...requestData,
              fromUser: fromUserDoc.data(),
            });
          }
        } catch (error) {
          console.warn(`Could not fetch user data for received request ${doc.id}`);
        }
      }

      return {
        sent: sentRequests,
        received: receivedRequests,
      };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return { sent: [], received: [] };
    }
  }

  /**
   * Search for users to add as friends (privacy-aware)
   * @param {string} searchTerm - Search term
   * @param {string} currentUserId - Current user ID
   * @returns {Promise<Array>} Array of searchable users
   */
  static async searchUsersToAddAsFriends(searchTerm, currentUserId) {
    try {
      // Use privacy-aware search
      const searchableUsers = await PrivacyService.searchUsers(searchTerm, currentUserId);
      
      // Get current user's friends to filter them out
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const currentUserFriends = currentUserDoc.data()?.friends || [];
      
      // Filter out existing friends and pending requests
      const pendingRequests = await this.getPendingRequests(currentUserId);
      const pendingUserIds = [
        ...pendingRequests.sent.map(req => req.to),
        ...pendingRequests.received.map(req => req.from)
      ];
      
      return searchableUsers.filter(user => 
        !currentUserFriends.includes(user.id) && 
        !pendingUserIds.includes(user.id)
      );
    } catch (error) {
      console.error('Error searching users for friends:', error);
      return [];
    }
  }

  /**
   * Check if two users are friends
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<boolean>} Whether users are friends
   */
  static async areUsersFriends(userId1, userId2) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId1));
      if (!userDoc.exists()) return false;

      const friends = userDoc.data().friends || [];
      return friends.includes(userId2);
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  }

  /**
   * Check if a friend request exists between two users
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Recipient user ID
   * @returns {Promise<Object|null>} Existing request or null
   */
  static async getExistingRequest(fromUserId, toUserId) {
    try {
      // Check for request in either direction
      const queries = [
        query(
          collection(db, 'friendRequests'),
          where('from', '==', fromUserId),
          where('to', '==', toUserId),
          where('status', '==', 'pending')
        ),
        query(
          collection(db, 'friendRequests'),
          where('from', '==', toUserId),
          where('to', '==', fromUserId),
          where('status', '==', 'pending')
        ),
      ];

      for (const q of queries) {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking existing request:', error);
      return null;
    }
  }

  /**
   * Get friend count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of friends
   */
  static async getFriendCount(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return 0;

      const friends = userDoc.data().friends || [];
      return friends.length;
    } catch (error) {
      console.error('Error getting friend count:', error);
      return 0;
    }
  }

  /**
   * Get mutual friends between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Array>} Array of mutual friends
   */
  static async getMutualFriends(userId1, userId2) {
    try {
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, 'users', userId1)),
        getDoc(doc(db, 'users', userId2)),
      ]);

      if (!user1Doc.exists() || !user2Doc.exists()) return [];

      const user1Friends = user1Doc.data().friends || [];
      const user2Friends = user2Doc.data().friends || [];

      const mutualFriendIds = user1Friends.filter(friendId => 
        user2Friends.includes(friendId)
      );

      // Get mutual friends data
      const mutualFriends = [];
      for (const friendId of mutualFriendIds) {
        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            mutualFriends.push({
              id: friendId,
              ...friendDoc.data(),
            });
          }
        } catch (error) {
          console.warn(`Could not fetch mutual friend ${friendId}`);
        }
      }

      return mutualFriends;
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      return [];
    }
  }
}