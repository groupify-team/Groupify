// shared/services/exportService.js
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase/config";
import { SettingsService } from "../../dashboard-area/features/settings/services/settingsService";

export class ExportService {
  /**
   * Export all user data as JSON
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Complete user data export
   */
  static async exportUserData(userId) {
    try {
      const exportData = {
        exportInfo: {
          userId,
          exportDate: new Date().toISOString(),
          version: "1.0.0",
          appName: "Groupify",
        },
        userData: {},
        settings: {},
        trips: [],
        photos: [],
        friends: [],
        friendRequests: [],
        faceProfile: null,
        statistics: {},
      };

      // Get user profile
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        exportData.userData = userDoc.data();
      }

      // Get user settings
      try {
        exportData.settings = await SettingsService.getUserSettings(userId);
      } catch (error) {
        console.warn("Could not export settings:", error);
        exportData.settings = { error: "Could not access settings" };
      }

      // Get user's trips
      const tripsQuery = query(
        collection(db, "trips"),
        where("members", "array-contains", userId)
      );
      const tripsSnapshot = await getDocs(tripsQuery);
      exportData.trips = tripsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get user's photos
      const photosQuery = query(
        collection(db, "photos"),
        where("uploadedBy", "==", userId)
      );
      const photosSnapshot = await getDocs(photosQuery);
      exportData.photos = photosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get friend requests
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

      exportData.friendRequests = {
        sent: sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        received: receivedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };

      // Get face profile
      try {
        const faceProfileDoc = await getDoc(doc(db, "faceProfiles", userId));
        if (faceProfileDoc.exists()) {
          exportData.faceProfile = faceProfileDoc.data();
        }
      } catch (error) {
        console.warn("Could not export face profile:", error);
      }

      // Get friends list
      if (
        exportData.userData.friends &&
        exportData.userData.friends.length > 0
      ) {
        const friendsData = [];
        for (const friendId of exportData.userData.friends) {
          try {
            const friendDoc = await getDoc(doc(db, "users", friendId));
            if (friendDoc.exists()) {
              friendsData.push({
                id: friendId,
                displayName: friendDoc.data().displayName,
                email: friendDoc.data().email,
                photoURL: friendDoc.data().photoURL,
                friendSince: friendDoc.data().createdAt,
              });
            }
          } catch (error) {
            console.warn(`Could not export friend ${friendId}:`, error);
          }
        }
        exportData.friends = friendsData;
      }

      // Calculate statistics
      exportData.statistics = {
        totalTrips: exportData.trips.length,
        totalPhotos: exportData.photos.length,
        totalFriends: exportData.friends.length,
        pendingFriendRequests:
          exportData.friendRequests.sent.length +
          exportData.friendRequests.received.length,
        accountAge: exportData.userData.createdAt
          ? this.calculateAccountAge(exportData.userData.createdAt)
          : "Unknown",
        lastActive: exportData.userData.lastLoginAt || "Unknown",
      };

      return exportData;
    } catch (error) {
      console.error("❌ Error exporting user data:", error);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  /**
   * Download data as JSON file
   * @param {string} userId - User ID
   * @param {string} filename - Optional filename
   */
  static async downloadUserData(userId, filename = null) {
    try {
      const exportData = await this.exportUserData(userId);

      // Create filename if not provided
      if (!filename) {
        const date = new Date().toISOString().split("T")[0];
        filename = `groupify-data-export-${date}.json`;
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("❌ Error downloading user data:", error);
      throw error;
    }
  }

  /**
   * Create a backup of user data with metadata
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Backup data with metadata
   */
  static async createBackup(userId) {
    try {
      const exportData = await this.exportUserData(userId);

      // Add backup-specific metadata
      const backupData = {
        ...exportData,
        backupInfo: {
          ...exportData.exportInfo,
          backupType: "full",
          backupId: this.generateBackupId(),
          backupDate: new Date().toISOString(),
          dataIntegrity: {
            totalRecords: this.countRecords(exportData),
            checksum: this.generateChecksum(exportData),
          },
        },
      };

      return backupData;
    } catch (error) {
      console.error("❌ Error creating backup:", error);
      throw error;
    }
  }

  /**
   * Download backup as JSON file
   * @param {string} userId - User ID
   */
  static async downloadBackup(userId) {
    try {
      const backupData = await this.createBackup(userId);

      const date = new Date().toISOString().split("T")[0];
      const filename = `groupify-backup-${date}-${backupData.backupInfo.backupId}.json`;

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("❌ Error downloading backup:", error);
      throw error;
    }
  }

  /**
   * Export data in CSV format for spreadsheet apps
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data to export ('trips', 'photos', 'friends')
   */
  static async exportToCSV(userId, dataType = "trips") {
    try {
      const exportData = await this.exportUserData(userId);
      let csvData = "";
      let filename = "";

      switch (dataType) {
        case "trips":
          csvData = this.convertTripsToCSV(exportData.trips);
          filename = `groupify-trips-${
            new Date().toISOString().split("T")[0]
          }.csv`;
          break;
        case "photos":
          csvData = this.convertPhotosToCSV(exportData.photos);
          filename = `groupify-photos-${
            new Date().toISOString().split("T")[0]
          }.csv`;
          break;
        case "friends":
          csvData = this.convertFriendsToCSV(exportData.friends);
          filename = `groupify-friends-${
            new Date().toISOString().split("T")[0]
          }.csv`;
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      // Download CSV
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("❌ Error exporting CSV:", error);
      throw error;
    }
  }

  // Helper methods
  static calculateAccountAge(createdAt) {
    const created = new Date(
      createdAt.seconds ? createdAt.seconds * 1000 : createdAt
    );
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  static generateBackupId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  static countRecords(data) {
    return (
      (data.trips?.length || 0) +
      (data.photos?.length || 0) +
      (data.friends?.length || 0) +
      (data.friendRequests?.sent?.length || 0) +
      (data.friendRequests?.received?.length || 0)
    );
  }

  static generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  static convertTripsToCSV(trips) {
    if (!trips || trips.length === 0) return "No trips data available";

    const headers = [
      "ID",
      "Name",
      "Description",
      "Start Date",
      "End Date",
      "Location",
      "Created By",
      "Members Count",
      "Photos Count",
    ];
    const rows = trips.map((trip) => [
      trip.id,
      trip.name || "",
      trip.description || "",
      trip.startDate
        ? new Date(trip.startDate.seconds * 1000).toLocaleDateString()
        : "",
      trip.endDate
        ? new Date(trip.endDate.seconds * 1000).toLocaleDateString()
        : "",
      trip.location || "",
      trip.createdBy || "",
      trip.members?.length || 0,
      trip.photos?.length || 0,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  static convertPhotosToCSV(photos) {
    if (!photos || photos.length === 0) return "No photos data available";

    const headers = [
      "ID",
      "Filename",
      "Upload Date",
      "Trip ID",
      "Uploaded By",
      "File Size",
      "Tags Count",
    ];
    const rows = photos.map((photo) => [
      photo.id,
      photo.fileName || "",
      photo.uploadedAt
        ? new Date(photo.uploadedAt.seconds * 1000).toLocaleDateString()
        : "",
      photo.tripId || "",
      photo.uploadedBy || "",
      photo.fileSize || "",
      photo.tags?.length || 0,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  static convertFriendsToCSV(friends) {
    if (!friends || friends.length === 0) return "No friends data available";

    const headers = ["ID", "Display Name", "Email", "Friend Since"];
    const rows = friends.map((friend) => [
      friend.id,
      friend.displayName || "",
      friend.email || "",
      friend.friendSince
        ? new Date(friend.friendSince.seconds * 1000).toLocaleDateString()
        : "",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }
}
