// shared/services/deleteAccountService.js
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { ref, deleteObject, listAll } from "firebase/storage";
import { db, storage } from "../../../../shared/services/firebase/config";

export class DeleteAccountService {
  /**
   * Delete user account and all associated data
   * @param {Object} currentUser - Firebase Auth user object
   * @param {string} password - User's current password for reauthentication
   * @returns {Promise<boolean>} Success status
   */
  static async deleteAccount(currentUser, password) {
    if (!currentUser) {
      throw new Error("No user authenticated");
    }

    const userId = currentUser.uid;

    try {

      const finalExport = await this.createFinalExport(userId);

      await this.deleteFirestoreData(userId);

      await this.deleteStorageFiles(userId);

      await deleteUser(currentUser);

      return { success: true, finalExport };
    } catch (error) {
      console.error("❌ Account deletion failed:", error);
      throw error;
    }
  }

  /**
   * Reauthenticate user with password
   * @param {Object} currentUser - Firebase Auth user
   * @param {string} password - User's password
   */
  static async reauthenticateUser(currentUser, password) {
    if (!currentUser.email) {
      throw new Error("User email not available for reauthentication");
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password
    );
    await reauthenticateWithCredential(currentUser, credential);
  }

  /**
   * Create final export of user data before deletion
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Final export data
   */
  static async createFinalExport(userId) {
    try {
      // Import ExportService dynamically to avoid circular dependencies
      const { ExportService } = await import(
        "../../../../shared/services/exportService"
      );
      return await ExportService.exportUserData(userId);
    } catch (error) {
      console.warn("Could not create final export:", error);
      return null;
    }
  }

  /**
   * Delete all user data from Firestore
   * @param {string} userId - User ID
   */
  static async deleteFirestoreData(userId) {
    const batch = writeBatch(db);
    let batchCount = 0;

    // Helper function to execute batch when it gets too large
    const executeBatchIfNeeded = async () => {
      if (batchCount >= 450) {
        // Firestore batch limit is 500
        await batch.commit();
        batchCount = 0;
      }
    };

    // Delete user settings
    const settingsRef = doc(db, "userSettings", userId);
    batch.delete(settingsRef);
    batchCount++;

    // Delete face profile
    const faceProfileRef = doc(db, "faceProfiles", userId);
    batch.delete(faceProfileRef);
    batchCount++;

    // Delete user document
    const userRef = doc(db, "users", userId);
    batch.delete(userRef);
    batchCount++;

    // Delete friend requests (sent and received)
    const sentRequestsQuery = query(
      collection(db, "friendRequests"),
      where("from", "==", userId)
    );
    const receivedRequestsQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", userId)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentRequestsQuery),
      getDocs(receivedRequestsQuery),
    ]);

    [...sentSnapshot.docs, ...receivedSnapshot.docs].forEach((doc) => {
      batch.delete(doc.ref);
      batchCount++;
    });

    await executeBatchIfNeeded();

    // Delete photos uploaded by user
    const photosQuery = query(
      collection(db, "photos"),
      where("uploadedBy", "==", userId)
    );
    const photosSnapshot = await getDocs(photosQuery);

    photosSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      batchCount++;
    });

    await executeBatchIfNeeded();

    // Handle events - delete if user is creator, remove from members if not
    const eventsQuery = query(
      collection(db, "events"),
      where("members", "array-contains", userId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      if (eventData.createdBy === userId) {
        // User is event creator - delete entire event
        batch.delete(eventDoc.ref);
        batchCount++;

        // Also delete all event invites for this event
        const eventInvitesQuery = query(
          collection(db, "eventInvites"),
          where("eventId", "==", eventDoc.id)
        );
        const eventInvitesSnapshot = await getDocs(eventInvitesQuery);

        eventInvitesSnapshot.docs.forEach((inviteDoc) => {
          batch.delete(inviteDoc.ref);
          batchCount++;
        });
      } else {
        // User is just a member - remove from members array
        const updatedMembers = eventData.members.filter(
          (member) => member !== userId
        );
        batch.update(eventDoc.ref, {
          members: updatedMembers,
          updatedAt: new Date(),
        });
        batchCount++;
      }

      await executeBatchIfNeeded();
    }

    // Delete event invites sent by or to the user
    const sentInvitesQuery = query(
      collection(db, "eventInvites"),
      where("inviterUid", "==", userId)
    );
    const receivedInvitesQuery = query(
      collection(db, "eventInvites"),
      where("inviteeUid", "==", userId)
    );

    const [sentInvitesSnapshot, receivedInvitesSnapshot] = await Promise.all([
      getDocs(sentInvitesQuery),
      getDocs(receivedInvitesQuery),
    ]);

    [...sentInvitesSnapshot.docs, ...receivedInvitesSnapshot.docs].forEach(
      (doc) => {
        batch.delete(doc.ref);
        batchCount++;
      }
    );

    await executeBatchIfNeeded();

    // Remove user from friends lists of other users
    const allUsersQuery = query(
      collection(db, "users"),
      where("friends", "array-contains", userId)
    );
    const allUsersSnapshot = await getDocs(allUsersQuery);

    allUsersSnapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();
      const updatedFriends = userData.friends.filter(
        (friend) => friend !== userId
      );
      batch.update(userDoc.ref, {
        friends: updatedFriends,
        updatedAt: new Date(),
      });
      batchCount++;
    });

    // Execute final batch
    if (batchCount > 0) {
      await batch.commit();
    }
  }

  /**
   * Delete all user files from Firebase Storage
   * @param {string} userId - User ID
   */
  static async deleteStorageFiles(userId) {
    try {
      // Delete user's photos folder
      const photosRef = ref(storage, `photos/${userId}`);
      await this.deleteStorageFolder(photosRef);

      // Delete user's face profile images
      const faceProfileRef = ref(storage, `faceProfiles/${userId}`);
      await this.deleteStorageFolder(faceProfileRef);

      // Delete user's profile images
      const profileRef = ref(storage, `profiles/${userId}`);
      await this.deleteStorageFolder(profileRef);
    } catch (error) {
      console.warn("⚠️ Some storage files could not be deleted:", error);
      // Don't throw here - continue with account deletion even if some files remain
    }
  }

  /**
   * Recursively delete a storage folder and all its contents
   * @param {StorageReference} folderRef - Storage folder reference
   */
  static async deleteStorageFolder(folderRef) {
    try {
      const listResult = await listAll(folderRef);

      // Delete all files in the folder
      const deletePromises = listResult.items.map((item) => deleteObject(item));
      await Promise.all(deletePromises);

      // Recursively delete subfolders
      const subfolderPromises = listResult.prefixes.map((prefix) =>
        this.deleteStorageFolder(prefix)
      );
      await Promise.all(subfolderPromises);
    } catch (error) {
      console.warn("Could not delete storage folder:", error);
    }
  }

  /**
   * Check if user needs to reauthenticate (for security)
   * @param {Object} currentUser - Firebase Auth user
   * @returns {boolean} Whether reauthentication is needed
   */
  static needsReauthentication(currentUser) {
    if (!currentUser?.metadata?.lastSignInTime) return true;

    const lastSignIn = new Date(currentUser.metadata.lastSignInTime);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return lastSignIn < fiveMinutesAgo;
  }

    /**
   * Get summary of data that will be deleted
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion summary
   */
  static async getDeletionSummary(userId) {
    try {
      const summary = {
        events: 0,
        photos: 0,
        friends: 0,
        friendRequests: 0,
        settings: false,
        faceProfile: false,
      };

      // Count events
      const eventsQuery = query(
        collection(db, "events"),
        where("members", "array-contains", userId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      summary.events = eventsSnapshot.size;

      // Count photos
      const photosQuery = query(
        collection(db, "photos"),
        where("uploadedBy", "==", userId)
      );
      const photosSnapshot = await getDocs(photosQuery);
      summary.photos = photosSnapshot.size;

      // Count friends
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        summary.friends = userDoc.data().friends?.length || 0;
      }

      // Count friend requests
      const sentRequestsQuery = query(
        collection(db, "friendRequests"),
        where("from", "==", userId)
      );
      const receivedRequestsQuery = query(
        collection(db, "friendRequests"),
        where("to", "==", userId)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentRequestsQuery),
        getDocs(receivedRequestsQuery),
      ]);

      summary.friendRequests = sentSnapshot.size + receivedSnapshot.size;

      // Check settings
      const settingsDocRef = doc(db, "userSettings", userId);
      const settingsDoc = await getDoc(settingsDocRef);
      summary.settings = settingsDoc.exists();

      // Check face profile
      const faceProfileDocRef = doc(db, "faceProfiles", userId);
      const faceProfileDoc = await getDoc(faceProfileDocRef);
      summary.faceProfile = faceProfileDoc.exists();

      return summary;
    } catch (error) {
      console.error("Error getting deletion summary:", error);
      return null;
    }
  }
}
