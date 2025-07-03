import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';
import { SettingsService } from '../../dashboard-area/features/settings/services/settingsService';

export class PrivacyService {
  /**
   * Search for users while respecting their privacy settings
   * @param {string} searchTerm - The search term
   * @param {string} currentUserId - The ID of the user performing the search
   * @returns {Array} Filtered users who allow search visibility
   */
  static async searchUsers(searchTerm, currentUserId) {
    try {
      // Get all users first (allowed by Firestore rules)
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const searchableUsers = [];
      
      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Skip current user
        if (userId === currentUserId) continue;
        
        // Check user's privacy settings
        try {
          const privacy = await SettingsService.getPrivacyPreferences(userId);
          
          // Only include users who allow search visibility
          if (privacy.searchVisibility) {
            // Apply search filter
            if (this.matchesSearch(userData, searchTerm)) {
              searchableUsers.push({
                id: userId,
                ...userData
              });
            }
          }
        } catch (error) {
          // If no settings exist (old users), default to searchable for backward compatibility
          console.warn(`No settings for user ${userId}, defaulting to searchable`);
          if (this.matchesSearch(userData, searchTerm)) {
            searchableUsers.push({
              id: userId,
              ...userData
            });
          }
        }
      }
      
      return searchableUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  
  /**
   * Check if a user's data matches the search term
   */
  static matchesSearch(userData, searchTerm) {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    const displayName = (userData.displayName || '').toLowerCase();
    const email = (userData.email || '').toLowerCase();
    
    return displayName.includes(term) || email.includes(term);
  }
  
  /**
   * Check if a user can be found by another user
   * @param {string} targetUserId - User being searched for
   * @param {string} searcherUserId - User performing the search
   * @returns {boolean} Whether the target user can be found
   */
  static async canUserBeFound(targetUserId, searcherUserId) {
    // Users can always find themselves
    if (targetUserId === searcherUserId) return true;
    
    try {
      const privacy = await SettingsService.getPrivacyPreferences(targetUserId);
      return privacy.searchVisibility;
    } catch (error) {
      // Default to findable for backward compatibility
      return true;
    }
  }
  
  /**
   * Get users who allow face recognition
   * @param {Array} userIds - Array of user IDs to check
   * @returns {Array} User IDs who allow face recognition
   */
  static async getUsersWithFaceRecognition(userIds) {
    const allowedUsers = [];
    
    for (const userId of userIds) {
      try {
        const privacy = await SettingsService.getPrivacyPreferences(userId);
        if (privacy.faceRecognition) {
          allowedUsers.push(userId);
        }
      } catch (error) {
        console.warn(`Could not check face recognition setting for user ${userId}`);
        // Don't include user if we can't verify their preference
      }
    }
    
    return allowedUsers;
  }
}