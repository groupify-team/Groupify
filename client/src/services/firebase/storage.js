import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { storage, db } from './config';
import { v4 as uuidv4 } from 'uuid';

// Upload a photo to Firebase Storage and save metadata to Firestore
export const uploadPhoto = async (file, tripId, userId, metadata = {}) => {
  try {
    // Create a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `photos/${tripId}/${fileName}`;
    
    // Create a reference to Firebase Storage
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Save metadata to Firestore
    const photoData = {
      fileName,
      filePath: storagePath,
      downloadURL,
      uploadedBy: userId,
      tripId,
      uploadedAt: new Date().toISOString(),
      ...metadata
    };
    
    const docRef = await addDoc(collection(db, 'photos'), photoData);
    
    return {
      id: docRef.id,
      ...photoData
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Get all photos for a specific trip
export const getTripPhotos = async (tripId) => {
  try {
    const photosQuery = query(
      collection(db, 'photos'),
      where('tripId', '==', tripId)
    );
    
    const querySnapshot = await getDocs(photosQuery);
    const photos = [];
    
    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by upload date (newest first)
    return photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  } catch (error) {
    console.error('Error getting trip photos:', error);
    throw error;
  }
};

// Get all photos for a specific user
export const getUserPhotos = async (userId) => {
  try {
    const photosQuery = query(
      collection(db, 'photos'),
      where('uploadedBy', '==', userId)
    );
    
    const querySnapshot = await getDocs(photosQuery);
    const photos = [];
    
    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  } catch (error) {
    console.error('Error getting user photos:', error);
    throw error;
  }
};