import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

// Create or update user profile in Firestore
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      // Create new user profile
      const createdAt = new Date().toISOString();
      await setDoc(userRef, {
        uid,
        ...userData,
        createdAt,
        trips: [],
        photoCount: 0
      });
    }
    
    return userRef;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Find users by email
export const findUsersByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error finding users:', error);
    throw error;
  }
};