import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

// Create a new trip
export const createTrip = async (tripData) => {
  try {
    const tripRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: tripRef.id,
      ...tripData
    };
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

// Get a trip by ID
export const getTrip = async (tripId) => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    return {
      id: tripDoc.id,
      ...tripDoc.data()
    };
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId, updates) => {
  try {
    await updateDoc(doc(db, 'trips', tripId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: tripId,
      ...updates
    };
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId) => {
  try {
    await deleteDoc(doc(db, 'trips', tripId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (userId) => {
  try {
    const tripsQuery = query(
      collection(db, 'trips'),
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(tripsQuery);
    const trips = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw error;
  }
};

// Add a member to a trip
export const addTripMember = async (tripId, userId) => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripDoc.data();
    const members = tripData.members || [];
    
    if (!members.includes(userId)) {
      members.push(userId);
      await updateDoc(doc(db, 'trips', tripId), {
        members,
        updatedAt: new Date().toISOString()
      });
    }
    
    return {
      id: tripId,
      ...tripData,
      members
    };
  } catch (error) {
    console.error('Error adding trip member:', error);
    throw error;
  }
};