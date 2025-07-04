import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./config";

/**
 * Save face profile metadata to Firestore
 * @param {string} userId - User ID
 * @param {object} profileData - Profile metadata
 * @returns {Promise<void>}
 */
export const saveFaceProfileToStorage = async (userId, profileData) => {
  try {
    const profileRef = doc(db, "faceProfiles", userId);
    await setDoc(profileRef, {
      ...profileData,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error saving face profile to storage:", error);
    throw error;
  }
};

/**
 * Get face profile metadata from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Profile metadata or null if not found
 */
export const getFaceProfileFromStorage = async (userId) => {
  try {
    const profileRef = doc(db, "faceProfiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data();
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting face profile from storage:", error);
    throw error;
  }
};

/**
 * Delete face profile metadata from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteFaceProfileFromStorage = async (userId) => {
  try {
    const profileRef = doc(db, "faceProfiles", userId);
    await deleteDoc(profileRef);
  } catch (error) {
    console.error("❌ Error deleting face profile from storage:", error);
    throw error;
  }
};

/**
 * Update face profile metadata in Firestore
 * @param {string} userId - User ID
 * @param {object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateFaceProfileInStorage = async (userId, updates) => {
  try {
    const profileRef = doc(db, "faceProfiles", userId);
    const existingProfile = await getDoc(profileRef);

    if (!existingProfile.exists()) {
      throw new Error("Face profile not found");
    }

    await setDoc(profileRef, {
      ...existingProfile.data(),
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error updating face profile in storage:", error);
    throw error;
  }
};
