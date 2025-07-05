// src/dashboard-area/features/settings/services/settingsService.js
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { DEFAULT_USER_SETTINGS } from "../constants/settingsConstants";

export class SettingsService {
  static async getUserSettings(userId) {
    try {
      const settingsRef = doc(db, "userSettings", userId);

      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        return settingsSnap.data();
      } else {
        await this.createDefaultSettings(userId);
        return DEFAULT_USER_SETTINGS;
      }
    } catch (error) {
      console.error("❌ Error fetching user settings:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return DEFAULT_USER_SETTINGS;
    }
  }

  static async createDefaultSettings(userId) {
    try {
      const settingsRef = doc(db, "userSettings", userId);

      const settingsData = {
        ...DEFAULT_USER_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(settingsRef, settingsData);

      return DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error("❌ Error creating default settings:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }
  }

  static async updateSetting(userId, category, settingId, value) {
    try {
      const settingsRef = doc(db, "userSettings", userId);

      const updatePath = `${category}.${settingId}`;

      const updateData = {
        [updatePath]: value,
        updatedAt: new Date(),
      };

      await updateDoc(settingsRef, updateData);

      return true;
    } catch (error) {
      console.error("❌ Error updating setting:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Full error object:", error);
      throw error;
    }
  }

  static async updateSettings(userId, updates) {
    try {
      const settingsRef = doc(db, "userSettings", userId);

      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("❌ Error updating settings:", error);
      throw error;
    }
  }

  static async getNotificationPreferences(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.notifications || DEFAULT_USER_SETTINGS.notifications;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return DEFAULT_USER_SETTINGS.notifications;
    }
  }

  static async getPrivacyPreferences(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.privacy || DEFAULT_USER_SETTINGS.privacy;
    } catch (error) {
      console.error("Error fetching privacy preferences:", error);
      return DEFAULT_USER_SETTINGS.privacy;
    }
  }
}