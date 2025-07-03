// dashboard-area/features/settings/services/settingsService.js
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../shared/services/firebase/config';
import { DEFAULT_USER_SETTINGS } from '../../../utils/dashboardConstants';

export class SettingsService {
  static async getUserSettings(userId) {
    console.log('🔍 getUserSettings called with userId:', userId);
    
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      console.log('📄 Firestore document path:', settingsRef.path);
      
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        console.log('✅ Settings document found:', settingsSnap.data());
        return settingsSnap.data();
      } else {
        console.log('❌ No settings document found, creating default settings...');
        await this.createDefaultSettings(userId);
        return DEFAULT_USER_SETTINGS;
      }
    } catch (error) {
      console.error('❌ Error fetching user settings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return DEFAULT_USER_SETTINGS;
    }
  }

  static async createDefaultSettings(userId) {
    console.log('🏗️ Creating default settings for user:', userId);
    
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      console.log('📄 Creating document at path:', settingsRef.path);
      
      const settingsData = {
        ...DEFAULT_USER_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('📝 Settings data to save:', settingsData);
      
      await setDoc(settingsRef, settingsData);
      console.log('✅ Default settings created successfully');
      
      return DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error('❌ Error creating default settings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  static async updateSetting(userId, category, settingId, value) {
    console.log('🔄 updateSetting called:', {
      userId,
      category,
      settingId,
      value
    });
    
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      console.log('📄 Updating document at path:', settingsRef.path);
      
      const updatePath = `${category}.${settingId}`;
      console.log('🎯 Update path:', updatePath);
      
      const updateData = {
        [updatePath]: value,
        updatedAt: new Date(),
      };
      
      console.log('📝 Update data:', updateData);
      
      await updateDoc(settingsRef, updateData);
      console.log('✅ Setting updated successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      throw error;
    }
  }

  static async updateSettings(userId, updates) {
    console.log('🔄 updateSettings called:', { userId, updates });
    
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: new Date(),
      });
      
      console.log('✅ Settings updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  static async getNotificationPreferences(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.notifications || DEFAULT_USER_SETTINGS.notifications;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return DEFAULT_USER_SETTINGS.notifications;
    }
  }

  static async getPrivacyPreferences(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.privacy || DEFAULT_USER_SETTINGS.privacy;
    } catch (error) {
      console.error('Error fetching privacy preferences:', error);
      return DEFAULT_USER_SETTINGS.privacy;
    }
  }
}