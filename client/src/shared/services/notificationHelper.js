import { SettingsService } from '../../dashboard-area/features/settings/services/settingsService';

export class NotificationHelper {
  static async shouldSendNotification(userId, type) {
    try {
      const settings = await SettingsService.getNotificationPreferences(userId);
      return settings[type] && settings.emailNotifications;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return false; // Fail safely - don't send if unsure
    }
  }

  static async sendTripUpdate(userId, tripData) {
    if (await this.shouldSendNotification(userId, 'tripUpdates')) {
      // Add your email/notification service here
      console.log(`Sending trip update to user ${userId}:`, tripData);
      // Example: await emailService.sendTripUpdate(userId, tripData);
    }
  }

  static async sendPhotoTag(userId, photoData) {
    if (await this.shouldSendNotification(userId, 'photoRecognition')) {
      console.log(`Sending photo tag notification to user ${userId}:`, photoData);
      // Example: await emailService.sendPhotoTag(userId, photoData);
    }
  }

  static async checkUserPrivacy(userId, feature) {
    try {
      const privacy = await SettingsService.getPrivacyPreferences(userId);
      return privacy[feature];
    } catch (error) {
      console.error('Error checking privacy settings:', error);
      return false; // Fail safely - respect privacy by default
    }
  }
}