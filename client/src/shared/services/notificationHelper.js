import { SettingsService } from "../../dashboard-area/features/settings/services/settingsService";

export class NotificationHelper {
  static async shouldSendNotification(userId, type) {
    try {
      const settings = await SettingsService.getNotificationPreferences(userId);
      return settings[type] && settings.emailNotifications;
    } catch (error) {
      console.error("Error checking notification settings:", error);
      return false;
    }
  }

  static async checkUserPrivacy(userId, feature) {
    try {
      const privacy = await SettingsService.getPrivacyPreferences(userId);
      return privacy[feature];
    } catch (error) {
      console.error("Error checking privacy settings:", error);
      return false;
    }
  }
}
